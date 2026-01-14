import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Beta Launch: Allow users to join premium for free
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { coupleId, userId } = body;

        if (!coupleId || !userId) {
            return NextResponse.json({ success: false, error: 'Missing required fields (coupleId, userId)' }, { status: 400 });
        }

        console.log(`[Beta Join] Processing for couple: ${coupleId}, user: ${userId}`);

        // Create admin client (bypasses RLS)
        const supabase = await createAdminClient();

        // Verify the couple exists and user belongs to it
        const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id, partner1_id, partner2_id')
            .eq('id', coupleId)
            .single();

        if (coupleError || !coupleData) {
            console.error('[Beta Join] Couple not found:', coupleError);
            return NextResponse.json({ success: false, error: 'Couple not found' }, { status: 404 });
        }

        // Verify user belongs to this couple
        if (coupleData.partner1_id !== userId && coupleData.partner2_id !== userId) {
            console.error('[Beta Join] User not in couple');
            return NextResponse.json({ success: false, error: 'User not in couple' }, { status: 403 });
        }

        const planId = 'beta_access';
        const endsAt = new Date();
        endsAt.setMonth(endsAt.getMonth() + 6); // 6 months beta access

        // Check if subscription already exists for this couple
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id, status')
            .eq('couple_id', coupleId)
            .maybeSingle();

        let result;

        if (existingSub) {
            // Update existing subscription
            console.log(`[Beta Join] Updating existing subscription: ${existingSub.id}`);
            result = await supabase
                .from('subscriptions')
                .update({
                    plan_id: planId,
                    status: 'premium',
                    payment_id: 'beta_launch_grant',
                    starts_at: new Date().toISOString(),
                    ends_at: endsAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingSub.id);
        } else {
            // Insert new subscription
            console.log(`[Beta Join] Creating new subscription for couple: ${coupleId}`);
            result = await supabase
                .from('subscriptions')
                .insert({
                    couple_id: coupleId,
                    plan_id: planId,
                    status: 'premium',
                    payment_id: 'beta_launch_grant',
                    starts_at: new Date().toISOString(),
                    ends_at: endsAt.toISOString()
                });
        }

        if (result.error) {
            console.error('[Beta Join] DB error:', result.error);
            return NextResponse.json({
                success: false,
                error: `Database error: ${result.error.message}`
            }, { status: 500 });
        }

        console.log(`[Beta Join] SUCCESS - Beta access granted for couple ${coupleId}`);
        return NextResponse.json({ success: true, message: 'Welcome to the Beta!' });

    } catch (error: any) {
        console.error('[Beta Join] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: `Server error: ${error.message}`
        }, { status: 500 });
    }
}
