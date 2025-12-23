import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

export async function GET(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'users')) {
        return NextResponse.json({ error: 'No permission to view users' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.ilike('display_name', `%${search}%`);
        }

        query = query
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range((page - 1) * limit, page * limit - 1);

        const { data: users, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        // Get additional user info (pairing status, check-in count)
        const userIds = users?.map(u => u.id) || [];

        const [couplesRes, checkinsRes] = await Promise.all([
            supabase
                .from('couples')
                .select('partner1_id, partner2_id, status')
                .or(`partner1_id.in.(${userIds.join(',')}),partner2_id.in.(${userIds.join(',')})`),
            supabase
                .from('check_ins')
                .select('user_id')
                .in('user_id', userIds),
        ]);

        // Enrich user data
        const enrichedUsers = users?.map(user => {
            const couple = couplesRes.data?.find(
                c => c.partner1_id === user.id || c.partner2_id === user.id
            );
            const checkinCount = checkinsRes.data?.filter(c => c.user_id === user.id).length || 0;

            return {
                ...user,
                isPaired: !!couple,
                coupleStatus: couple?.status || null,
                checkinCount,
            };
        });

        return NextResponse.json({
            users: enrichedUsers,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (err) {
        console.error('Admin users error:', err);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'users')) {
        return NextResponse.json({ error: 'No permission to modify users' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();
        const { userId, updates } = body;

        if (!userId || !updates) {
            return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 });
        }

        const { data, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log the action
        await supabase.from('admin_audit_log').insert({
            admin_id: admin.id,
            action: 'update',
            entity_type: 'user',
            entity_id: userId,
            new_data: updates,
        });

        return NextResponse.json({ user: data });
    } catch (err) {
        console.error('Admin user update error:', err);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
