'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { usePairing } from './usePairing';

export interface ProgressData {
    week: string;
    trend: 'Improving' | 'Stable' | 'Declining';
    streak: number;
    sessions: number;
    checkIns: number;
    alignment: number;
    focus: string;
}

export function useProgress() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProgress = async () => {
        if (!user) return;

        setIsLoading(true);

        try {
            const { isPaired, coupleId } = await getStatus();

            // Get date range for this week
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);

            // Format week string
            const weekStr = `${startOfWeek.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}`;

            // Get check-ins for this week
            const { data: checkIns } = await supabase
                .from('check_ins')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startOfWeek.toISOString())
                .lt('created_at', endOfWeek.toISOString());

            // Get streak
            let streak = 0;
            if (isPaired && coupleId) {
                const { data: streakData } = await supabase
                    .from('streaks')
                    .select('current_streak')
                    .eq('couple_id', coupleId)
                    .maybeSingle();

                if (streakData) {
                    streak = streakData.current_streak;
                }
            }

            // Get sessions this week
            let sessions = 0;
            if (isPaired && coupleId) {
                const { data: sessionData } = await supabase
                    .from('scheduled_sessions')
                    .select('id')
                    .eq('couple_id', coupleId)
                    .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
                    .lt('scheduled_date', endOfWeek.toISOString().split('T')[0]);

                sessions = sessionData?.length || 0;
            }

            // Calculate alignment based on check-in scores
            let alignment = 0;
            if (checkIns && checkIns.length > 0) {
                const avgScore = checkIns.reduce((sum, c) =>
                    sum + (c.mood + c.energy + c.stress) / 3, 0
                ) / checkIns.length;
                alignment = Math.round((avgScore / 5) * 100) / 100;
            }

            // Determine trend
            let trend: 'Improving' | 'Stable' | 'Declining' = 'Stable';
            if (checkIns && checkIns.length >= 3) {
                const firstHalf = checkIns.slice(0, Math.floor(checkIns.length / 2));
                const secondHalf = checkIns.slice(Math.floor(checkIns.length / 2));

                const firstAvg = firstHalf.reduce((s, c) => s + c.mood, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((s, c) => s + c.mood, 0) / secondHalf.length;

                if (secondAvg > firstAvg + 0.3) trend = 'Improving';
                else if (secondAvg < firstAvg - 0.3) trend = 'Declining';
            }

            // Determine focus area (lowest score category)
            let focus = 'التواصل';
            if (checkIns && checkIns.length > 0) {
                const avgMood = checkIns.reduce((s, c) => s + c.mood, 0) / checkIns.length;
                const avgEnergy = checkIns.reduce((s, c) => s + c.energy, 0) / checkIns.length;
                const avgStress = checkIns.reduce((s, c) => s + c.stress, 0) / checkIns.length;

                const lowest = Math.min(avgMood, avgEnergy, avgStress);
                if (lowest === avgMood) focus = 'المزاج';
                else if (lowest === avgEnergy) focus = 'الطاقة';
                else focus = 'الضغط';
            }

            setProgress({
                week: weekStr,
                trend,
                streak,
                sessions,
                checkIns: checkIns?.length || 0,
                alignment,
                focus,
            });
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [user]);

    return {
        progress,
        isLoading,
        refetch: fetchProgress,
    };
}
