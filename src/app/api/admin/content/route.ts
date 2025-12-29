import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

export async function GET(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'content')) {
        return NextResponse.json({ error: 'No permission to view content' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('content_blocks')
            .select('*', { count: 'exact' });

        if (type) {
            query = query.eq('type', type);
        }

        query = query
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        const { data: content, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        return NextResponse.json({
            content,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (err) {
        console.error('Admin content error:', err);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'content')) {
        return NextResponse.json({ error: 'No permission to create content' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();

        const { data, error: insertError } = await supabase
            .from('content_blocks')
            .insert({
                ...body,
                created_by: admin.user_id,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Log the action
        await supabase.from('admin_audit_log').insert({
            admin_id: admin.id,
            action: 'create',
            entity_type: 'content',
            entity_id: data.id,
            new_data: body,
        });

        return NextResponse.json({ content: data });
    } catch (err) {
        console.error('Admin content create error:', err);
        return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'content')) {
        return NextResponse.json({ error: 'No permission to update content' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
        }

        const { data, error: updateError } = await supabase
            .from('content_blocks')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Log the action
        await supabase.from('admin_audit_log').insert({
            admin_id: admin.id,
            action: 'update',
            entity_type: 'content',
            entity_id: id,
            new_data: updates,
        });

        return NextResponse.json({ content: data });
    } catch (err) {
        console.error('Admin content update error:', err);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'content')) {
        return NextResponse.json({ error: 'No permission to delete content' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
        }

        const { error: deleteError } = await supabase
            .from('content_blocks')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        // Log the action
        await supabase.from('admin_audit_log').insert({
            admin_id: admin.id,
            action: 'delete',
            entity_type: 'content',
            entity_id: id,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin content delete error:', err);
        return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 });
    }
}
