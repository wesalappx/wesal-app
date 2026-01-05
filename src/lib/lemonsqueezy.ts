// Lemon Squeezy API Client
// https://docs.lemonsqueezy.com/api

const LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

// Cache for store ID
let cachedStoreId: string | null = null;

// Auto-fetch store ID from API
async function fetchStoreId(): Promise<string | null> {
    if (cachedStoreId) return cachedStoreId;

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    if (!apiKey) return null;

    try {
        const response = await fetch(`${LEMONSQUEEZY_API_URL}/stores`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/vnd.api+json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                cachedStoreId = data.data[0].id;
                return cachedStoreId;
            }
        }
    } catch (error) {
        console.error('Failed to fetch store ID:', error);
    }
    return null;
}

interface CheckoutData {
    storeId: string;
    variantId: string;
    email?: string;
    name?: string;
    couponCode?: string;
    customData?: Record<string, string>;
    redirectUrl?: string;
}

interface LemonSqueezyCheckout {
    data: {
        id: string;
        attributes: {
            url: string;
        };
    };
}

export async function createCheckout(data: CheckoutData): Promise<{ url: string; id: string } | null> {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
        console.error('LEMONSQUEEZY_API_KEY not configured');
        return null;
    }

    try {
        const response = await fetch(`${LEMONSQUEEZY_API_URL}/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/vnd.api+json',
                'Accept': 'application/vnd.api+json',
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: data.email,
                            name: data.name,
                            custom: data.customData,
                            discount_code: data.couponCode,
                        },
                        product_options: {
                            redirect_url: data.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
                        },
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: data.storeId,
                            },
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: data.variantId,
                            },
                        },
                    },
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Lemon Squeezy checkout error:', error);
            return null;
        }

        const result: LemonSqueezyCheckout = await response.json();
        return {
            url: result.data.attributes.url,
            id: result.data.id,
        };
    } catch (error) {
        console.error('Failed to create checkout:', error);
        return null;
    }
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
        console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
        return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export function getVariantId(plan: 'monthly' | 'annual'): string {
    if (plan === 'monthly') {
        return process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '';
    }
    return process.env.LEMONSQUEEZY_ANNUAL_VARIANT_ID || '';
}

export async function getStoreId(): Promise<string> {
    // Try environment variable first
    if (process.env.LEMONSQUEEZY_STORE_ID) {
        return process.env.LEMONSQUEEZY_STORE_ID;
    }
    // Auto-fetch from API
    const storeId = await fetchStoreId();
    return storeId || '';
}
