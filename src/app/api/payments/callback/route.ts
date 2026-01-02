import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Payment callback handler for Moyasar webhooks
// This is called by Moyasar after payment completion

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, metadata } = body;

        console.log('Payment callback received:', { id, status });

        // Verify the payment status
        if (status !== 'paid') {
            console.log('Payment not completed:', status);
            return NextResponse.json({ received: true, processed: false });
        }

        const { couple_id, plan_id } = metadata || {};

        if (!couple_id || !plan_id) {
            console.error('Missing metadata in payment callback');
            return NextResponse.json({ received: true, processed: false });
        }

        // Update subscription in database
        const supabase = await createClient();

        // Calculate subscription end date (lifetime = far future)
        const endDate = plan_id === 'premium_lifetime'
            ? new Date('2099-12-31').toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

        // Upsert subscription record
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                couple_id,
                plan_id,
                status: 'active',
                payment_id: id,
                started_at: new Date().toISOString(),
                ends_at: endDate,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'couple_id',
            });

        if (error) {
            console.error('Failed to update subscription:', error);
            return NextResponse.json({ received: true, processed: false, error: error.message });
        }

        console.log('Subscription activated for couple:', couple_id);

        return NextResponse.json({ received: true, processed: true });

    } catch (error) {
        console.error('Payment callback error:', error);
        return NextResponse.json({ received: true, processed: false });
    }
}

// GET handler for redirect after payment
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    // Redirect to appropriate page based on status
    if (status === 'paid') {
        return NextResponse.redirect(new URL('/settings?payment=success', request.url));
    } else {
        return NextResponse.redirect(new URL('/settings?payment=failed', request.url));
    }
}
