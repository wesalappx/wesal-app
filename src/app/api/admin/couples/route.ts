import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

export async function GET(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'couples')) {
        return NextResponse.json({ error: 'No permission to view couples' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status') || '';

        let query = supabase
            .from('couples')
            .select(`
                *,
                partner1:profiles!couples_partner1_id_fkey(id, display_name, avatar_url),
                partner2:profiles!couples_partner2_id_fkey(id, display_name, avatar_url)
            `, { count: 'exact' });

        if (status) {
            query = query.eq('status', status);
        }

        query = query
            .order('paired_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data: couples, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        // Get streak info for each couple
        const coupleIds = couples?.map(c => c.id) || [];
        const { data: streaks } = await supabase
            .from('streaks')
            .select('couple_id, current_streak, longest_streak')
            .in('couple_id', coupleIds);

        // Enrich couple data
        const enrichedCouples = couples?.map(couple => {
            const streak = streaks?.find(s => s.couple_id === couple.id);
            return {
                ...couple,
                currentStreak: streak?.current_streak || 0,
                longestStreak: streak?.longest_streak || 0,
            };
        });

        return NextResponse.json({
            couples: enrichedCouples,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (err) {
        console.error('Admin couples error:', err);
        return NextResponse.json({ error: 'Failed to fetch couples' }, { status: 500 });
    }
}
