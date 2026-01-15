'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUBSCRIPTION_PLANS, formatPrice, getPlanById, SubscriptionTier } from '@/lib/payments';

interface Subscription {
    id: string;
    couple_id: string;
    plan_id: string;
    status: 'active' | 'premium' | 'cancelled' | 'expired' | 'trialing';
    started_at: string;
    ends_at: string | null;
}

export function useSubscription() {
    const supabase = createClient();
    const { user } = useAuth();

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if premium features are available
    // Premium is valid if status is 'premium' or 'active' and not expired
    const isPremium = subscription !== null &&
        (subscription.status === 'premium' || subscription.status === 'active') &&
        (!subscription.ends_at || new Date(subscription.ends_at) > new Date());

    // Fetch subscription status via API (bypasses RLS)
    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Use API endpoint that uses admin client (bypasses RLS)
            const response = await fetch('/api/subscription/status');
            const data = await response.json();

            if (data.subscription) {
                setSubscription(data.subscription);
            } else {
                setSubscription(null);
            }
        } catch (err: any) {
            console.error('Subscription fetch error:', err);
            setSubscription(null);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Start upgrade flow
    const startUpgrade = async (planId: string = 'premium_monthly', promoCode?: string) => {
        if (!user) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            // Get couple_id from couples table
            const { data: coupleData } = await supabase
                .from('couples')
                .select('id')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .eq('status', 'ACTIVE')
                .single();

            if (!coupleData?.id) {
                return { success: false, error: 'Not paired' };
            }

            // Call Beta Join API (Replaces Moyasar Payment for now)
            const response = await fetch('/api/payments/join-beta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    coupleId: coupleData.id,
                    userId: user.id,
                    promoCode: promoCode || undefined,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Beta join success - refetch subscription to update state
            await fetchSubscription();

            return { success: true };

        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    // Get current plan details
    const currentPlan = subscription?.plan_id
        ? getPlanById(subscription.plan_id)
        : null;

    return {
        subscription,
        isPremium,
        isLoading,
        error,
        currentPlan,
        availablePlans: SUBSCRIPTION_PLANS,
        startUpgrade,
        refetch: fetchSubscription,
        formatPrice,
    };
}
