'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

type SocketNamespace = 'pairing' | 'game' | 'conflict';

export function useSocket(namespace: SocketNamespace) {
    const socketRef = useRef<Socket | null>(null);
    const { user, accessToken } = useAuthStore();

    useEffect(() => {
        if (!user || !accessToken) return;

        // SEC-02 FIX: Send JWT token for authentication, not just userId
        const socket = io(`${SOCKET_URL}/${namespace}`, {
            auth: {
                token: accessToken,  // JWT token for server-side validation
                userId: user.id
            },
            extraHeaders: {
                Authorization: `Bearer ${accessToken}`
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            // Socket connected
        });

        socket.on('disconnect', (reason) => {
            // Socket disconnected
        });

        socket.on('connect_error', (error) => {
            console.error(`Socket connection error (${namespace}):`, error.message);
            // If auth error, token might be expired
            if (error.message.includes('auth') || error.message.includes('unauthorized')) {
                // Socket auth failed - token may be expired
            }
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [namespace, user, accessToken]);

    const emit = useCallback((event: string, data?: any) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    }, []);

    const on = useCallback((event: string, callback: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    }, []);

    const off = useCallback((event: string, callback?: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
    }, []);

    return { socket: socketRef.current, emit, on, off };
}

// Hook for pairing-specific events
export function usePairingSocket() {
    const { on, off, emit } = useSocket('pairing');
    const { setPartner, setIsPaired } = useAuthStore();

    useEffect(() => {
        const handlePairingSuccess = (data: { coupleId: string; partnerId: string }) => {
            setIsPaired(true);
            // Fetch partner details
        };

        const handleUnpairRequest = (data: { requestedBy: string }) => {
            // Show notification
            // Unpair requested by partner
        };

        const handleUnpaired = () => {
            setPartner(null);
            setIsPaired(false);
        };

        on('pairing:success', handlePairingSuccess);
        on('pairing:unpair-request', handleUnpairRequest);
        on('pairing:unpaired', handleUnpaired);

        return () => {
            off('pairing:success');
            off('pairing:unpair-request');
            off('pairing:unpaired');
        };
    }, [on, off, setPartner, setIsPaired]);

    return { emit };
}

// Hook for game-specific events
export function useGameSocket() {
    const { on, off, emit } = useSocket('game');

    const sendReady = useCallback((journeySlug: string, ready: boolean) => {
        emit('game:ready', { journeySlug, ready });
    }, [emit]);

    const syncState = useCallback((journeySlug: string) => {
        emit('game:sync', { journeySlug });
    }, [emit]);

    return { on, off, sendReady, syncState };
}

// Hook for conflict resolution events
export function useConflictSocket() {
    const { on, off, emit } = useSocket('conflict');

    const joinSession = useCallback((sessionId: string) => {
        emit('conflict:join', { sessionId });
    }, [emit]);

    const advancePhase = useCallback((sessionId: string, phase: string) => {
        emit('conflict:advance-phase', { sessionId, phase });
    }, [emit]);

    const startTimer = useCallback((sessionId: string, durationSeconds: number) => {
        emit('conflict:start-timer', { sessionId, durationSeconds });
    }, [emit]);

    const signalReady = useCallback((sessionId: string) => {
        emit('conflict:ready', { sessionId });
    }, [emit]);

    return { on, off, joinSession, advancePhase, startTimer, signalReady };
}
