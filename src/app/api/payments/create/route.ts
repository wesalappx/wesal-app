import { NextRequest, NextResponse } from 'next/server';

// Moyasar API Configuration
// Add these to your .env.local:
// MOYASAR_SECRET_KEY=sk_test_xxx
// MOYASAR_PUBLISHABLE_KEY=pk_test_xxx
// NEXT_PUBLIC_MOYASAR_KEY=pk_test_xxx

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, coupleId, userId } = body;

        // Check if Moyasar is configured
        const secretKey = process.env.MOYASAR_SECRET_KEY;
        if (!secretKey) {
            return NextResponse.json({
                success: false,
                error: 'Payment system not configured. Contact support.',
                code: 'PAYMENT_NOT_CONFIGURED',
            }, { status: 503 });
        }

        // Validate plan - updated to match upgrade page pricing
        const plans: Record<string, { amount: number; description: string }> = {
            'premium_monthly': { amount: 2900, description: 'Wesal Premium - Monthly' }, // 29 SAR in halalas
            'premium_annual': { amount: 24900, description: 'Wesal Premium - Annual' }, // 249 SAR in halalas
            'premium_lifetime': { amount: 9900, description: 'Wesal Premium - Lifetime' }, // 99 SAR in halalas
        };

        const plan = plans[planId];
        if (!plan) {
            return NextResponse.json({
                success: false,
                error: 'Invalid plan',
                code: 'INVALID_PLAN',
            }, { status: 400 });
        }

        // Create Moyasar payment
        const moyasarResponse = await fetch(`${MOYASAR_API_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: plan.amount,
                currency: 'SAR',
                description: plan.description,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
                metadata: {
                    couple_id: coupleId,
                    user_id: userId,
                    plan_id: planId,
                },
            }),
        });

        if (!moyasarResponse.ok) {
            const error = await moyasarResponse.json().catch(() => ({}));
            console.error('Moyasar error:', error);
            return NextResponse.json({
                success: false,
                error: 'Payment provider error',
                code: 'PROVIDER_ERROR',
            }, { status: 502 });
        }

        const invoice = await moyasarResponse.json();

        return NextResponse.json({
            success: true,
            invoiceId: invoice.id,
            paymentUrl: invoice.url,
            amount: plan.amount / 100, // Convert to SAR
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        }, { status: 500 });
    }
}
