'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface HealthData {
    id: string;
    last_period_date: string | null;
    cycle_length: number;
    updated_at: string;
}

export function useHealth() {
    const supabase = createClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Get couple ID
    const getCoupleId = async (): Promise<string | null> => {
        if (!user) return null;
        const { data } = await supabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .eq('status', 'ACTIVE')
            .single();
        return data?.id || null;
    };

    const getHealthData = async () => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);
        try {
            const coupleId = await getCoupleId();
            console.log('[useHealth] Fetching health data for:', { userId: user.id, coupleId });

            // Try to fetch by couple_id first (shared), then user_id (personal fallback)
            let query = supabase.from('health_tracking').select('*');

            if (coupleId) {
                query = query.eq('couple_id', coupleId);
            } else {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query.maybeSingle();
            console.log('[useHealth] Health data result:', { data, error });

            if (error) throw error;
            return { data: data as HealthData | null, error: null };
        } catch (err: any) {
            console.error('[useHealth] Fetch error:', err);
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    const updateHealthData = async (data: { last_period_date: string | null; cycle_length: number }) => {
        if (!user) return { error: 'Not authenticated' };

        setIsLoading(true);
        try {
            const coupleId = await getCoupleId();

            // Prepare upsert data
            const upsertData: any = {
                last_period_date: data.last_period_date,
                cycle_length: data.cycle_length,
                updated_at: new Date().toISOString()
            };

            // If paired, attach to couple, otherwise attach to user
            if (coupleId) {
                upsertData.couple_id = coupleId;
                // Since couple_id is unique, we can match on it. But RLS requires we can see it.
                // We need to check if a record exists to know if we are inserting or updating?
                // Or simply rely on UNIQUE constraints.
                // 'health_tracking_couple_id_key' should exist if uniqueness is enforced.
            } else {
                upsertData.user_id = user.id;
            }

            // We use upsert. The constraint for conflict resolution needs to be defined in DB.
            // In our SQL, we defined UNIQUE(couple_id).
            // For user fallback, we might not have a unique constraint on user_id in the SQL yet?
            // Let's rely on standard ID if we can or match on query.
            // Actually, simplest is to check if exists then update/insert.

            let existing = await getHealthData();

            let result;
            if (existing.data?.id) {
                result = await supabase
                    .from('health_tracking')
                    .update(upsertData)
                    .eq('id', existing.data.id)
                    .select()
                    .single();
            } else {
                // If we are inserting
                if (coupleId) upsertData.user_id = user.id; // Record creator
                result = await supabase
                    .from('health_tracking')
                    .insert(upsertData)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;
            return { data: result.data, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getHealthData,
        updateHealthData,
        isLoading
    };
}
