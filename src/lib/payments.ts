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

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionPlan {
    id: string;
    name: { ar: string; en: string };
    price: number;           // In SAR
    interval: 'forever' | 'monthly' | 'yearly';
    tier: SubscriptionTier;
    features: { ar: string[]; en: string[] };
    discount?: { ar: string; en: string };
    isMostPopular?: boolean;
}

export interface TierLimit {
    feature: string;
    limit: number | null;  // null = unlimited
    period: 'daily' | 'weekly' | 'monthly' | 'forever' | null;
    descriptionAr: string;
    descriptionEn: string;
}

// Free tier limits configuration
// Only AI Coach, Conflict AI, and Whispers have usage limits
// Games and Journeys use lock system (FREE_GAMES, FREE_JOURNEYS) not usage limits
export const FREE_TIER_LIMITS: Record<string, TierLimit> = {
    ai_chat: { feature: 'ai_chat', limit: 5, period: 'daily', descriptionAr: '5 رسائل يومياً', descriptionEn: '5 messages/day' },
    conflict_ai: { feature: 'conflict_ai', limit: 2, period: 'weekly', descriptionAr: 'جلستين أسبوعياً', descriptionEn: '2 sessions/week' },
    whisper: { feature: 'whisper', limit: 3, period: 'weekly', descriptionAr: '3 همسات أسبوعياً', descriptionEn: '3 whispers/week' },
};

// List of games available for free tier (first 4 games)
export const FREE_GAMES = ['would-you-rather', 'compliment-battle', 'love-roulette', 'deep-questions'];
export const PREMIUM_GAMES = ['memory-lane', 'truth-or-dare', 'couple-quiz', 'minute-challenges'];

// List of journeys available for free tier
export const FREE_JOURNEYS = ['communication-basics', 'gratitude-start'];

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: { ar: 'مجاني', en: 'Free' },
        price: 0,
        interval: 'forever',
        tier: 'free',
        features: {
            ar: ['5 رسائل AI يومياً', '4 ألعاب أساسية', '3 همسات أسبوعياً', 'رحلتين للبداية'],
            en: ['5 AI messages/day', '4 basic games', '3 whispers/week', '2 starter journeys']
        }
    },
    {
        id: 'premium_monthly',
        name: { ar: 'مميز', en: 'Premium' },
        price: 29,
        interval: 'monthly',
        tier: 'premium',
        isMostPopular: true,
        features: {
            ar: ['AI غير محدود', 'جميع الألعاب (8+)', 'جميع الرحلات', 'تحليلات متقدمة', 'دعم أولوية'],
            en: ['Unlimited AI Coach', 'All games (8+)', 'All journeys', 'Advanced insights', 'Priority support']
        }
    },
    {
        id: 'premium_annual',
        name: { ar: 'سنوي', en: 'Annual' },
        price: 249,
        interval: 'yearly',
        tier: 'premium',
        discount: { ar: 'شهرين مجاناً', en: '2 months free' },
        features: {
            ar: ['كل مزايا Premium', 'وفر 99 ريال'],
            en: ['All Premium features', 'Save 99 SAR']
        }
    }
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
