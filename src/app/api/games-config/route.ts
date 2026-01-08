import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public endpoint to get games config (no auth required)
// This is a read-only endpoint for frontend to check which games are premium
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Fetch games config from app_settings
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'games_config')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching games config:', error);
        }

        // If we have saved config, use it; otherwise use defaults
        let games;
        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
            games = data.value;
            console.log('Using saved games config:', games.length, 'games');
        } else {
            // Default games matching frontend play page
            games = [
                { id: 'would-you-rather', isPremium: false },
                { id: 'compliment-battle', isPremium: false },
                { id: 'love-roulette', isPremium: false },
                { id: 'deep-questions', isPremium: false },
                { id: 'truth-or-dare', isPremium: false },
                { id: 'memory-lane', isPremium: true },
                { id: 'couple-quiz', isPremium: true },
                { id: 'minute-challenges', isPremium: true },
            ];
            console.log('Using default games config');
        }

        // Return with no-cache headers to ensure fresh data
        return NextResponse.json({ games }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'Pragma': 'no-cache',
            }
        });

    } catch (error: any) {
        console.error('Games config error:', error);
        return NextResponse.json({ games: [] }, { status: 500 });
    }
}
