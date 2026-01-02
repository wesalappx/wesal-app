import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/subscriptions/offers - Fetch all offers
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

    // Fetch offers
    const { data: offers, error } = await supabase
        .from('special_offers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching offers:', error);
        return NextResponse.json({ offers: [] });
    }

    return NextResponse.json({ offers });
}

// POST /api/admin/subscriptions/offers - Create new offer
export async function POST(request: NextRequest) {
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
    const { name, discount_percent, valid_from, valid_until, code } = body;

    if (!name || !discount_percent || !valid_until) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create offer
    const { data: offer, error } = await supabase
        .from('special_offers')
        .insert({
            name,
            discount_percent,
            valid_from: valid_from || new Date().toISOString(),
            valid_until,
            code,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating offer:', error);
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    // Log action
    await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'create_offer',
        target_type: 'special_offer',
        details: { name, discount_percent, code }
    });

    return NextResponse.json({ success: true, offer });
}

// DELETE /api/admin/subscriptions/offers - Delete an offer
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('id');

    if (!offerId) {
        return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
    }

    // Delete offer
    const { error } = await supabase
        .from('special_offers')
        .delete()
        .eq('id', offerId);

    if (error) {
        console.error('Error deleting offer:', error);
        return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }

    // Log action
    await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'delete_offer',
        target_type: 'special_offer',
        details: { offer_id: offerId }
    });

    return NextResponse.json({ success: true });
}
