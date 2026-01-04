import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin/middleware';

// GET /api/admin/subscriptions/limits - Fetch all tier limits
export async function GET(request: NextRequest) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();

        const { data: limits, error: fetchError } = await supabase
            .from('tier_limits')
            .select('*')
            .order('tier', { ascending: true })
            .order('feature', { ascending: true });

        if (fetchError) {
            console.error('Error fetching limits:', fetchError);
            return NextResponse.json({ limits: [] });
        }

        return NextResponse.json({ limits });
    } catch (err) {
        console.error('Limits fetch error:', err);
        return NextResponse.json({ limits: [] });
    }
}

// PUT /api/admin/subscriptions/limits - Update a tier limit
export async function PUT(request: NextRequest) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();
        const { feature, tier, limit_value } = body;

        if (!feature || !tier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('tier_limits')
            .update({ limit_value, updated_at: new Date().toISOString() })
            .eq('tier', tier)
            .eq('feature', feature);

        if (updateError) {
            console.error('Error updating limit:', updateError);
            return NextResponse.json({ error: 'Failed to update limit' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Update limit error:', err);
        return NextResponse.json({ error: 'Failed to update limit' }, { status: 500 });
    }
}
