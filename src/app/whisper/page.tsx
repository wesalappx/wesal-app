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

    const [activeWhisper, setActiveWhisper] = useState<Whisper | null>(null);
    const [iAmSender, setIAmSender] = useState(false);

    const [selectedCard, setSelectedCard] = useState<WhisperCard | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('tonight');
    const [isSending, setIsSending] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showModeModal, setShowModeModal] = useState(false); // Default false, triggered by button? Or true?

    // Session Sync
    const {
        session,
        mode: sessionMode,
        initSession,
        updateState,
        isRemote
    } = useSessionSync('whisper', 'daily');

    // Sync Selected Card
    useEffect(() => {
        if (isRemote && session?.state?.cardId) {
            const card = whisperCards.find(c => c.id === session.state.cardId);
            if (card) setSelectedCard(card);
        }
    }, [isRemote, session?.state?.cardId]);

    // Handle Card Selection with Sync
    const handleCardSelect = (card: WhisperCard) => {
        setSelectedCard(card);
        if (isRemote) {
            updateState({ cardId: card.id });
        }
    };

    // Load pairing status and active whisper
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

                // Check for active whisper
                const { data: whisper } = await supabase
                    .from('whispers')
                    .select('*')
                    .eq('couple_id', status.coupleId)
                    .in('status', ['pending'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (whisper) {
                    setActiveWhisper(whisper);
                    setIAmSender(whisper.sender_id === user.id);
                }
            }
        }
        loadData();
    }, [user]);

    // Real-time subscription for whisper updates
    useEffect(() => {
        if (!coupleId) return;

        const channel = supabase
            .channel(`whisper-${coupleId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'whispers',
                filter: `couple_id=eq.${coupleId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newWhisper = payload.new as Whisper;
                    setActiveWhisper(newWhisper);
                    setIAmSender(newWhisper.sender_id === user?.id);
                    if (newWhisper.sender_id !== user?.id) {
                        playSound('pop');
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updated = payload.new as Whisper;
                    setActiveWhisper(updated);
                    if (updated.status === 'accepted' && updated.sender_id === user?.id) {
                        setShowConfetti(true);
                        playSound('success');
                    }
                } else if (payload.eventType === 'DELETE') {
                    setActiveWhisper(null);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [coupleId, user]);

    const handleSendWhisper = async () => {
        if (!selectedCard || !coupleId || !user || !partnerId) return;

        setIsSending(true);
        playSound('whoosh');

        try {
            const { data, error } = await supabase
                .from('whispers')
                .insert({
                    couple_id: coupleId,
                    sender_id: user.id,
                    message_id: selectedCard.id,
                    scheduled_time: selectedTime,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Send notification to partner
            await supabase.from('notifications').insert({
                user_id: partnerId,
                type: 'whisper',
                title_ar: 'شريكك أرسلك همسة خاصة 🌙',
                title_en: 'Your partner sent you a private whisper 🌙',
                body_ar: 'افتح التطبيق لترى الرسالة',
                body_en: 'Open the app to see the message',
                data: { url: '/whisper' }
            });

            if (data) {
                setActiveWhisper(data);
                setIAmSender(true);
            }
        } catch (err) {
            console.error('Error sending whisper:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleRespond = async (responseId: 'accept' | 'later' | 'not_now') => {
        if (!activeWhisper) return;

        playSound('click');

        const statusMap = {
            accept: 'accepted',
            later: 'later',
            not_now: 'not_now'
        };

        try {
            await supabase
                .from('whispers')
                .update({
                    status: statusMap[responseId],
                    responded_at: new Date().toISOString()
                })
                .eq('id', activeWhisper.id);

            if (responseId === 'accept') {
                setShowConfetti(true);
            }

            // Notify sender
            const senderId = activeWhisper.sender_id;
            const response = responseOptions.find(r => r.id === responseId);

            await supabase.from('notifications').insert({
                user_id: senderId,
                type: 'whisper_response',
                title_ar: `رد على همستك: ${response?.text_ar}`,
                title_en: `Response to your whisper: ${response?.text_en}`,
                body_ar: responseId === 'accept' ? '💕 بانتظارك!' : '',
                body_en: responseId === 'accept' ? '💕 Waiting for you!' : '',
                data: { url: '/whisper' }
            });

        } catch (err) {
            console.error('Error responding:', err);
        }
    };

    const handleCancelWhisper = async () => {
        if (!activeWhisper) return;

        await supabase.from('whispers').delete().eq('id', activeWhisper.id);
        setActiveWhisper(null);
        setSelectedCard(null);
    };

    const getCardById = (id: string) => whisperCards.find(c => c.id === id);

    // Not paired state
    if (!coupleId) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center">
                    <Moon className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h2 className="text-xl font-bold mb-2">
                        {language === 'ar' ? 'تحتاج ارتباط أولاً' : 'You need to pair first'}
                    </h2>
                    <p className="text-surface-400 mb-6">
                        {language === 'ar' ? 'هالميزة حصرية للأزواج المرتبطين' : 'This feature is exclusive to paired couples'}
                    </p>
                    <Link href="/pairing" className="px-6 py-3 bg-purple-600 rounded-xl font-medium">
                        {language === 'ar' ? 'اربط مع شريكك' : 'Pair with partner'}
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen relative overflow-hidden">
            <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Romantic Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-purple-950 via-surface-950 to-black -z-10">
                <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="absolute top-40 right-20 w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-60 left-1/3 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-40 right-1/4 w-1 h-1 bg-pink-300/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 p-4 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2 text-surface-400 hover:text-white">
                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Link>
                <div className="text-center">
                    <h1 className="text-lg font-bold flex items-center gap-2 justify-center">
                        <Moon className="w-5 h-5 text-purple-400" />
                        {language === 'ar' ? 'همسة خاصة' : 'Private Whisper'}
                    </h1>
                    <p className="text-xs text-purple-300/60">{partnerName}</p>
                </div>
                <button
                    onClick={() => setShowModeModal(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isRemote
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-surface-400 hover:bg-white/10'
                        }`}
                >
                    <Wifi className={`w-3 h-3 ${isRemote ? 'animate-pulse' : ''}`} />
                    {isRemote ? (language === 'ar' ? 'متصل' : 'Live') : (language === 'ar' ? 'ربط' : 'Connect')}
                </button>
            </header>

            <AnimatePresence mode="wait">
                {/* STATE: Received a whisper */}
                {activeWhisper && !iAmSender && activeWhisper.status === 'pending' && (
                    <motion.div
                        key="received"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="px-6 pt-12 pb-32"
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30"
                            >
                                <Heart className="w-10 h-10 text-white" />
                            </motion.div>
                            <h2 className="text-xl font-bold mb-2">
                                {language === 'ar' ? 'وصلتك همسة من شريكك' : 'You received a whisper'}
                            </h2>
                        </div>

                        {/* Whisper Card */}
                        {(() => {
                            const card = getCardById(activeWhisper.message_id);
                            if (!card) return null;
                            return (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="relative mx-auto max-w-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-xl rounded-3xl" />
                                    <div className="relative bg-surface-800/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
                                        <span className="text-5xl mb-4 block">{card.emoji}</span>
                                        <p className="text-xl font-medium text-white leading-relaxed">
                                            {language === 'ar' ? card.text_ar : card.text_en}
                                        </p>
                                        {activeWhisper.scheduled_time && (
                                            <div className="mt-4 flex items-center justify-center gap-2 text-purple-300/80 text-sm">
                                                <Clock className="w-4 h-4" />
                                                {timeOptions.find(t => t.id === activeWhisper.scheduled_time)?.[language === 'ar' ? 'text_ar' : 'text_en']}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })()}

                        {/* Response Buttons */}
                        <div className="mt-8 space-y-3 max-w-sm mx-auto">
                            {responseOptions.map((option, idx) => (
                                <motion.button
                                    key={option.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    onClick={() => handleRespond(option.id)}
                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r ${option.color} text-white shadow-lg transition-transform active:scale-95`}
                                >
                                    <span className="text-xl">{option.emoji}</span>
                                    {language === 'ar' ? option.text_ar : option.text_en}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* STATE: Waiting for response */}
                {activeWhisper && iAmSender && activeWhisper.status === 'pending' && (
                    <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-6 pt-20 pb-32 text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-purple-500/20 flex items-center justify-center"
                        >
                            <Moon className="w-12 h-12 text-purple-400" />
                        </motion.div>

                        <h2 className="text-xl font-bold mb-2">
                            {language === 'ar' ? 'في انتظار الرد...' : 'Waiting for response...'}
                        </h2>
                        <p className="text-surface-400 mb-8">
                            {language === 'ar' ? 'أرسلت همستك لشريكك' : 'Your whisper was sent'}
                        </p>

                        {/* Preview of sent card */}
                        {(() => {
                            const card = getCardById(activeWhisper.message_id);
                            if (!card) return null;
                            return (
                                <div className="bg-surface-800/50 backdrop-blur rounded-2xl p-6 max-w-xs mx-auto border border-white/5">
                                    <span className="text-3xl mb-2 block">{card.emoji}</span>
                                    <p className="text-surface-300 text-sm">
                                        {language === 'ar' ? card.text_ar : card.text_en}
                                    </p>
                                </div>
                            );
                        })()}

                        <button
                            onClick={handleCancelWhisper}
                            className="mt-8 text-surface-500 hover:text-red-400 text-sm flex items-center gap-2 mx-auto"
                        >
                            <X className="w-4 h-4" />
                            {language === 'ar' ? 'إلغاء الهمسة' : 'Cancel whisper'}
                        </button>
                    </motion.div>
                )}

                {/* STATE: Response received */}
                {activeWhisper && iAmSender && activeWhisper.status !== 'pending' && (
                    <motion.div
                        key="response"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-6 pt-20 pb-32 text-center"
                    >
                        {activeWhisper.status === 'accepted' ? (
                            <>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: 3, duration: 0.5 }}
                                    className="text-6xl mb-4"
                                >
                                    💕
                                </motion.div>
                                <h2 className="text-2xl font-bold mb-2 text-pink-300">
                                    {language === 'ar' ? 'شريكك بانتظارك!' : 'Your partner is waiting!'}
                                </h2>
                                <p className="text-surface-300">
                                    {language === 'ar' ? 'الرد: بانتظارك 💕' : 'Response: Waiting for you 💕'}
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl mb-4">
                                    {activeWhisper.status === 'later' ? '⏰' : '🌸'}
                                </div>
                                <h2 className="text-xl font-bold mb-2">
                                    {activeWhisper.status === 'later'
                                        ? (language === 'ar' ? 'لاحقاً' : 'Later')
                                        : (language === 'ar' ? 'مو الحين' : 'Not now')
                                    }
                                </h2>
                                <p className="text-surface-400">
                                    {language === 'ar' ? 'لا بأس، حاول وقت ثاني' : "That's okay, try another time"}
                                </p>
                            </>
                        )}

                        <button
                            onClick={() => {
                                supabase.from('whispers').delete().eq('id', activeWhisper.id);
                                setActiveWhisper(null);
                                setSelectedCard(null);
                            }}
                            className="mt-8 px-6 py-3 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm"
                        >
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </button>
                    </motion.div>
                )}

                {/* STATE: Send new whisper */}
                {!activeWhisper && (
                    <motion.div
                        key="send"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-4 pt-8 pb-32"
                    >
                        <div className="text-center mb-8">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                            <h2 className="text-lg font-bold">
                                {language === 'ar' ? 'اختر همستك' : 'Choose your whisper'}
                            </h2>
                            <p className="text-sm text-surface-400">
                                {language === 'ar' ? 'رسالة رومانسية لشريكك' : 'A romantic message for your partner'}
                            </p>
                        </div>

                        {/* Card Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {whisperCards.map((card) => (
                                <motion.button
                                    key={card.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        handleCardSelect(card);
                                        playSound('pop');
                                    }}
                                    className={`relative p-4 rounded-2xl border transition-all ${selectedCard?.id === card.id
                                        ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                                        : 'bg-surface-800/50 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <span className="text-3xl mb-2 block">{card.emoji}</span>
                                    <p className="text-xs text-surface-300 leading-relaxed">
                                        {language === 'ar' ? card.text_ar : card.text_en}
                                    </p>
                                    {selectedCard?.id === card.id && (
                                        <motion.div
                                            layoutId="selected"
                                            className="absolute inset-0 border-2 border-purple-500 rounded-2xl"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Time Selection */}
                        {selectedCard && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <p className="text-sm text-surface-400 mb-3 text-center">
                                    {language === 'ar' ? 'متى؟' : 'When?'}
                                </p>
                                <div className="flex gap-2 justify-center flex-wrap">
                                    {timeOptions.map((time) => (
                                        <button
                                            key={time.id}
                                            onClick={() => setSelectedTime(time.id)}
                                            className={`px-4 py-2 rounded-full text-sm transition-all ${selectedTime === time.id
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                                                }`}
                                        >
                                            {language === 'ar' ? time.text_ar : time.text_en}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Send Button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendWhisper}
                            disabled={!selectedCard || isSending}
                            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${selectedCard
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-surface-800 text-surface-500'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                            {isSending
                                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                                : (language === 'ar' ? 'إرسال الهمسة' : 'Send Whisper')
                            }
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Session Mode Modal */}
            <SessionModeModal
                isOpen={showModeModal}
                onSelectMode={(mode) => {
                    initSession(mode);
                    setShowModeModal(false);
                }}
                onClose={() => setShowModeModal(false)}
            />
        </main>
    );
}
