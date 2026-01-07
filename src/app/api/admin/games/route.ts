import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET - Fetch games configuration
export async function GET() {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch games from app_settings
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'games_config')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching games:', error);
        }

        return NextResponse.json({ games: data?.value || null });

    } catch (error: any) {
        console.error('Games fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Update games configuration
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { games } = await req.json();

        // Upsert games config
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'games_config',
                value: games,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error saving games:', error);
            return NextResponse.json({ error: 'Failed to save games config' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'UPDATE_GAMES_CONFIG',
            target_id: 'games_config',
            target_type: 'settings',
            details: { games_count: games.length },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Games save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
