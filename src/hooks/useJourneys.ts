'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { usePairing } from './usePairing';

export interface JourneyProgress {
    journey_type: string;
    completed_steps: number;
    total_steps: number;
    completed_at: string | null;
}

const STORAGE_KEY = 'journey_progress';

// Helper to get progress from localStorage
const getLocalProgress = (): Record<string, JourneyProgress> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
};

// Helper to save progress to localStorage
const setLocalProgress = (progress: Record<string, JourneyProgress>) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
};

export function useJourneys() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const [progressMap, setProgressMap] = useState<Record<string, JourneyProgress>>(() => getLocalProgress());
    const [isLoading, setIsLoading] = useState(true);
    const hasFetched = useRef(false);

    useEffect(() => {
        // Reset fetch flag when user changes
        if (user?.id) {
            hasFetched.current = false;
        }
    }, [user?.id]);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchJourneys = async () => {
            // Load from localStorage first as fallback
            const localProgress = getLocalProgress();

            if (!user) {
                setProgressMap(localProgress);
                setIsLoading(false);
                return;
            }

            try {
                // First try to get from user-specific progress
                const { data: userData, error: userError } = await supabase
                    .from('user_journey_progress')
                    .select('*')
                    .eq('user_id', user.id);

                let serverProgress: Record<string, JourneyProgress> = {};

                if (!userError && userData && userData.length > 0) {
                    userData.forEach((item: any) => {
                        serverProgress[item.journey_type] = {
                            journey_type: item.journey_type,
                            completed_steps: item.completed_steps,
                            total_steps: item.total_steps || 5,
                            completed_at: item.completed_at
                        };
                    });
                }

                // Also check couple progress if paired
                const { isPaired, coupleId } = await getStatus();

                if (isPaired && coupleId) {
                    const { data: coupleData, error: coupleError } = await supabase
                        .from('journey_progress')
                        .select('*')
                        .eq('couple_id', coupleId);

                    if (!coupleError && coupleData && coupleData.length > 0) {
                        coupleData.forEach((item: any) => {
                            // Take the higher progress between user and couple
                            const existing = serverProgress[item.journey_type];
                            if (!existing || item.completed_steps > existing.completed_steps) {
                                serverProgress[item.journey_type] = {
                                    journey_type: item.journey_type,
                                    completed_steps: item.completed_steps,
                                    total_steps: item.total_steps || 5,
                                    completed_at: item.completed_at
                                };
                            }
                        });
                    }
                }

                // Merge with local progress (take the higher value)
                Object.keys(localProgress).forEach(key => {
                    if (!serverProgress[key] || localProgress[key].completed_steps > (serverProgress[key]?.completed_steps || 0)) {
                        serverProgress[key] = localProgress[key];
                    }
                });

                setProgressMap(serverProgress);
                setLocalProgress(serverProgress);

                // Sync local progress to server if user is logged in
                if (Object.keys(localProgress).length > 0) {
                    await syncLocalToServer(localProgress, user.id, coupleId);
                }
            } catch (error) {
                console.error('Error fetching journeys:', error);
                setProgressMap(localProgress);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJourneys();
    }, [user]);

    // Sync local progress to server
    const syncLocalToServer = async (localProgress: Record<string, JourneyProgress>, userId: string, coupleId?: string) => {
        try {
            for (const journeyType of Object.keys(localProgress)) {
                const progress = localProgress[journeyType];

                // Always save to user_journey_progress
                await supabase
                    .from('user_journey_progress')
                    .upsert({
                        user_id: userId,
                        journey_type: journeyType,
                        completed_steps: progress.completed_steps,
                        total_steps: progress.total_steps || 5,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,journey_type' });

                // Also save to couple progress if paired
                if (coupleId) {
                    await supabase
                        .from('journey_progress')
                        .upsert({
                            couple_id: coupleId,
                            journey_type: journeyType,
                            completed_steps: progress.completed_steps,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'couple_id,journey_type' });
                }
            }
        } catch (error) {
            console.error('Error syncing to server:', error);
        }
    };

    const updateProgress = async (journeyType: string, completedSteps: number) => {
        // Always save to localStorage first
        const currentLocal = getLocalProgress();
        const totalSteps = journeyType === 'basics' ? 5 : journeyType === 'communication' ? 7 : 6;
        const newProgress: JourneyProgress = {
            journey_type: journeyType,
            completed_steps: completedSteps,
            total_steps: totalSteps,
            completed_at: completedSteps >= totalSteps ? new Date().toISOString() : null
        };

        currentLocal[journeyType] = newProgress;
        setLocalProgress(currentLocal);
        setProgressMap({ ...currentLocal });

        // Save to server if user is logged in
        if (user?.id) {
            try {
                // Always save to user_journey_progress (user-specific)
                const { error: userError } = await supabase
                    .from('user_journey_progress')
                    .upsert({
                        user_id: user.id,
                        journey_type: journeyType,
                        completed_steps: completedSteps,
                        total_steps: totalSteps,
                        completed_at: newProgress.completed_at,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,journey_type' });

                if (userError) {
                    console.error('Error saving user progress:', userError);
                }

                // Also save to couple progress if paired
                const { isPaired, coupleId } = await getStatus();

                if (isPaired && coupleId) {
                    await supabase
                        .from('journey_progress')
                        .upsert({
                            couple_id: coupleId,
                            journey_type: journeyType,
                            completed_steps: completedSteps,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'couple_id,journey_type' });
                }
            } catch (error) {
                console.error('Error saving to server:', error);
            }
        }
    };

    const refetch = () => {
        hasFetched.current = false;
    };

    return {
        progressMap,
        isLoading,
        updateProgress,
        refetch
    };
}
