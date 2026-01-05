import { NextRequest, NextResponse } from 'next/server';
import { createCheckout, getVariantId, getStoreId } from '@/lib/lemonsqueezy';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, coupleId, userId, email, name, promoCode } = body;

        if (!planId || !coupleId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Determine which variant to use
        const plan = planId === 'premium_annual' ? 'annual' : 'monthly';
        const variantId = getVariantId(plan);
        const storeId = await getStoreId();

        if (!variantId || !storeId) {
            console.error('Lemon Squeezy not configured:', { variantId, storeId });
            return NextResponse.json(
                { success: false, error: 'Payment system not configured' },
                { status: 500 }
            );
        }

        // Create checkout with Lemon Squeezy
        const checkout = await createCheckout({
            storeId,
            variantId,
            email,
            name,
            couponCode: promoCode || undefined,
            customData: {
                couple_id: coupleId,
                user_id: userId,
                plan_id: planId,
            },
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?couple_id=${coupleId}`,
        });

        if (!checkout) {
            return NextResponse.json(
                { success: false, error: 'Failed to create checkout' },
                { status: 500 }
            );
        }

        // Log the checkout attempt (optional - ignore if table doesn't exist)
        try {
            const supabase = await createAdminClient();
            await supabase.from('payment_attempts').insert({
                couple_id: coupleId,
                user_id: userId,
                checkout_id: checkout.id,
                plan_id: planId,
                status: 'pending',
            });
        } catch { /* Ignore errors */ }

        return NextResponse.json({
            success: true,
            checkoutUrl: checkout.url,
            checkoutId: checkout.id,
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
