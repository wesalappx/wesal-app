import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ============================================
// Admin Logs API
// Fetch and filter action logs for admin dashboard
// ============================================

export const dynamic = 'force-dynamic';

interface LogFilters {
    actionType?: string;
    actionName?: string;
    userId?: string;
    sessionId?: string;
    isError?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export async function GET(request: NextRequest) {
    try {
        // Verify admin session
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;

        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const filters: LogFilters = {
            actionType: searchParams.get('actionType') || undefined,
            actionName: searchParams.get('actionName') || undefined,
            userId: searchParams.get('userId') || undefined,
            sessionId: searchParams.get('sessionId') || undefined,
            isError: searchParams.get('isError') === 'true' ? true : undefined,
            startDate: searchParams.get('startDate') || undefined,
            endDate: searchParams.get('endDate') || undefined,
            search: searchParams.get('search') || undefined,
            page: parseInt(searchParams.get('page') || '1'),
            limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
        };

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Build query
        let query = supabase
            .from('user_action_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.actionType) {
            query = query.eq('action_type', filters.actionType);
        }
        if (filters.actionName) {
            query = query.ilike('action_name', `%${filters.actionName}%`);
        }
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.sessionId) {
            query = query.eq('session_id', filters.sessionId);
        }
        if (filters.isError !== undefined) {
            query = query.eq('is_error', filters.isError);
        }
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }
        if (filters.search) {
            query = query.or(`action_name.ilike.%${filters.search}%,component.ilike.%${filters.search}%,page_path.ilike.%${filters.search}%,error_message.ilike.%${filters.search}%`);
        }

        // Pagination
        const offset = ((filters.page || 1) - 1) * (filters.limit || 50);
        query = query.range(offset, offset + (filters.limit || 50) - 1);

        const { data: logs, error, count } = await query;

        if (error) {
            console.error('[Admin Logs API] Query error:', error);
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        // Fetch statistics
        const { data: stats } = await supabase.rpc('get_log_stats');

        return NextResponse.json({
            logs: logs || [],
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 50,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / (filters.limit || 50)),
            },
            stats: stats || null,
        });

    } catch (error) {
        console.error('[Admin Logs API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Get log statistics
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;

        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action } = await request.json();

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (action === 'get_stats') {
            // Get action type breakdown
            const { data: typeStats } = await supabase
                .from('user_action_logs')
                .select('action_type')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            // Count by type
            const typeCounts: Record<string, number> = {};
            (typeStats || []).forEach((log: { action_type: string }) => {
                typeCounts[log.action_type] = (typeCounts[log.action_type] || 0) + 1;
            });

            // Get error count
            const { count: errorCount } = await supabase
                .from('user_action_logs')
                .select('*', { count: 'exact', head: true })
                .eq('is_error', true)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            // Get unique sessions
            const { data: sessions } = await supabase
                .from('user_action_logs')
                .select('session_id')
                .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
                .not('session_id', 'is', null);

            const uniqueSessions = new Set((sessions || []).map((s: { session_id: string }) => s.session_id)).size;

            // Get hourly breakdown for chart
            const { data: hourlyData } = await supabase
                .from('user_action_logs')
                .select('created_at, is_error')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: true });

            // Group by hour
            const hourlyStats: { hour: string; total: number; errors: number }[] = [];
            const hourMap = new Map<string, { total: number; errors: number }>();

            (hourlyData || []).forEach((log: { created_at: string; is_error: boolean }) => {
                const hour = new Date(log.created_at).toISOString().slice(0, 13);
                const current = hourMap.get(hour) || { total: 0, errors: 0 };
                current.total++;
                if (log.is_error) current.errors++;
                hourMap.set(hour, current);
            });

            hourMap.forEach((stats, hour) => {
                hourlyStats.push({ hour, ...stats });
            });

            return NextResponse.json({
                typeCounts,
                errorCount: errorCount || 0,
                activeSessions: uniqueSessions,
                hourlyStats,
                totalLogs24h: (typeStats || []).length,
            });
        }

        if (action === 'cleanup') {
            const { daysToKeep = 30 } = await request.json();
            const { data, error } = await supabase.rpc('cleanup_old_logs', { days_to_keep: daysToKeep });

            if (error) {
                return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
            }

            return NextResponse.json({ deletedCount: data });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        console.error('[Admin Logs API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
