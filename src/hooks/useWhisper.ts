'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { usePairing } from './usePairing';

export interface WhisperRequest {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    type: 'call' | 'thinking' | 'miss' | 'custom';
    sentAt: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export type WhisperStatus = 'idle' | 'sending' | 'waiting' | 'connected' | 'declined';

interface WhisperPayload {
    type: 'whisper_request' | 'whisper_response' | 'whisper_cancel';
    senderId: string;
    senderName: string;
    message?: string;
    whisperType?: string;
    response?: 'accept' | 'decline';
    timestamp: string;
}

export function useWhisper() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();

    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string>('');

    // Whisper states
    const [status, setStatus] = useState<WhisperStatus>('idle');
    const [incomingWhisper, setIncomingWhisper] = useState<WhisperRequest | null>(null);
    const [outgoingWhisper, setOutgoingWhisper] = useState<WhisperRequest | null>(null);

    // Load pairing info
    useEffect(() => {
        async function loadPairing() {
            if (!user) return;
            const pairingStatus = await getStatus();
            if (pairingStatus.isPaired && pairingStatus.coupleId) {
                setCoupleId(pairingStatus.coupleId);
                if (pairingStatus.partner) {
                    setPartnerId(pairingStatus.partner.id);
                    setPartnerName(pairingStatus.partner.display_name || pairingStatus.partner.username || 'Partner');
                }
            }
        }
        loadPairing();
    }, [user]);

    // Subscribe to whisper channel
    useEffect(() => {
        if (!coupleId || !user?.id) return;

        const channelName = `whisper-${coupleId}`;
        const whisperChannel = supabase.channel(channelName);

        whisperChannel
            .on('broadcast', { event: 'whisper' }, ({ payload }: { payload: WhisperPayload }) => {
                // Ignore our own messages
                if (payload.senderId === user.id) return;

                if (payload.type === 'whisper_request') {
                    // Incoming whisper from partner
                    setIncomingWhisper({
                        id: `${payload.senderId}-${payload.timestamp}`,
                        senderId: payload.senderId,
                        senderName: payload.senderName,
                        message: payload.message || '',
                        type: (payload.whisperType as 'call' | 'thinking' | 'miss' | 'custom') || 'call',
                        sentAt: payload.timestamp,
                        status: 'pending'
                    });
                } else if (payload.type === 'whisper_response') {
                    // Partner responded to our whisper
                    if (payload.response === 'accept') {
                        setStatus('connected');
                        setOutgoingWhisper(prev => prev ? { ...prev, status: 'accepted' } : null);
                    } else {
                        setStatus('declined');
                        setOutgoingWhisper(prev => prev ? { ...prev, status: 'declined' } : null);
                        // Reset after 3 seconds
                        setTimeout(() => {
                            setStatus('idle');
                            setOutgoingWhisper(null);
                        }, 3000);
                    }
                } else if (payload.type === 'whisper_cancel') {
                    // Partner cancelled
                    setIncomingWhisper(null);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(whisperChannel);
        };
    }, [coupleId, user?.id, supabase]);

    // Auto-expire incoming whispers after 60 seconds
    useEffect(() => {
        if (!incomingWhisper || incomingWhisper.status !== 'pending') return;

        const timeout = setTimeout(() => {
            setIncomingWhisper(prev => prev ? { ...prev, status: 'expired' } : null);
            setTimeout(() => setIncomingWhisper(null), 2000);
        }, 60000);

        return () => clearTimeout(timeout);
    }, [incomingWhisper]);

    // Send whisper to partner
    const sendWhisper = useCallback(async (message: string, type: 'call' | 'thinking' | 'miss' | 'custom' = 'call') => {
        if (!coupleId || !user?.id || !partnerId) return { error: 'Not paired' };

        setStatus('sending');

        const whisperChannel = supabase.channel(`whisper-${coupleId}`);

        const payload: WhisperPayload = {
            type: 'whisper_request',
            senderId: user.id,
            senderName: user.user_metadata?.display_name || 'Partner',
            message,
            whisperType: type,
            timestamp: new Date().toISOString()
        };

        await whisperChannel.subscribe();
        await whisperChannel.send({
            type: 'broadcast',
            event: 'whisper',
            payload
        });

        setStatus('waiting');
        setOutgoingWhisper({
            id: `${user.id}-${payload.timestamp}`,
            senderId: user.id,
            senderName: payload.senderName,
            message,
            type,
            sentAt: payload.timestamp,
            status: 'pending'
        });

        // Auto-timeout after 60 seconds
        setTimeout(() => {
            setStatus(prev => prev === 'waiting' ? 'idle' : prev);
            setOutgoingWhisper(null);
        }, 60000);

        return { error: null };
    }, [coupleId, user, partnerId, supabase]);

    // Respond to whisper
    const respondToWhisper = useCallback(async (accept: boolean) => {
        if (!coupleId || !user?.id || !incomingWhisper) return;

        const whisperChannel = supabase.channel(`whisper-${coupleId}`);

        const payload: WhisperPayload = {
            type: 'whisper_response',
            senderId: user.id,
            senderName: user.user_metadata?.display_name || 'Partner',
            response: accept ? 'accept' : 'decline',
            timestamp: new Date().toISOString()
        };

        await whisperChannel.subscribe();
        await whisperChannel.send({
            type: 'broadcast',
            event: 'whisper',
            payload
        });

        if (accept) {
            setIncomingWhisper(prev => prev ? { ...prev, status: 'accepted' } : null);
            setStatus('connected');
        } else {
            setIncomingWhisper(null);
            setStatus('idle');
        }
    }, [coupleId, user, incomingWhisper, supabase]);

    // Cancel outgoing whisper
    const cancelWhisper = useCallback(async () => {
        if (!coupleId || !user?.id) return;

        const whisperChannel = supabase.channel(`whisper-${coupleId}`);

        await whisperChannel.subscribe();
        await whisperChannel.send({
            type: 'broadcast',
            event: 'whisper',
            payload: {
                type: 'whisper_cancel',
                senderId: user.id,
                senderName: user.user_metadata?.display_name || 'Partner',
                timestamp: new Date().toISOString()
            }
        });

        setStatus('idle');
        setOutgoingWhisper(null);
    }, [coupleId, user, supabase]);

    // Dismiss incoming whisper without responding
    const dismissWhisper = useCallback(() => {
        setIncomingWhisper(null);
    }, []);

    // Reset all states
    const resetWhisper = useCallback(() => {
        setStatus('idle');
        setIncomingWhisper(null);
        setOutgoingWhisper(null);
    }, []);

    return {
        // State
        status,
        incomingWhisper,
        outgoingWhisper,
        partnerName,
        isConnected: status === 'connected',
        isWaiting: status === 'waiting',
        hasIncoming: incomingWhisper !== null && incomingWhisper.status === 'pending',

        // Actions
        sendWhisper,
        respondToWhisper,
        cancelWhisper,
        dismissWhisper,
        resetWhisper
    };
}
