import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/lemonsqueezy';
import { createAdminClient } from '@/lib/supabase/server';

// Lemon Squeezy webhook events
type WebhookEvent =
    | 'subscription_created'
    | 'subscription_updated'
    | 'subscription_cancelled'
    | 'subscription_resumed'
    | 'subscription_expired'
    | 'subscription_paused'
    | 'subscription_unpaused'
    | 'order_created';

interface WebhookPayload {
    meta: {
        event_name: WebhookEvent;
        custom_data?: {
            couple_id?: string;
            user_id?: string;
            plan_id?: string;
        };
    };
    data: {
        id: string;
        attributes: {
            status: string;
            customer_id: number;
            order_id: number;
            product_id: number;
            variant_id: number;
            ends_at: string | null;
            renews_at: string | null;
            created_at: string;
            updated_at: string;
            user_email: string;
            user_name: string;
        };
    };
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature') || '';

        // Verify webhook signature (required for production security)
        if (process.env.LEMON_SQUEEZY_WEBHOOK_SECRET && signature) {
            if (!verifyWebhookSignature(rawBody, signature)) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload: WebhookPayload = JSON.parse(rawBody);
        const eventName = payload.meta.event_name;
        const customData = payload.meta.custom_data;

        console.log(`Received webhook: ${eventName}`, customData);

        const supabase = await createAdminClient();

        switch (eventName) {
            case 'subscription_created':
            case 'subscription_updated':
            case 'subscription_resumed':
            case 'subscription_unpaused': {
                // Activate premium subscription
                const coupleId = customData?.couple_id;
                const planId = customData?.plan_id || 'premium_monthly';

                if (!coupleId) {
                    console.error('No couple_id in webhook custom_data');
                    return NextResponse.json({ error: 'Missing couple_id' }, { status: 400 });
                }

                // Upsert subscription
                const { error } = await supabase
                    .from('subscriptions')
                    .upsert({
                        couple_id: coupleId,
                        plan_id: planId,
                        status: 'active',
                        lemon_subscription_id: payload.data.id,
                        started_at: payload.data.attributes.created_at,
                        ends_at: payload.data.attributes.ends_at,
                        renews_at: payload.data.attributes.renews_at,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'couple_id',
                    });

                if (error) {
                    console.error('Failed to activate subscription:', error);
                    return NextResponse.json({ error: 'Database error' }, { status: 500 });
                }

                console.log(`Subscription activated for couple ${coupleId}`);
                break;
            }

            case 'subscription_cancelled':
            case 'subscription_paused': {
                const coupleId = customData?.couple_id;

                if (coupleId) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'cancelled',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('couple_id', coupleId);

                    console.log(`Subscription cancelled for couple ${coupleId}`);
                }
                break;
            }

            case 'subscription_expired': {
                const coupleId = customData?.couple_id;

                if (coupleId) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'expired',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('couple_id', coupleId);

                    console.log(`Subscription expired for couple ${coupleId}`);
                }
                break;
            }

            case 'order_created': {
                // Log successful order
                console.log('Order created:', payload.data.id);
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${eventName}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
