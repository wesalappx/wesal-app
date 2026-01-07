import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * TEMPORARY API ENDPOINT - Activates free premium subscription
 * This bypasses payment until payment methods are approved.
 * DELETE THIS FILE once Lemon Squeezy is set up.
 */
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();

        // Use regular client for auth check
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Not authenticated. Please log in.' }, { status: 401 });
        }

        // Use service role client for database operations (bypasses RLS)
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get user's couple_id - check both partner positions
        const { data: coupleData, error: coupleError } = await adminSupabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .eq('status', 'ACTIVE')
            .maybeSingle();

        if (coupleError) {
            console.error('Couple query error:', coupleError);
            return NextResponse.json({ success: false, error: 'Error checking couple status.' }, { status: 500 });
        }

        if (!coupleData?.id) {
            return NextResponse.json({ success: false, error: 'لم يتم العثور على شريك. يرجى الربط مع شريكك أولاً. (Not paired. Please pair with your partner first.)' }, { status: 400 });
        }

        let planId = 'premium_monthly';
        try {
            const body = await req.json();
            planId = body.planId || 'premium_monthly';
        } catch {
            // Body might be empty, use default
        }

        // Check if active subscription already exists
        const { data: existingSub, error: subCheckError } = await adminSupabase
            .from('subscriptions')
            .select('id, status')
            .eq('couple_id', coupleData.id)
            .eq('status', 'active')
            .maybeSingle();

        if (existingSub) {
            return NextResponse.json({ success: true, message: 'Already subscribed! أنت مشترك بالفعل!' });
        }

        // Create a free subscription (valid for 1 year)
        const startedAt = new Date();
        const endsAt = new Date();
        endsAt.setFullYear(endsAt.getFullYear() + 1);

        // Insert new subscription
        const { data: newSub, error: insertError } = await adminSupabase
            .from('subscriptions')
            .insert({
                couple_id: coupleData.id,
                plan_id: planId,
                status: 'active',
                started_at: startedAt.toISOString(),
                ends_at: endsAt.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Subscription insert error:', insertError);

            // Try to give a more helpful error message
            if (insertError.code === '23505') {
                // Unique constraint violation - likely already has a subscription
                return NextResponse.json({ success: true, message: 'Subscription already exists!' });
            }

            return NextResponse.json({
                success: false,
                error: `Failed to create subscription: ${insertError.message}`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'تم تفعيل Premium بنجاح! Premium activated successfully!'
        });

    } catch (error: any) {
        console.error('Activate free error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
    }
}
