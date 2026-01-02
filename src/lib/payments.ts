// Payment Integration for Wesal
// Prepared for Moyasar (Saudi payment gateway)
// User will add MOYASAR_SECRET_KEY and MOYASAR_PUBLISHABLE_KEY later

export interface PaymentConfig {
    provider: 'moyasar' | 'stripe';
    currency: string;
    publishableKey?: string;
}

export interface CreatePaymentParams {
    amount: number;           // In smallest unit (halalas for SAR)
    description: string;
    customerId?: string;
    metadata?: Record<string, string>;
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    error?: string;
    redirectUrl?: string;
}

export interface SubscriptionPlan {
    id: string;
    name: { ar: string; en: string };
    price: number;           // In SAR
    interval: 'lifetime' | 'monthly' | 'yearly';
    features: string[];
}

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'premium_lifetime',
        name: { ar: 'اشتراك مدى الحياة', en: 'Lifetime Premium' },
        price: 99,           // 99 SAR one-time
        interval: 'lifetime',
        features: [
            'unlimited_ai_chat',
            'all_games',
            'all_journeys',
            'advanced_insights',
            'priority_support',
        ],
    },
];

// Get current plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(p => p.id === planId);
}

// Format price for display
export function formatPrice(amount: number, currency: string = 'SAR'): string {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

// Payment API client (to be implemented when Moyasar is added)
export class PaymentClient {
    private publishableKey: string;

    constructor(publishableKey: string) {
        this.publishableKey = publishableKey;
    }

    // Create a payment intent
    async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
        // TODO: Implement when Moyasar API key is available
        // This will call /api/payments/create-intent
        console.warn('Payment not configured. Add MOYASAR_SECRET_KEY to enable.');

        return {
            success: false,
            error: 'Payment system not configured',
        };
    }

    // Verify payment status
    async verifyPayment(paymentId: string): Promise<boolean> {
        // TODO: Implement when Moyasar API key is available
        return false;
    }
}

// Hook placeholder - will be expanded when payment is integrated
export function usePayment() {
    const isConfigured = !!process.env.NEXT_PUBLIC_MOYASAR_KEY;

    const createPayment = async (planId: string): Promise<PaymentResult> => {
        const plan = getPlanById(planId);
        if (!plan) {
            return { success: false, error: 'Plan not found' };
        }

        if (!isConfigured) {
            return { success: false, error: 'Payment not configured' };
        }

        // TODO: Implement actual payment flow
        return { success: false, error: 'Not implemented' };
    };

    return {
        isConfigured,
        createPayment,
        plans: SUBSCRIPTION_PLANS,
        formatPrice,
    };
}
