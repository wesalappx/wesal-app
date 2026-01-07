'use server';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * TEMPORARY API ENDPOINT - Activates free premium subscription
 * This bypasses payment until payment methods are approved.
 * DELETE THIS FILE once Lemon Squeezy is set up.
 */
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
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
            return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        }

        // Get user's couple_id
        const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .eq('status', 'ACTIVE')
            .single();

        if (coupleError || !coupleData?.id) {
            return NextResponse.json({ success: false, error: 'Not paired. Please pair with your partner first.' }, { status: 400 });
        }

        const { planId } = await req.json();

        // Check if subscription already exists
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('couple_id', coupleData.id)
            .eq('status', 'active')
            .single();

        if (existingSub) {
            return NextResponse.json({ success: true, message: 'Already subscribed' });
        }

        // Create a free subscription (valid for 1 year)
        const endsAt = new Date();
        endsAt.setFullYear(endsAt.getFullYear() + 1);

        const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
                couple_id: coupleData.id,
                plan_id: planId || 'premium_monthly',
                status: 'active',
                started_at: new Date().toISOString(),
                ends_at: endsAt.toISOString(),
                // Mark as free activation (for future reference)
                payment_id: 'FREE_ACTIVATION_TEMP',
            });

        if (insertError) {
            console.error('Error creating subscription:', insertError);
            return NextResponse.json({ success: false, error: 'Failed to create subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Premium activated!' });

    } catch (error: any) {
        console.error('Activate free error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
