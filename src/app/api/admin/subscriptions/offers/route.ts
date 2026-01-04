import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

// GET /api/admin/subscriptions/offers - Fetch all offers
export async function GET(request: NextRequest) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();

        const { data: offers, error: fetchError } = await supabase
            .from('special_offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching offers:', fetchError);
            return NextResponse.json({ offers: [] });
        }

        return NextResponse.json({ offers });
    } catch (err) {
        console.error('Offers fetch error:', err);
        return NextResponse.json({ offers: [] });
    }
}

// POST /api/admin/subscriptions/offers - Create new offer
export async function POST(request: NextRequest) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();
        const { name, discount_percent, valid_from, valid_until, code } = body;

        if (!name || !discount_percent || !valid_until) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: offer, error: insertError } = await supabase
            .from('special_offers')
            .insert({
                name,
                discount_percent,
                valid_from: valid_from || new Date().toISOString(),
                valid_until,
                code: code || null,
                is_active: true
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating offer:', insertError);
            return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
        }

        return NextResponse.json({ success: true, offer });
    } catch (err) {
        console.error('Create offer error:', err);
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }
}

// DELETE /api/admin/subscriptions/offers - Delete an offer
export async function DELETE(request: NextRequest) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();
        const { searchParams } = new URL(request.url);
        const offerId = searchParams.get('id');

        if (!offerId) {
            return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
        }

        const { error: deleteError } = await supabase
            .from('special_offers')
            .delete()
            .eq('id', offerId);

        if (deleteError) {
            console.error('Error deleting offer:', deleteError);
            return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Delete offer error:', err);
        return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }
}
