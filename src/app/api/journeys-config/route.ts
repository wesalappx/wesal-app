import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public endpoint to get journeys config (no auth required)
// This is a read-only endpoint for frontend to check which journeys are premium
export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Fetch journeys config from app_settings
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'journeys_config')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching journeys config:', error);
        }

        // Return journeys array, or default if not set
        const journeys = data?.value || [
            // Default journeys - first 2 free, last 1 premium
            { id: 'basics', isPremium: false },
            { id: 'communication', isPremium: false },
            { id: 'future', isPremium: true },
        ];

        return NextResponse.json({ journeys });

    } catch (error: any) {
        console.error('Journeys config error:', error);
        return NextResponse.json({ journeys: [] }, { status: 500 });
    }
}
