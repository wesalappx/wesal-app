'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, Loader2, Link2, Check, Sparkles, Crown } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';
import { useTierLimits } from '@/hooks/useTierLimits';

const whisperMessages = [
    { id: 'hint', emoji: '😏', ar: 'احم احم...', en: 'Ahem ahem...' },
    { id: 'sweet', emoji: '💝', ar: 'عندي لك شي حلو', en: 'Something sweet for you' },
    { id: 'cold', emoji: '❄️', ar: 'الجو بارد بدونك', en: 'Cold without you' },
    { id: 'night', emoji: '🌟', ar: 'تعال نسهر سوا', en: 'Stay up together' },
    { id: 'hug', emoji: '🤗', ar: 'تعال ضمني', en: 'Hold me' }
];

export default function WhisperPage() {
    const supabase = createClient();
    const { user, isLoading: authLoading } = useAuth();
    const { getStatus } = usePairing();
    const { language, theme } = useSettingsStore();
    const { playSound } = useSound();
    const isRTL = language === 'ar';

    const [isPaired, setIsPaired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // Tier limits
    const { canUse, trackUsage, isPremium } = useTierLimits();
    const [whisperUsage, setWhisperUsage] = useState<{ remaining: number; limit: number } | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    useEffect(() => {
        async function load() {
            if (authLoading) return;
            if (!user) { setIsLoading(false); return; }
            try {
                const status = await getStatus();
                if (status.isPaired && status.coupleId) {
                    setIsPaired(true);
                    setCoupleId(status.coupleId);
                    if (status.partner) {
                        setPartnerId(status.partner.id);
                        setPartnerName(status.partner.display_name || 'حبيبي');
                    }
                }
            } catch (e) { console.error(e); }
            setIsLoading(false);
        }
        load();
    }, [user, authLoading]);

    // Fetch whisper usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            const usage = await canUse('whisper');
            if (usage.limit > 0) {
                setWhisperUsage({ remaining: usage.remaining, limit: usage.limit });
            }
        };
        fetchUsage();
    }, [canUse]);

    const handleSend = async () => {
        if (!selectedId || !coupleId || !user?.id) return;

        // Check whisper limit
        const usage = await canUse('whisper');
        if (!usage.canUse && usage.limit > 0) {
            setShowUpgradePrompt(true);
            return;
        }

        setSending(true);
        playSound('whoosh');

        try {
            const msg = whisperMessages.find(m => m.id === selectedId);
            const text = isRTL ? msg?.ar : msg?.en;

            const channel = supabase.channel(`whisper-${coupleId}`);
            await channel.subscribe();
            await channel.send({
                type: 'broadcast',
                event: 'whisper',
                payload: {
                    type: 'whisper_request',
                    senderId: user.id,
                    senderName: user.user_metadata?.display_name || 'حبيبك',
                    message: text,
                    whisperType: selectedId,
                    timestamp: new Date().toISOString()
                }
            });

            if (partnerId) {
                await supabase.from('notifications').insert({
                    user_id: partnerId, type: 'WHISPER', title: '💕', message: text, is_read: false
                });
            }

            // Track usage after successful send
            const trackResult = await trackUsage('whisper');
            if (trackResult.remaining >= 0) {
                setWhisperUsage({ remaining: trackResult.remaining, limit: usage.limit });
            }

            setSent(true);
            playSound('romantic');
            setTimeout(() => { setSent(false); setSelectedId(null); }, 2500);
        } catch (e) { console.error(e); }
        setSending(false);
    };

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-[#12121a] to-[#1a1025]'}`}>
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-20 left-10 w-40 h-40 rounded-full blur-3xl ${theme === 'light' ? 'bg-pink-200/40' : 'bg-pink-500/10'}`} />
                <div className={`absolute bottom-40 right-10 w-60 h-60 rounded-full blur-3xl ${theme === 'light' ? 'bg-purple-200/40' : 'bg-purple-500/10'}`} />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center px-4 py-4">
                <Link href="/dashboard" className={`p-2 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-white/50 hover:text-white'}`}>
                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Link>
                <h1 className={`flex-1 text-center text-lg font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'همسة' : 'Whisper'}</h1>
                {/* Usage Counter */}
                {whisperUsage && whisperUsage.limit > 0 && (
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${whisperUsage.remaining <= 1
                        ? 'bg-orange-500/20 text-orange-400'
                        : theme === 'light' ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-white/60'
                        }`}>
                        {whisperUsage.remaining}/{whisperUsage.limit}
                    </div>
                )}
                {!whisperUsage && <div className="w-9" />}
            </header>

            {/* Upgrade Prompt Modal */}
            <AnimatePresence>
                {showUpgradePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
                        onClick={() => setShowUpgradePrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded-3xl p-6 max-w-sm w-full text-center border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-800 border-white/10'}`}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {isRTL ? 'انتهت همسات الأسبوع' : 'Weekly Whispers Used'}
                            </h3>
                            <p className={`mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-white/60'}`}>
                                {isRTL
                                    ? 'اشترك في Premium للهمسات غير المحدودة'
                                    : 'Upgrade to Premium for unlimited whispers'}
                            </p>
                            <Link
                                href="/settings/upgrade"
                                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold mb-3"
                            >
                                {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
                            </Link>
                            <button
                                onClick={() => setShowUpgradePrompt(false)}
                                className={`text-sm ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'}`}
                            >
                                {isRTL ? 'لاحقاً' : 'Maybe Later'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <main className="relative z-10 px-5 py-4 max-w-md mx-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                    </div>
                ) : !isPaired ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                        <div className="text-5xl mb-4">💔</div>
                        <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'اربط مع شريكك' : 'Pair first'}</h2>
                        <p className={`text-sm mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>{isRTL ? 'لازم تربط حسابك' : 'Connect your accounts'}</p>
                        <Link href="/pairing" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 rounded-xl text-white font-medium">
                            <Link2 className="w-4 h-4" />{isRTL ? 'اربط' : 'Pair'}
                        </Link>
                    </motion.div>
                ) : sent ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-7xl mb-4"
                        >💕</motion.div>
                        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'وصلت!' : 'Sent!'}</h2>
                        <p className={`mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>{isRTL ? `${partnerName} راح يشوفها` : `${partnerName} will see it`}</p>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {/* Title */}
                        <div className="text-center py-4">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-4xl mb-2"
                            >💌</motion.div>
                            <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'اختر همستك' : 'Pick your whisper'}</h2>
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-white/30'}`}>{isRTL ? `إلى ${partnerName}` : `To ${partnerName}`}</p>
                        </div>

                        {/* Message Cards */}
                        <div className="grid grid-cols-1 gap-2.5">
                            {whisperMessages.map((msg, i) => {
                                const isSelected = selectedId === msg.id;
                                return (
                                    <motion.button
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        onClick={() => { playSound('click'); setSelectedId(msg.id); }}
                                        className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${isSelected
                                            ? 'bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-pink-500/50'
                                            : theme === 'light'
                                                ? 'bg-white border-slate-200 shadow-sm hover:border-pink-200 hover:shadow-md'
                                                : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                                            }`}
                                    >
                                        <span className={`text-2xl transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                                            {msg.emoji}
                                        </span>
                                        <span className={`flex-1 text-base ${isRTL ? 'text-right' : 'text-left'} ${isSelected ? (theme === 'light' ? 'text-pink-600 font-medium' : 'text-white') : (theme === 'light' ? 'text-slate-700' : 'text-white/60')}`}>
                                            {isRTL ? msg.ar : msg.en}
                                        </span>
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center"
                                                >
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Send Button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            onClick={handleSend}
                            disabled={!selectedId || sending}
                            className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 ${selectedId
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                                : theme === 'light' ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-white/25'
                                }`}
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    💕
                                    {isRTL ? 'أرسل الهمسة' : 'Send Whisper'}
                                </>
                            )}
                        </motion.button>

                        {/* Footer */}
                        <p className={`text-center text-xs pt-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/15'}`}>
                            {isRTL ? '🔒 خاص بينكم' : '🔒 Private'}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
