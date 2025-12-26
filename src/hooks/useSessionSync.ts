import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';

export interface SessionState {
    stepIndex?: number;
    answers?: Record<string, any>;
    turn?: string;
    isTyping?: boolean;
    [key: string]: any;
}

export interface ActiveSession {
    id: string;
    activity_type: 'journey' | 'game' | 'whisper';
    activity_id: string;
    mode: 'remote' | 'local';
    state: SessionState;
    created_by: string;
}

export function useSessionSync(activityType: string, activityId: string) {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();

    const [session, setSession] = useState<ActiveSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [presence, setPresence] = useState<any[]>([]);
    const [mode, setMode] = useState<'remote' | 'local' | null>(null);

    const channelRef = useRef<any>(null);

    // Initialize or Join Session
    const initSession = useCallback(async (selectedMode: 'remote' | 'local') => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const { isPaired, coupleId } = await getStatus();
            if (!isPaired || !coupleId) {
                // If not paired, force local mode
                setMode('local');
                setLoading(false);
                return;
            }

            setMode(selectedMode);

            if (selectedMode === 'local') {
                setLoading(false);
                return;
            }

            // REMOTE MODE: Find active session or create one
            const { data: existingSession, error: fetchError } = await supabase
                .from('active_sessions')
                .select('*')
                .eq('couple_id', coupleId)
                .eq('activity_type', activityType)
                .eq('activity_id', activityId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            let currentSession = existingSession;

            if (!currentSession) {
                // Create new session
                const { data: newSession, error: createError } = await supabase
                    .from('active_sessions')
                    .insert({
                        couple_id: coupleId,
                        activity_type: activityType,
                        activity_id: activityId,
                        mode: 'remote',
                        created_by: user.id
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                currentSession = newSession;
            }

            setSession(currentSession);
            subscribeToSession(currentSession.id);

        } catch (err: any) {
            console.error('Session init error:', err);
            setError(err.message);
            // Fallback to local on error?
            setMode('local');
        } finally {
            setLoading(false);
        }
    }, [user, activityType, activityId, getStatus]);

    // Subscribe to Realtime Changes
    const subscribeToSession = useCallback((sessionId: string) => {
        if (channelRef.current) return;

        const channel = supabase.channel(`session:${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'active_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                setSession(payload.new as ActiveSession);
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                setPresence(Object.values(newState).flat());
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user?.id,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;
    }, [user]);

    // Update Session State
    const updateState = useCallback(async (newState: Partial<SessionState>) => {
        if (mode === 'local' || !session) return;

        // Optimistic update
        setSession(prev => prev ? { ...prev, state: { ...prev.state, ...newState } } : null);

        const { error } = await supabase
            .from('active_sessions')
            .update({
                state: { ...session.state, ...newState },
                updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

        if (error) console.error('State update failed:', error);
    }, [mode, session]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    return {
        session,
        mode,
        loading,
        error,
        presence,
        initSession,
        updateState,
        isRemote: mode === 'remote'
    };
}
