import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/subscriptions/limits - Fetch all tier limits
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch tier limits
    const { data: limits, error } = await supabase
        .from('tier_limits')
        .select('*')
        .order('tier', { ascending: true })
        .order('feature', { ascending: true });

    if (error) {
        console.error('Error fetching limits:', error);
        return NextResponse.json({ error: 'Failed to fetch limits' }, { status: 500 });
    }

    return NextResponse.json({ limits });
}

// PUT /api/admin/subscriptions/limits - Update a tier limit
export async function PUT(request: NextRequest) {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { feature, tier, limit_value } = body;

    if (!feature || !tier) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update limit
    const { error } = await supabase
        .from('tier_limits')
        .update({ limit_value })
        .eq('tier', tier)
        .eq('feature', feature);

    if (error) {
        console.error('Error updating limit:', error);
        return NextResponse.json({ error: 'Failed to update limit' }, { status: 500 });
    }

    // Log action
    await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'update_tier_limit',
        target_type: 'tier_limit',
        details: { feature, tier, limit_value }
    });

    return NextResponse.json({ success: true });
}
