import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdminSession } from '@/lib/admin/auth';

export async function GET(request: Request) {
    try {
        // Verify admin session
        await requireAdminSession();

        const supabase = await createAdminClient();

        // Fetch all stats in parallel
        const [usersRes, couplesRes, checkinsRes, gamesRes, notificationsRes] = await Promise.all([
            supabase.from('profiles').select('id, created_at', { count: 'exact' }),
            supabase.from('couples').select('id, status, paired_at', { count: 'exact' }),
            supabase.from('check_ins').select('id, created_at, mood', { count: 'exact' }),
            supabase.from('game_sessions').select('id, game_type, created_at', { count: 'exact' }),
            supabase.from('notifications').select('id, created_at', { count: 'exact' }),
        ]);

        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calculate user stats
        const users = usersRes.data || [];
        const userStats = {
            total: usersRes.count || 0,
            newToday: users.filter(u => new Date(u.created_at) >= today).length,
            newThisWeek: users.filter(u => new Date(u.created_at) >= weekAgo).length,
            newThisMonth: users.filter(u => new Date(u.created_at) >= monthAgo).length,
        };

        // Calculate couple stats
        const couples = couplesRes.data || [];
        const coupleStats = {
            total: couplesRes.count || 0,
            active: couples.filter(c => c.status === 'ACTIVE').length,
            pairedToday: couples.filter(c => new Date(c.paired_at) >= today).length,
            pairedThisWeek: couples.filter(c => new Date(c.paired_at) >= weekAgo).length,
        };

        // Calculate check-in stats
        const checkins = checkinsRes.data || [];
        const checkinsToday = checkins.filter(c => new Date(c.created_at) >= today);
        const checkinStats = {
            total: checkinsRes.count || 0,
            today: checkinsToday.length,
            avgMood: checkins.length > 0
                ? (checkins.reduce((sum, c) => sum + (c.mood || 0), 0) / checkins.length).toFixed(2)
                : 0,
        };

        // Calculate game stats
        const games = gamesRes.data || [];
        const gamesByType: Record<string, number> = {};
        games.forEach(g => {
            gamesByType[g.game_type] = (gamesByType[g.game_type] || 0) + 1;
        });
        const gameStats = {
            total: gamesRes.count || 0,
            todayCount: games.filter(g => new Date(g.created_at) >= today).length,
            byType: gamesByType,
        };

        return NextResponse.json({
            users: userStats,
            couples: coupleStats,
            checkins: checkinStats,
            games: gameStats,
            notifications: {
                total: notificationsRes.count || 0,
            },
            lastUpdated: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to fetch stats: ${errorMessage}` }, { status: 500 });
    }
}
