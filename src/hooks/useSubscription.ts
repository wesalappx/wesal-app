'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { SUBSCRIPTION_PLANS, formatPrice, getPlanById, SubscriptionTier } from '@/lib/payments';

interface Subscription {
    id: string;
    couple_id: string;
    plan_id: string;
    status: 'active' | 'cancelled' | 'expired';
    started_at: string;
    ends_at: string;
}

export function useSubscription() {
    const supabase = createClient();
    const { user } = useAuthStore();

    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if premium features are available
    // FORCE BYPASS for development/testing
    const isPremium = true; // subscription?.status === 'active' && new Date(subscription.ends_at) > new Date();

    // Fetch subscription status
    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // First get the couple_id from couples table
            const { data: coupleData } = await supabase
                .from('couples')
                .select('id')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .eq('status', 'ACTIVE')
                .single();

            if (!coupleData?.id) {
                // User is not in a couple - not an error, just no subscription
                setIsLoading(false);
                return;
            }

            // Then get subscription for this couple
            const { data, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('couple_id', coupleData.id)
                .eq('status', 'active')
                .single();

            if (subError && subError.code !== 'PGRST116') { // Not "no rows" error
                console.log('Subscription lookup returned no results');
            }

            setSubscription(data || null);
        } catch (err: any) {
            // Don't treat missing subscription as error
            console.log('Subscription check:', err?.message || err);
            setSubscription(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Start upgrade flow
    const startUpgrade = async (planId: string = 'premium_monthly') => {
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

            // Call payment API
            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    coupleId: coupleData.id,
                    userId: user.id,
                }),
            });

            const result = await response.json();

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Redirect to payment page
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
            }

            return { success: true, paymentUrl: result.paymentUrl };

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
