'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const OFFLINE_THRESHOLD = 60000; // Consider offline after 60 seconds of no update

/**
 * Global presence hook that tracks user online status across the entire app.
 * Call this once in your root layout or a global provider.
 */
export function usePresence() {
    const supabase = createClient();
    const { user } = useAuthStore();
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    // Update presence in database
    const updatePresence = useCallback(async (isOnline: boolean) => {
        if (!user?.id) return;

        try {
            await supabase
                .from('profiles')
                .update({
                    is_online: isOnline,
                    last_seen_at: new Date().toISOString()
                })
                .eq('id', user.id);
        } catch (error) {
            console.error('Error updating presence:', error);
        }
    }, [user?.id, supabase]);

    // Set online and start heartbeat
    const goOnline = useCallback(() => {
        updatePresence(true);

        // Clear existing heartbeat
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
        }

        // Start heartbeat to keep updating last_seen_at
        heartbeatRef.current = setInterval(() => {
            updatePresence(true);
        }, HEARTBEAT_INTERVAL);
    }, [updatePresence]);

    // Set offline
    const goOffline = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
        updatePresence(false);
    }, [updatePresence]);

    useEffect(() => {
        if (!user?.id || isInitializedRef.current) return;
        isInitializedRef.current = true;

        // Go online when component mounts
        goOnline();

        // Handle visibility change (tab switch, minimize)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                goOnline();
            } else {
                // Update last_seen but keep online (user might come back)
                updatePresence(true);
            }
        };

        // Handle before unload (closing tab/window)
        const handleBeforeUnload = () => {
            goOffline();
        };

        // Handle focus/blur
        const handleFocus = () => goOnline();
        const handleBlur = () => updatePresence(true);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);

            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }

            // Set offline when unmounting
            goOffline();
        };
    }, [user?.id, goOnline, goOffline, updatePresence]);

    return { goOnline, goOffline };
}

/**
 * Hook to subscribe to partner's presence status in real-time.
 * Returns partner's online status and last seen time.
 */
export function usePartnerPresence(partnerId: string | undefined) {
    const supabase = createClient();
    const [partnerStatus, setPartnerStatus] = useState<{
        isOnline: boolean;
        lastSeenAt: Date | null;
    }>({ isOnline: false, lastSeenAt: null });

    useEffect(() => {
        if (!partnerId) return;

        // Fetch initial status
        const fetchStatus = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('is_online, last_seen_at')
                .eq('id', partnerId)
                .single();

            if (data) {
                setPartnerStatus({
                    isOnline: data.is_online ?? false,
                    lastSeenAt: data.last_seen_at ? new Date(data.last_seen_at) : null
                });
            }
        };

        fetchStatus();

        // Subscribe to real-time changes
        const channel = supabase.channel(`partner-presence-${partnerId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${partnerId}`
            }, (payload) => {
                const { is_online, last_seen_at } = payload.new as any;
                setPartnerStatus({
                    isOnline: is_online ?? false,
                    lastSeenAt: last_seen_at ? new Date(last_seen_at) : null
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [partnerId, supabase]);

    return partnerStatus;
}

/**
 * Format last seen time as a human-readable string.
 */
export function formatLastSeen(lastSeenAt: Date | null, language: 'ar' | 'en' = 'ar'): string {
    if (!lastSeenAt) return language === 'ar' ? 'غير معروف' : 'Unknown';

    const now = new Date();
    const diff = now.getTime() - lastSeenAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
        return language === 'ar' ? 'الآن' : 'Just now';
    } else if (minutes < 60) {
        return language === 'ar'
            ? `منذ ${minutes} دقيقة`
            : `${minutes} min ago`;
    } else if (hours < 24) {
        return language === 'ar'
            ? `منذ ${hours} ساعة`
            : `${hours}h ago`;
    } else {
        return language === 'ar'
            ? `منذ ${days} يوم`
            : `${days}d ago`;
    }
}

// Need to import useState for usePartnerPresence
import { useState } from 'react';
