import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { isAdmin, error } = await verifyAdmin(request);

    if (!isAdmin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. User Stats
        const [totalUsers, newToday, newWeek, newMonth] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString())
        ]);

        const userStats = {
            total: totalUsers.count || 0,
            newToday: newToday.count || 0,
            newThisWeek: newWeek.count || 0,
            newThisMonth: newMonth.count || 0,
        };

        // 2. Couple Stats
        const [totalCouples, activeCouples, pairedToday, pairedWeek] = await Promise.all([
            supabase.from('couples').select('*', { count: 'exact', head: true }),
            supabase.from('couples').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
            supabase.from('couples').select('*', { count: 'exact', head: true }).gte('paired_at', today.toISOString()),
            supabase.from('couples').select('*', { count: 'exact', head: true }).gte('paired_at', weekAgo.toISOString())
        ]);

        const coupleStats = {
            total: totalCouples.count || 0,
            active: activeCouples.count || 0,
            pairedToday: pairedToday.count || 0,
            pairedThisWeek: pairedWeek.count || 0,
        };

        // 3. Check-in Stats
        const [totalCheckins, todayCheckins] = await Promise.all([
            supabase.from('check_ins').select('*', { count: 'exact', head: true }),
            supabase.from('check_ins').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
        ]);

        // Avg mood (need to fetch some data for this, but limit it)
        const { data: recentMoods } = await supabase
            .from('check_ins')
            .select('mood')
            .order('created_at', { ascending: false })
            .limit(100);

        const avgMood = recentMoods && recentMoods.length > 0
            ? (recentMoods.reduce((sum, c) => sum + (c.mood || 0), 0) / recentMoods.length).toFixed(1)
            : 0;

        const checkinStats = {
            total: totalCheckins.count || 0,
            today: todayCheckins.count || 0,
            avgMood
        };

        // 4. Game Stats
        const [totalGames, todayGames] = await Promise.all([
            supabase.from('game_sessions').select('*', { count: 'exact', head: true }),
            supabase.from('game_sessions').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
        ]);

        // Get game distribution efficiently (using a group by view would be better, but for now fetch Types)
        // We'll just hardcode 0 for distribution to avoid fetching all rows, or fetch top 1000
        const gamesByType: Record<string, number> = {};

        const gameStats = {
            total: totalGames.count || 0,
            todayCount: todayGames.count || 0,
            byType: gamesByType,
        };

        return NextResponse.json({
            users: userStats,
            couples: coupleStats,
            checkins: checkinStats,
            games: gameStats,
            notifications: {
                total: 0,
            },
            lastUpdated: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
