import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Check subscription status for current user
export async function GET(request: NextRequest) {
    try {
        // Get the authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({
                isPremium: false,
                subscription: null,
                error: 'Not authenticated'
            });
        }

        // Use admin client to bypass RLS
        const adminSupabase = await createAdminClient();

        // Get user's couple
        const { data: coupleData, error: coupleError } = await adminSupabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .eq('status', 'ACTIVE')
            .single();

        if (coupleError || !coupleData?.id) {
            return NextResponse.json({
                isPremium: false,
                subscription: null,
                reason: 'No active couple found'
            });
        }
        console.log('[SubStatus] Checking subscription for couple:', coupleData.id);

        // Get subscription for this couple
        const { data: subscription, error: subError } = await adminSupabase
            .from('subscriptions')
            .select('id, couple_id, plan_id, status, starts_at, ends_at')
            .eq('couple_id', coupleData.id)
            .in('status', ['premium', 'active'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        console.log('[SubStatus] Subscription query result:', { subscription, error: subError });

        if (subError && subError.code !== 'PGRST116') {
            console.error('Subscription check error:', subError);
        }

        // Check if premium and not expired
        const isPremium = subscription !== null &&
            (subscription.status === 'premium' || subscription.status === 'active') &&
            (!subscription.ends_at || new Date(subscription.ends_at) > new Date());

        console.log('[SubStatus] Final result - isPremium:', isPremium);

        return NextResponse.json({
            isPremium,
            subscription: subscription || null,
            coupleId: coupleData.id
        });

    } catch (error: any) {
        console.error('Subscription status error:', error);
        return NextResponse.json({
            isPremium: false,
            subscription: null,
            error: error.message
        }, { status: 500 });
    }
}
