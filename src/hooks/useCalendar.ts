'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface ScheduledSession {
    id: string;
    user_id?: string;
    couple_id?: string;
    title: string;
    type: 'JOURNEY' | 'ACTIVITY' | 'CHECK_IN' | 'CUSTOM';
    scheduled_date: string;
    scheduled_time?: string;
    reminder_enabled: boolean;
    notes?: string;
    created_by: string;
    created_at: string;
    is_recurring?: boolean;
}

export function useCalendar() {
    const supabase = createClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get couple ID for current user (if paired)
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

    // Get all sessions for the user (personal + couple if paired)
    const getSessions = async (month?: Date) => {
        if (!user) return { data: [], error: 'Not authenticated' };

        setIsLoading(true);

        try {
            const coupleId = await getCoupleId();

            // 1. Fetch Standard Events (in range)
            let rangeQuery = supabase
                .from('user_calendar_events')
                .select('*')
                .order('scheduled_date', { ascending: true });

            if (coupleId) {
                rangeQuery = rangeQuery.or(`user_id.eq.${user.id},couple_id.eq.${coupleId}`);
            } else {
                rangeQuery = rangeQuery.eq('user_id', user.id);
            }

            if (month) {
                const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
                const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
                rangeQuery = rangeQuery
                    .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
                    .lte('scheduled_date', endOfMonth.toISOString().split('T')[0]);
            }

            // 2. Fetch All Recurring Events (forever)
            let recurringQuery = supabase
                .from('user_calendar_events')
                .select('*')
                .eq('is_recurring', true);

            if (coupleId) {
                // Note: .or() with filters can be tricky, make sure to group logically if needed
                // But generally: (user_id = X OR couple_id = Y) AND is_recurring = true
                recurringQuery = recurringQuery.or(`user_id.eq.${user.id},couple_id.eq.${coupleId}`);
            } else {
                recurringQuery = recurringQuery.eq('user_id', user.id);
            }

            // Execute in parallel
            const [rangeRes, recurringRes] = await Promise.all([
                rangeQuery,
                recurringQuery
            ]);

            if (rangeRes.error) throw rangeRes.error;
            if (recurringRes.error) throw recurringRes.error;

            // Merge & Deduplicate
            const rangeEvents = rangeRes.data || [];
            const recurringEvents = recurringRes.data || [];

            const allEvents = [...rangeEvents];

            // Add recurring events if not already present
            recurringEvents.forEach(rec => {
                if (!allEvents.find(e => e.id === rec.id)) {
                    allEvents.push(rec);
                }
            });

            return { data: allEvents, error: null };
        } catch (err: any) {
            console.error('[useCalendar] Fetch error:', err);
            return { data: [], error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Create a new session - save to user's calendar (always)
    const createSession = async (data: {
        title: string;
        type?: 'JOURNEY' | 'ACTIVITY' | 'CHECK_IN' | 'CUSTOM';
        scheduled_date: string;
        scheduled_time?: string;
        reminder_enabled?: boolean;
        notes?: string;
        is_recurring?: boolean;
    }) => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);

        try {
            const coupleId = await getCoupleId();

            const { data: session, error: insertError } = await supabase
                .from('user_calendar_events')
                .insert({
                    user_id: user.id,
                    couple_id: coupleId, // null if not paired
                    title: data.title,
                    type: data.type || 'CUSTOM',
                    scheduled_date: data.scheduled_date,
                    scheduled_time: data.scheduled_time,
                    reminder_enabled: data.reminder_enabled ?? true,
                    notes: data.notes,
                    is_recurring: data.is_recurring ?? false,
                    created_by: user.id,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                throw insertError;
            }

            return { data: session, error: null };
        } catch (err: any) {
            setError(err.message);
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a session
    const deleteSession = async (sessionId: string) => {
        if (!user) return { error: 'Not authenticated' };

        setIsLoading(true);

        try {
            const { error: deleteError } = await supabase
                .from('user_calendar_events')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', user.id); // Ensure user owns this event

            if (deleteError) throw deleteError;

            return { error: null };
        } catch (err: any) {
            return { error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Update a session
    const updateSession = async (sessionId: string, data: Partial<ScheduledSession>) => {
        if (!user) return { data: null, error: 'Not authenticated' };

        setIsLoading(true);

        try {
            const { data: session, error: updateError } = await supabase
                .from('user_calendar_events')
                .update(data)
                .eq('id', sessionId)
                .eq('user_id', user.id) // Ensure user owns this event
                .select()
                .single();

            if (updateError) throw updateError;

            return { data: session, error: null };
        } catch (err: any) {
            return { data: null, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getSessions,
        createSession,
        deleteSession,
        updateSession,
        isLoading,
        error,
    };
}
