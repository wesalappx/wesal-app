import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// User Action Logging API
// Receives batched logs from frontend
// ============================================

export const dynamic = 'force-dynamic';

// Rate limiting (in-memory, reset on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // Max logs per minute per IP
const RATE_LIMIT_WINDOW = 60000; // 1 minute

interface LogEntry {
    actionType: string;
    actionName: string;
    pagePath?: string;
    component?: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
    isError?: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorStack?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}

interface LogBatch {
    logs: LogEntry[];
    sessionId: string;
    userId?: string;
    coupleId?: string;
    deviceInfo?: {
        browser: string;
        os: string;
        screenWidth: number;
        screenHeight: number;
        language: string;
        timezone: string;
    };
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }
    return '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const ip = getClientIp(request);
        const userAgent = request.headers.get('user-agent') || '';

        // Rate limiting
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        }

        const body: LogBatch = await request.json();

        // Validate payload
        if (!body.logs || !Array.isArray(body.logs) || body.logs.length === 0) {
            return NextResponse.json(
                { error: 'Invalid payload: logs array required' },
                { status: 400 }
            );
        }

        // Limit batch size
        const logs = body.logs.slice(0, 50);

        // Create Supabase client with service role for insert
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Prepare log entries
        const logEntries = logs.map(log => ({
            user_id: body.userId || null,
            couple_id: body.coupleId || null,
            session_id: body.sessionId || null,
            action_type: log.actionType,
            action_name: log.actionName,
            page_path: log.pagePath || null,
            component: log.component || null,
            request_data: log.requestData || {},
            response_data: log.responseData || {},
            is_error: log.isError || false,
            error_code: log.errorCode || null,
            error_message: log.errorMessage || null,
            error_stack: process.env.NODE_ENV === 'development' ? log.errorStack : null,
            duration_ms: log.durationMs || null,
            device_info: body.deviceInfo || {},
            ip_address: ip,
            user_agent: userAgent,
            metadata: log.metadata || {},
        }));

        // Insert logs
        const { error } = await supabase
            .from('user_action_logs')
            .insert(logEntries);

        if (error) {
            console.error('[Logs API] Insert error:', error);
            // Don't expose internal errors
            return NextResponse.json({ received: false }, { status: 500 });
        }

        return NextResponse.json({
            received: true,
            count: logs.length,
        });

    } catch (error) {
        console.error('[Logs API] Error:', error);
        return NextResponse.json({ received: false }, { status: 500 });
    }
}
