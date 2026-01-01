'use client';

import { createClient } from '@/lib/supabase/client';
import { usePairing } from '@/hooks/usePairing';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';

export interface Note {
    id: string;
    couple_id: string;
    title: string;
    content: string | null;
    category: 'general' | 'journey' | 'budget' | 'wishlist' | 'memories';
    is_pinned: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface SpecialDate {
    id: string;
    couple_id: string;
    title: string;
    event_date: string;
    event_type: 'birthday' | 'anniversary' | 'first_date' | 'first_kiss' | 'wedding' | 'custom';
    reminder_days: number;
    notes: string | null;
    created_at: string;
}

export interface BudgetGoal {
    id: string;
    couple_id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    status: 'active' | 'completed' | 'cancelled';
    created_at: string;
}

export function useNotes() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const [notes, setNotes] = useState<Note[]>([]);
    const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
    const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [coupleId, setCoupleId] = useState<string | null>(null);

    // Get couple ID
    useEffect(() => {
        const fetchCoupleId = async () => {
            const status = await getStatus();
            if (status.coupleId) {
                setCoupleId(status.coupleId);
            }
        };
        fetchCoupleId();
    }, [getStatus]);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!coupleId) return;
        setLoading(true);

        try {
            // Fetch notes
            const { data: notesData } = await supabase
                .from('notes')
                .select('*')
                .eq('couple_id', coupleId)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (notesData) setNotes(notesData);

            // Fetch special dates
            const { data: datesData } = await supabase
                .from('special_dates')
                .select('*')
                .eq('couple_id', coupleId)
                .order('event_date', { ascending: true });

            if (datesData) setSpecialDates(datesData);

            // Fetch budget goals
            const { data: budgetData } = await supabase
                .from('budget_goals')
                .select('*')
                .eq('couple_id', coupleId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (budgetData) setBudgetGoals(budgetData);
        } catch (error) {
            console.error('Error fetching notes data:', error);
        } finally {
            setLoading(false);
        }
    }, [coupleId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Notes CRUD
    const createNote = async (title: string, content: string, category: Note['category'] = 'general') => {
        if (!coupleId || !user) return { error: 'Not paired' };

        const { data, error } = await supabase
            .from('notes')
            .insert({
                couple_id: coupleId,
                title,
                content,
                category,
                created_by: user.id
            })
            .select()
            .single();

        if (data) {
            setNotes(prev => [data, ...prev]);
        }
        return { data, error };
    };

    const updateNote = async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'category' | 'is_pinned'>>) => {
        const { data, error } = await supabase
            .from('notes')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (data) {
            setNotes(prev => prev.map(n => n.id === id ? data : n));
        }
        return { data, error };
    };

    const deleteNote = async (id: string) => {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (!error) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
        return { error };
    };

    // Special Dates CRUD
    const createSpecialDate = async (title: string, eventDate: string, eventType: SpecialDate['event_type'] = 'custom', reminderDays = 7) => {
        if (!coupleId || !user) return { error: 'Not paired' };

        const { data, error } = await supabase
            .from('special_dates')
            .insert({
                couple_id: coupleId,
                title,
                event_date: eventDate,
                event_type: eventType,
                reminder_days: reminderDays,
                created_by: user.id
            })
            .select()
            .single();

        if (data) {
            setSpecialDates(prev => [...prev, data].sort((a, b) =>
                new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
            ));
        }
        return { data, error };
    };

    const updateSpecialDate = async (id: string, updates: Partial<Pick<SpecialDate, 'title' | 'event_date' | 'event_type'>>) => {
        const { data, error } = await supabase
            .from('special_dates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (data) {
            setSpecialDates(prev => prev.map(d => d.id === id ? data : d).sort((a, b) =>
                new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
            ));
        }
        return { data, error };
    };

    const deleteSpecialDate = async (id: string) => {
        const { error } = await supabase
            .from('special_dates')
            .delete()
            .eq('id', id);

        if (!error) {
            setSpecialDates(prev => prev.filter(d => d.id !== id));
        }
        return { error };
    };

    // Budget Goals CRUD
    const createBudgetGoal = async (title: string, targetAmount: number, deadline?: string) => {
        if (!coupleId || !user) return { error: 'Not paired' };

        const { data, error } = await supabase
            .from('budget_goals')
            .insert({
                couple_id: coupleId,
                title,
                target_amount: targetAmount,
                deadline: deadline || null,
                created_by: user.id
            })
            .select()
            .single();

        if (data) {
            setBudgetGoals(prev => [data, ...prev]);
        }
        return { data, error };
    };

    const updateBudgetGoal = async (id: string, updates: Partial<Pick<BudgetGoal, 'title' | 'target_amount' | 'current_amount' | 'status'>>) => {
        const goal = budgetGoals.find(g => g.id === id);
        if (!goal) return { error: 'Goal not found' };

        // Calculate status if current_amount is being updated
        let status = updates.status || goal.status;
        if (updates.current_amount !== undefined) {
            status = updates.current_amount >= (updates.target_amount || goal.target_amount) ? 'completed' : 'active';
        }

        const { data, error } = await supabase
            .from('budget_goals')
            .update({ ...updates, status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (data) {
            if (status === 'completed' && updates.status !== 'active') { // Remove if completed unless explicitly setting active
                setBudgetGoals(prev => prev.filter(g => g.id !== id));
            } else {
                setBudgetGoals(prev => prev.map(g => g.id === id ? data : g));
            }
        }
        return { data, error };
    };

    const deleteBudgetGoal = async (id: string) => {
        const { error } = await supabase
            .from('budget_goals')
            .delete()
            .eq('id', id);

        if (!error) {
            setBudgetGoals(prev => prev.filter(g => g.id !== id));
        }
        return { error };
    };

    return {
        notes,
        specialDates,
        budgetGoals,
        loading,
        // Notes
        createNote,
        updateNote,
        deleteNote,
        // Special Dates
        createSpecialDate,
        updateSpecialDate,
        deleteSpecialDate,
        // Budget
        createBudgetGoal,
        updateBudgetGoal,
        deleteBudgetGoal,
        // Refresh
        refresh: fetchData
    };
}
