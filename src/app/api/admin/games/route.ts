import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';


export const dynamic = 'force-dynamic';
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

        // Default games matching play page
        const defaultGames = [
            { id: 'truth-or-dare', name: { ar: 'صراحة أو تحدي', en: 'Truth or Dare' }, description: { ar: 'لعبة الصراحة والتحديات', en: 'Classic truth or dare game' }, icon: 'target', isEnabled: true, isPremium: false, playCount: 0 },
            { id: 'would-you-rather', name: { ar: 'هل تفضل', en: 'Would You Rather' }, description: { ar: 'اختيارات صعبة ومضحكة', en: 'Tough and fun choices' }, icon: 'dices', isEnabled: true, isPremium: false, playCount: 0 },
            { id: 'compliment-battle', name: { ar: 'معركة الإطراء', en: 'Compliment Battle' }, description: { ar: 'تنافسوا في المجاملات', en: 'Compete in compliments' }, icon: 'heart', isEnabled: true, isPremium: false, playCount: 0 },
            { id: 'deep-questions', name: { ar: 'أسئلة عميقة', en: 'Deep Questions' }, description: { ar: 'أسئلة تقربكم أكثر', en: 'Questions that bring you closer' }, icon: 'sparkles', isEnabled: true, isPremium: false, playCount: 0 },
            { id: 'love-roulette', name: { ar: 'عجلة الحظ', en: 'Love Roulette' }, description: { ar: 'أدر العجلة واربح', en: 'Spin and win' }, icon: 'zap', isEnabled: true, isPremium: false, playCount: 0 },
            { id: 'memory-lane', name: { ar: 'شريط الذكريات', en: 'Memory Lane' }, description: { ar: 'استرجعوا ذكرياتكم', en: 'Relive your memories' }, icon: 'star', isEnabled: true, isPremium: true, playCount: 0 },
            { id: 'couple-quiz', name: { ar: 'معركة الأسئلة', en: 'Couple Quiz' }, description: { ar: 'كم تعرفون بعضكم', en: 'How well do you know each other' }, icon: 'users', isEnabled: true, isPremium: true, playCount: 0 },
            { id: 'minute-challenges', name: { ar: 'تحدي الدقيقة', en: 'Minute Challenges' }, description: { ar: 'تحديات في 60 ثانية', en: 'Challenges in 60 seconds' }, icon: 'message', isEnabled: true, isPremium: true, playCount: 0 },
        ];

        // Merge saved config with defaults
        let games = defaultGames;
        if (data?.value && Array.isArray(data.value)) {
            const savedMap = new Map(data.value.map((g: any) => [g.id, g]));
            games = defaultGames.map(defaultGame => {
                const saved = savedMap.get(defaultGame.id);
                return saved ? { ...defaultGame, ...saved } : defaultGame;
            });
        }

        // Fetch actual play counts from game_sessions table
        const { data: sessionCounts } = await supabase
            .from('game_sessions')
            .select('game_type');

        if (sessionCounts) {
            const countMap: Record<string, number> = {};
            sessionCounts.forEach((session: { game_type: string }) => {
                const gameId = session.game_type?.replace(/_/g, '-') || 'unknown';
                countMap[gameId] = (countMap[gameId] || 0) + 1;
            });

            games = games.map(game => ({
                ...game,
                playCount: countMap[game.id] || game.playCount || 0
            }));
        }

        return NextResponse.json({ games });

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
