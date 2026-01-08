'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { FREE_TIER_LIMITS, FREE_GAMES, FREE_JOURNEYS, SubscriptionTier } from '@/lib/payments';
import { journeysData } from '@/data/journeys';

export interface UsageInfo {
    canUse: boolean;
    remaining: number;
    limit: number;
    resetsAt: Date | null;
    tier: SubscriptionTier;
}

export interface UpgradePrompt {
    title: { ar: string; en: string };
    message: { ar: string; en: string };
    feature: string;
}

const UPGRADE_PROMPTS: Record<string, UpgradePrompt> = {
    ai_chat: {
        title: { ar: 'انتهت رسائل اليوم', en: 'Daily limit reached' },
        message: { ar: 'اشترك في Premium للحصول على محادثات غير محدودة', en: 'Upgrade to Premium for unlimited AI conversations' },
        feature: 'ai_chat'
    },
    conflict_ai: {
        title: { ar: 'انتهت جلسات هذا الأسبوع', en: 'Weekly limit reached' },
        message: { ar: 'اشترك في Premium للوصول غير المحدود', en: 'Upgrade to Premium for unlimited conflict resolution' },
        feature: 'conflict_ai'
    },
    game_sessions: {
        title: { ar: 'انتهت جلسات اليوم', en: 'Daily sessions used' },
        message: { ar: 'اشترك في Premium للعب بلا حدود', en: 'Upgrade to Premium for unlimited game sessions' },
        feature: 'game_sessions'
    },
    games_available: {
        title: { ar: 'لعبة مميزة', en: 'Premium Game' },
        message: { ar: 'هذه اللعبة متاحة لمشتركي Premium', en: 'This game is available for Premium subscribers' },
        feature: 'games_available'
    },
    journeys: {
        title: { ar: 'رحلة مميزة', en: 'Premium Journey' },
        message: { ar: 'اشترك في Premium لفتح جميع الرحلات', en: 'Upgrade to Premium to unlock all journeys' },
        feature: 'journeys'
    },
    whisper: {
        title: { ar: 'انتهت همسات الأسبوع', en: 'Weekly whispers used' },
        message: { ar: 'اشترك في Premium للهمسات غير المحدودة', en: 'Upgrade to Premium for unlimited whispers' },
        feature: 'whisper'
    },
    insights: {
        title: { ar: 'تحليلات متقدمة', en: 'Advanced Insights' },
        message: { ar: 'اشترك في Premium للتحليلات المتقدمة', en: 'Upgrade to Premium for advanced analytics' },
        feature: 'insights'
    },
    health_tracking: {
        title: { ar: 'تتبع صحي كامل', en: 'Full Health Tracking' },
        message: { ar: 'اشترك في Premium لتتبع الخصوبة والمزيد', en: 'Upgrade to Premium for fertility tracking and more' },
        feature: 'health_tracking'
    }
};

