'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Moon,
    Heart,
    Send,
    Clock,
    Sparkles,
    X,
    Wifi
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';
import Confetti from '@/components/Confetti';
import { useSessionSync } from '@/hooks/useSessionSync';
import SessionModeModal from '@/components/SessionModeModal';
import SessionChat from '@/components/SessionChat';
import { whisperCards, responseOptions, timeOptions, WhisperCard } from './data/whisperCards';

type WhisperStatus = 'pending' | 'accepted' | 'later' | 'not_now' | 'expired';

interface Whisper {
    id: string;
    couple_id: string;
    sender_id: string;
    message_id: string;
    scheduled_time: string | null;
    status: WhisperStatus;
    response_message: string | null;
    created_at: string;
    responded_at: string | null;
}

export default function WhisperPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const { language } = useSettingsStore();
    const { playSound } = useSound();
    const isRTL = language === 'ar';

    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string>('');
    const [showModeModal, setShowModeModal] = useState(false);

    // Session Sync
    const {
        session,
        mode: sessionMode,
        initSession,
        updateState,
        isRemote,
        isConnected
    } = useSessionSync('whisper', 'daily');

    const [selectedCard, setSelectedCard] = useState<WhisperCard | null>(null);

    // Sync state effects
    useEffect(() => {
        if (isRemote && session?.state?.cardId) {
            const card = whisperCards.find(c => c.id === session.state.cardId);
            if (card && card.id !== selectedCard?.id) {
                setSelectedCard(card);
                playSound('pop');
            }
        }
    }, [isRemote, session?.state?.cardId]);

    // Load pairing
    useEffect(() => {
        async function loadData() {
            if (!user) return;
            const status = await getStatus();
            if (status.isPaired && status.coupleId) {
                setCoupleId(status.coupleId);
                if (status.partner) {
                    setPartnerId(status.partner.id);
                    setPartnerName(status.partner.display_name || status.partner.username || '');
                }
            }
        }
        loadData();
    }, [user]);

    const handleCardSelect = (card: WhisperCard) => {
        setSelectedCard(card);
        playSound('click');
        if (isRemote) {
            updateState({ cardId: card.id });
        }
    };

    const handleModeSelect = (mode: 'local' | 'remote') => {
        initSession(mode);
        setShowModeModal(false);
    };

    // Not paired state
    if (!coupleId) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-surface-950">
                <div className="text-center">
                    <Moon className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h2 className="text-xl font-bold mb-2 text-white">
                        {language === 'ar' ? 'تحتاج ارتباط أولاً' : 'You need to pair first'}
                    </h2>
                    <Link href="/pairing" className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium">
                        {language === 'ar' ? 'اربط مع شريكك' : 'Pair with partner'}
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen relative overflow-hidden bg-surface-950">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-surface-950 to-black -z-10" />

            {/* Header */}
            <header className="relative z-10 p-4 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 text-surface-400 hover:text-white">
                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Link>
                <div className="text-center">
                    <h1 className="text-lg font-bold flex items-center gap-2 justify-center text-white">
                        <Moon className="w-5 h-5 text-purple-400" />
                        {language === 'ar' ? 'همسة خاصة' : 'Private Whisper'}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-purple-300/60">
                        <span>{partnerName}</span>
                        {isRemote && (
                            <span className={`flex items-center gap-1 ${isConnected ? 'text-green-400' : 'text-amber-400'}`}>
                                <Wifi className="w-3 h-3" />
                                {isConnected ? (language === 'ar' ? 'متصل' : 'Connected') : (language === 'ar' ? 'في الانتظار...' : 'Waiting...')}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setShowModeModal(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isRemote
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-surface-400 hover:bg-white/10'}`}
                >
                    <Sparkles className="w-3 h-3" />
                    {isRemote ? (language === 'ar' ? 'تغيير الوضع' : 'Change Mode') : (language === 'ar' ? 'بدء جلسة' : 'Start Session')}
                </button>
            </header>

            {/* Content */}
            <div className="px-4 pb-32 max-w-lg mx-auto">
                {/* Selected Card Spotlight */}
                <AnimatePresence mode="wait">
                    {selectedCard ? (
                        <motion.div
                            key="selected"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface-800/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 text-center mb-8 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-6xl mb-6 block"
                            >
                                {selectedCard.emoji}
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-4 leading-relaxed" dir={isRTL ? 'rtl' : 'ltr'}>
                                {language === 'ar' ? selectedCard.text_ar : selectedCard.text_en}
                            </h2>
                            <button
                                onClick={() => handleCardSelect(null as any)}
                                className="text-sm text-surface-400 hover:text-white mt-4"
                            >
                                {language === 'ar' ? 'اختيار بطاقة أخرى' : 'Choose another card'}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 gap-3"
                        >
                            {whisperCards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardSelect(card)}
                                    className="bg-surface-800/50 hover:bg-surface-700/50 border border-white/5 hover:border-purple-500/50 rounded-2xl p-4 text-center transition-all group"
                                >
                                    <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{card.emoji}</span>
                                    <p className="text-xs text-surface-400 group-hover:text-purple-200 transition-colors line-clamp-2">
                                        {language === 'ar' ? card.text_ar : card.text_en}
                                    </p>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Overlay */}
            {isRemote && session && user && (
                <SessionChat
                    sessionId={session.id}
                    userId={user.id}
                    partnerName={partnerName}
                />
            )}

            <SessionModeModal
                isOpen={showModeModal}
                onSelectMode={handleModeSelect}
                onClose={() => setShowModeModal(false)}
                isSharedAvailable={true}
            />
        </main>
    );
}
