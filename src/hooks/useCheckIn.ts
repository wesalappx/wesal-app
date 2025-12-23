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
                    // Get partner ID from couples table
                    const { data: couple } = await supabase
                        .from('couples')
                        .select('partner1_id, partner2_id')
                        .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                        .eq('status', 'ACTIVE')
                        .single();

                    if (couple) {
                        const partnerId = couple.partner1_id === user.id ? couple.partner2_id : couple.partner1_id;
                        const userName = user?.user_metadata?.display_name || 'شريكك';

                        // Create notification for partner
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
                    }
                } catch (notificationError) {
                    // Don't fail the check-in if notification fails
                    console.error('Failed to send notification:', notificationError);
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