export function useTierLimits() {
    const supabase = createClient();
    const { user } = useAuthStore();
    const [tier, setTier] = useState<SubscriptionTier>('free'); // Default to free until we verify
    const [isLoading, setIsLoading] = useState(true);
    const [configLoading, setConfigLoading] = useState(true); // Track if config is still loading
    const [usageCache, setUsageCache] = useState<Record<string, UsageInfo>>({});

    // Dynamic limits from admin dashboard
    const [dynamicLimits, setDynamicLimits] = useState({
        ai_chat: { limit: 5, period: 'daily' },
        conflict_ai: { limit: 2, period: 'weekly' },
        whisper: { limit: 3, period: 'weekly' }
    });

    // Games config from admin dashboard - maps game id to isPremium status
    const [gamesConfig, setGamesConfig] = useState<Record<string, boolean>>({});
    // Journeys config from admin dashboard - maps journey id to isPremium status
    const [journeysConfig, setJourneysConfig] = useState<Record<string, boolean>>({});

    // Fetch dynamic limits, games config, and journeys config from API
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Fetch usage limits
                const limitsRes = await fetch('/api/limits');
                if (limitsRes.ok) {
                    const data = await limitsRes.json();
                    setDynamicLimits({
                        ai_chat: { limit: data.ai_chat_daily || 5, period: 'daily' },
                        conflict_ai: { limit: data.conflict_ai_weekly || 2, period: 'weekly' },
                        whisper: { limit: data.whisper_weekly || 3, period: 'weekly' }
                    });
                }

                // Fetch games config (public endpoint for premium status)
                const gamesRes = await fetch('/api/games-config', {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (gamesRes.ok) {
                    const gamesData = await gamesRes.json();
                    console.log('Games config received:', gamesData.games?.length, 'games');
                    if (gamesData.games && Array.isArray(gamesData.games)) {
                        const configMap: Record<string, boolean> = {};
                        gamesData.games.forEach((game: any) => {
                            // Normalize ID: convert underscores to hyphens for compatibility
                            const normalizedId = game.id.replace(/_/g, '-');
                            configMap[normalizedId] = game.isPremium ?? false;
                            // Also keep original ID for backwards compatibility
                            configMap[game.id] = game.isPremium ?? false;
                        });
                        console.log('Games config map:', configMap);
                        setGamesConfig(configMap);
                    }
                }

                // Fetch journeys config (public endpoint for premium status)
                const journeysRes = await fetch('/api/journeys-config');
                if (journeysRes.ok) {
                    const journeysData = await journeysRes.json();
                    if (journeysData.journeys && Array.isArray(journeysData.journeys)) {
                        const configMap: Record<string, boolean> = {};
                        journeysData.journeys.forEach((journey: any) => {
                            // Map journey id to isPremium status
                            configMap[journey.id] = journey.isPremium ?? false;
                        });
                        setJourneysConfig(configMap);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch config:', err);
            } finally {
                setConfigLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // Fetch user's tier on mount
    useEffect(() => {
        const fetchTier = async () => {
            if (!user) {
                // No user = free tier (show locks)
                setTier('free');
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase.rpc('get_user_tier', {
                    p_user_id: user.id
                });

                if (!error && data) {
                    setTier(data as SubscriptionTier);
                } else {
                    // RPC failed or no data - default to free to show locks
                    console.log('Tier check failed, defaulting to free:', error?.message);
                    setTier('free');
                }
            } catch (err) {
                console.error('Error fetching tier:', err);
                // On error, default to free to show locks
                setTier('free');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTier();
    }, [user, supabase]);

    // Check if user can use a feature
    const canUse = useCallback(async (feature: string): Promise<UsageInfo> => {
        // Premium users have unlimited access
        if (tier === 'premium') {
            return {
                canUse: true,
                remaining: -1,
                limit: -1,
                resetsAt: null,
                tier: 'premium'
            };
        }

        // Check cache first
        if (usageCache[feature]) {
            return usageCache[feature];
        }

        if (!user) {
            const limit = FREE_TIER_LIMITS[feature]?.limit ?? 0;
            return {
                canUse: limit > 0,
                remaining: limit,
                limit: limit,
                resetsAt: null,
                tier: 'free'
            };
        }

        try {
            const { data, error } = await supabase.rpc('can_use_feature', {
                p_user_id: user.id,
                p_feature: feature
            });

            if (error) throw error;

            const result: UsageInfo = {
                canUse: data.can_use,
                remaining: data.remaining,
                limit: data.limit,
                resetsAt: data.resets_at ? new Date(data.resets_at) : null,
                tier: data.tier as SubscriptionTier
            };

            // Update cache
            setUsageCache(prev => ({ ...prev, [feature]: result }));

            return result;
        } catch (err) {
            console.error('Error checking feature usage:', err);
            // Fallback to local limits
            const limit = FREE_TIER_LIMITS[feature]?.limit ?? 0;
            return {
                canUse: limit > 0,
                remaining: limit,
                limit: limit,
                resetsAt: null,
                tier: 'free'
            };
        }
    }, [user, supabase, tier, usageCache]);

    // Track feature usage
    const trackUsage = useCallback(async (feature: string): Promise<{ success: boolean; remaining: number }> => {
        // Premium users don't need tracking
        if (tier === 'premium') {
            return { success: true, remaining: -1 };
        }

        if (!user) {
            return { success: false, remaining: 0 };
        }

        try {
            const { data, error } = await supabase.rpc('track_feature_usage', {
                p_user_id: user.id,
                p_feature: feature
            });

            if (error) throw error;

            // Invalidate cache for this feature
            setUsageCache(prev => {
                const newCache = { ...prev };
                delete newCache[feature];
                return newCache;
            });

            return {
                success: data.success,
                remaining: data.remaining
            };
        } catch (err) {
            console.error('Error tracking usage:', err);
            return { success: false, remaining: 0 };
        }
    }, [user, supabase, tier]);

    // Check if a specific game is available
    const isGameAvailable = useCallback((gameType: string): boolean => {
        // Premium users have full access
        if (tier === 'premium') return true;

        // While config is still loading, show all games as available (no locks)
        // This prevents the flicker where locks appear then disappear
        if (configLoading) return true;

        // If we have dynamic config from admin, use it
        if (Object.keys(gamesConfig).length > 0) {
            // Game is available if it's NOT premium (isPremium is false or undefined)
            return !gamesConfig[gameType];
        }

        // Fallback to hardcoded FREE_GAMES list
        return FREE_GAMES.includes(gameType);
    }, [tier, gamesConfig, configLoading]);

    // Check if a specific journey is available
    const isJourneyAvailable = useCallback((journeySlug: string): boolean => {
        // Premium users have full access
        if (tier === 'premium') return true;

        // While config is still loading, show all journeys as available (no locks)
        if (configLoading) return true;

        // If we have dynamic config from admin, use it
        if (Object.keys(journeysConfig).length > 0) {
            // Journey is available if it's NOT premium (isPremium is false or undefined)
            return !journeysConfig[journeySlug];
        }

        // Fallback to checking journey's own isPremium flag from journeysData
        const journey = journeysData.find(j => j.id === journeySlug);
        // If journey not found or isPremium is undefined/false, it's free
        return !journey?.isPremium;
    }, [tier, journeysConfig, configLoading]);

    // Get upgrade prompt for a feature
    const getUpgradePrompt = useCallback((feature: string): UpgradePrompt | null => {
        if (tier === 'premium') return null;
        return UPGRADE_PROMPTS[feature] || null;
    }, [tier]);

    // Get tier display info
    const getTierInfo = useCallback(() => {
        return {
            name: tier === 'premium'
                ? { ar: 'مميز', en: 'Premium' }
                : { ar: 'مجاني', en: 'Free' },
            isPremium: tier === 'premium'
        };
    }, [tier]);

    // Refresh all usage data
    const refreshUsage = useCallback(() => {
        setUsageCache({});
    }, []);

    return {
        tier,
        isLoading,
        configLoading,
        isPremium: tier === 'premium',
        canUse,
        trackUsage,
        isGameAvailable,
        isJourneyAvailable,
        getUpgradePrompt,
        getTierInfo,
        refreshUsage,
        FREE_GAMES,
        FREE_JOURNEYS
    };
}
