import { NextRequest, NextResponse } from 'next/server';

// Simple error logging endpoint
// Stores errors for debugging (console log for now, could be stored in DB)

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Log to console (in production, store in database or send to logging service)
        console.error('[Client Error]', {
            timestamp: body.timestamp,
            url: body.url,
            message: body.message,
            stack: body.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
            context: body.context,
        });

        // In production, you might want to:
        // 1. Store in database
        // 2. Send to Slack/Discord
        // 3. Send email for critical errors

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error logging failed:', error);
        return NextResponse.json({ received: false });
    }
}
