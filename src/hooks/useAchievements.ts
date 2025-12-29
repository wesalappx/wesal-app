'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: string;
    progress?: number;
    target?: number;
}

// Achievement definitions
const ACHIEVEMENT_DEFS: Omit<Achievement, 'id' | 'unlocked' | 'unlockedAt' | 'progress'>[] = [
    { type: 'first_checkin', title: 'البداية', description: 'أكملت أول تسجيل حالة', icon: 'star', target: 1 },
    { type: 'week_streak', title: 'صاملين', description: 'سجلت حالتك ٧ أيام متتالية', icon: 'flame', target: 7 },
    { type: 'mood_sync', title: 'قلب واحد', description: 'توافقت حالتكم المزاجية ٥ مرات', icon: 'heart', target: 5 },
    { type: 'games_played', title: 'تحدي اللعب', description: 'لعبتم ١٠ ألعاب معاً', icon: 'trophy', target: 10 },
    { type: 'sessions_scheduled', title: 'منظمين', description: 'جدولتم ٥ جلسات في التقويم', icon: 'calendar', target: 5 },
    { type: 'paired', title: 'متصلين', description: 'تم الربط مع الشريك', icon: 'link', target: 1 },
];

export function useAchievements() {
    const supabase = createClient();
    const { user } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAchievements = async () => {
        if (!user) return;

        setIsLoading(true);

        try {
            // Fetch user's unlocked achievements
            const { data: userAchievements, error } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', user.id);

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching achievements:', error);
            }

            const unlockedMap = new Map(
                (userAchievements || []).map(a => [a.achievement_type, a])
            );

            // Combine definitions with user progress
            const combinedAchievements: Achievement[] = ACHIEVEMENT_DEFS.map((def, index) => {
                const userAchievement = unlockedMap.get(def.type);
                return {
                    id: `${index}`,
                    ...def,
                    unlocked: !!userAchievement?.unlocked_at,
                    unlockedAt: userAchievement?.unlocked_at,
                    progress: userAchievement?.progress || 0,
                };
            });

            setAchievements(combinedAchievements);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Unlock an achievement
    const unlockAchievement = async (type: string) => {
        if (!user) return;

        try {
            await supabase
                .from('user_achievements')
                .upsert({
                    user_id: user.id,
                    achievement_type: type,
                    unlocked_at: new Date().toISOString(),
                    progress: 1,
                });

            // Update local state
            setAchievements(prev =>
                prev.map(a => a.type === type ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a)
            );
        } catch (error) {
            console.error('Error unlocking achievement:', error);
        }
    };

    // Update achievement progress
    const updateProgress = async (type: string, progress: number) => {
        if (!user) return;

        const achievement = ACHIEVEMENT_DEFS.find(a => a.type === type);
        const shouldUnlock = achievement?.target && progress >= achievement.target;

        try {
            await supabase
                .from('user_achievements')
                .upsert({
                    user_id: user.id,
                    achievement_type: type,
                    progress,
                    unlocked_at: shouldUnlock ? new Date().toISOString() : null,
                });

            setAchievements(prev =>
                prev.map(a => a.type === type ? {
                    ...a,
                    progress,
                    unlocked: shouldUnlock || a.unlocked,
                    unlockedAt: shouldUnlock ? new Date().toISOString() : a.unlockedAt
                } : a)
            );
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, [user]);

    return {
        achievements,
        isLoading,
        unlockAchievement,
        updateProgress,
        refetch: fetchAchievements,
    };
}
