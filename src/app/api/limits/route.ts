import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Public API to get usage limits for the app
export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch usage limits from app_settings
        const { data: settings, error } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['ai_chat_daily_limit', 'conflict_ai_weekly_limit', 'whisper_weekly_limit']);

        if (error) {
            console.error('Limits fetch error:', error);
            // Return default limits if fetch fails
            return NextResponse.json({
                ai_chat_daily: 5,
                conflict_ai_weekly: 2,
                whisper_weekly: 3
            });
        }

        const limits: Record<string, number> = {
            ai_chat_daily: 5,
            conflict_ai_weekly: 2,
            whisper_weekly: 3
        };

        settings?.forEach(s => {
            if (s.key === 'ai_chat_daily_limit') {
                limits.ai_chat_daily = typeof s.value === 'number' ? s.value : parseInt(String(s.value)) || 5;
            }
            if (s.key === 'conflict_ai_weekly_limit') {
                limits.conflict_ai_weekly = typeof s.value === 'number' ? s.value : parseInt(String(s.value)) || 2;
            }
            if (s.key === 'whisper_weekly_limit') {
                limits.whisper_weekly = typeof s.value === 'number' ? s.value : parseInt(String(s.value)) || 3;
            }
        });

        return NextResponse.json(limits);
    } catch (err) {
        console.error('Limits API error:', err);
        return NextResponse.json({
            ai_chat_daily: 5,
            conflict_ai_weekly: 2,
            whisper_weekly: 3
        });
    }
}
