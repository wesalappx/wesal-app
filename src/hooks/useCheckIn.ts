'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface CheckIn {
    id: string;
    user_id: string;
    mood: number;
    energy: number;
    stress: number;
    sleep?: number;
    connection?: number;
    shared_with_partner: boolean;
    created_at: string;
}

export function useCheckIn() {
    const supabase = createClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create a new check-in
    const createCheckIn = async (data: {
        mood: number;
        energy: number;
        stress: number;
        sleep?: number;
        connection?: number;
        shared_with_partner?: boolean;
    }) => {
        if (!user) {
            return { error: 'Not authenticated' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data: checkIn, error: insertError } = await supabase
                .from('check_ins')
                .insert({
                    user_id: user.id,
                    mood: data.mood,
                    energy: data.energy,
                    stress: data.stress,
                    sleep: data.sleep,
                    connection: data.connection,
                    shared_with_partner: data.shared_with_partner || false,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // If shared with partner, send notification
            if (data.shared_with_partner) {
                try {
                    // Get couple info
                    const { data: couple } = await supabase
                        .from('couples')
                        .select('id, partner1_id, partner2_id')
                        .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                        .eq('status', 'ACTIVE')
                        .single();

                    if (couple) {
                        const partnerId = couple.partner1_id === user.id ? couple.partner2_id : couple.partner1_id;
                        const userName = user?.user_metadata?.display_name || 'شريكك';

                        // 1. Send Notification
                        await supabase
                            .from('notifications')
                            .insert({
                                user_id: partnerId,
                                type: 'CHECK_IN_SHARED',
                                title_ar: 'مشاركة جديدة',
                                title_en: 'New Share',
                                body_ar: `${userName} شارك حالته معك`,
                                body_en: `${userName} shared their mood with you`,
                                is_read: false,
                            });

                        // 2. Update Streak
                        try {
                            console.log('[useCheckIn] Fetching streak for couple:', couple.id);
                            const { data: streakData, error: streakFetchError } = await supabase
                                .from('streaks')
                                .select('*')
                                .eq('couple_id', couple.id)
                                .maybeSingle(); // maybeSingle to allow null without error

                            console.log('[useCheckIn] Streak fetch result:', { streakData, streakFetchError });

                            if (streakFetchError) {
                                console.error('[useCheckIn] Streak fetch error:', streakFetchError);
                            }

                            if (!streakData) {
                                // Streak row doesn't exist, create it
                                console.log('[useCheckIn] No streak row found, creating new one...');
                                const { data: insertResult, error: insertError } = await supabase
                                    .from('streaks')
                                    .insert({
                                        couple_id: couple.id,
                                        current_streak: 1,
                                        longest_streak: 1,
                                        updated_at: new Date().toISOString()
                                    })
                                    .select();
                                console.log('[useCheckIn] Streak INSERT result:', { insertResult, insertError });
                            } else {
                                // Streak row exists, apply update logic
                                const lastUpdate = new Date(streakData.updated_at);
                                const today = new Date();
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);

                                // Reset times to compare dates only
                                lastUpdate.setHours(0, 0, 0, 0);
                                today.setHours(0, 0, 0, 0);
                                yesterday.setHours(0, 0, 0, 0);

                                console.log('[useCheckIn] Streak logic:', {
                                    lastUpdate,
                                    today,
                                    currentStreak: streakData.current_streak
                                });

                                // EDGE CASE FIX: If current_streak is 0, we always update to 1
                                // This handles rows created by SQL migration with streak=0
                                if (streakData.current_streak === 0) {
                                    console.log('[useCheckIn] Streak is 0, setting to 1');
                                    const { data: updateResult, error: updateError } = await supabase
                                        .from('streaks')
                                        .update({
                                            current_streak: 1,
                                            longest_streak: Math.max(1, streakData.longest_streak),
                                            updated_at: new Date().toISOString()
                                        })
                                        .eq('id', streakData.id)
                                        .select();
                                    console.log('[useCheckIn] Streak UPDATE (from 0) result:', { updateResult, updateError });
                                } else if (lastUpdate.getTime() < today.getTime()) {
                                    // Not updated today, calculate new streak
                                    let newStreak = 1;
                                    if (lastUpdate.getTime() === yesterday.getTime()) {
                                        // Consecutive day
                                        newStreak = streakData.current_streak + 1;
                                    }
                                    // Else: Broken streak, reset to 1

                                    console.log('[useCheckIn] Updating streak to:', newStreak);
                                    const { data: updateResult, error: updateError } = await supabase
                                        .from('streaks')
                                        .update({
                                            current_streak: newStreak,
                                            longest_streak: Math.max(newStreak, streakData.longest_streak),
                                            updated_at: new Date().toISOString()
                                        })
                                        .eq('id', streakData.id)
                                        .select();
                                    console.log('[useCheckIn] Streak UPDATE result:', { updateResult, updateError });
                                } else {
                                    console.log('[useCheckIn] Already checked in today with active streak, skipping');
                                }
                            }
                        } catch (streakUpdateError) {
                            console.error('[useCheckIn] Streak update error:', streakUpdateError);
                        }
                    }
                } catch (notificationError) {
                    // Don't fail the check-in if notification/streak fails
                    console.error('Failed to send notification or update streak:', notificationError);
                }
            }

            return { data: checkIn, error: null };
        } catch (err: any) {
            setError(err.message);
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Get today's check-in
    const getTodayCheckIn = async () => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            const { data, error: fetchError } = await supabase
                .from('check_ins')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Get check-in history (last 7 days)
    const getHistory = async (days = 7) => {
        if (!user) return { data: [], error: 'Not authenticated' };

        setIsLoading(true);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        try {
            const { data, error: fetchError } = await supabase
                .from('check_ins')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            return { data: data || [], error: null };
        } catch (err: any) {
            return { data: [], error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Get partner's latest shared check-in
    const getPartnerCheckIn = async (partnerId: string) => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            const { data, error: fetchError } = await supabase
                .from('check_ins')
                .select('*')
                .eq('user_id', partnerId)
                .eq('shared_with_partner', true)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            return { data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createCheckIn,
        getTodayCheckIn,
        getHistory,
        getPartnerCheckIn,
        isLoading,
        error,
    };
}
