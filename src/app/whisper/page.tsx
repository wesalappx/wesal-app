'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, Loader2, LinkIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';

// Whisper messages
const whisperMessages = [
    { id: 'hint', emoji: '😏', ar: 'احم احم...', en: 'Ahem ahem...' },
    { id: 'sweet', emoji: '💝', ar: 'عندي لك شي حلو', en: 'I have something sweet for you' },
    { id: 'cold', emoji: '❄️', ar: 'الجو بارد بدونك', en: 'It\'s cold without you' },
    { id: 'night', emoji: '🌟', ar: 'تعال نسهر سوا', en: 'Let\'s stay up together' },
    { id: 'hug', emoji: '🤗', ar: 'تعال ضمني', en: 'Come hold me' }
];

export default function WhisperPage() {
    const supabase = createClient();
    const { user, isLoading: authLoading } = useAuth();
    const { getStatus } = usePairing();
    const { language } = useSettingsStore();
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

    const handleSend = async () => {
        if (!selectedId || !coupleId || !user?.id) return;
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
                    user_id: partnerId,
                    type: 'WHISPER',
                    title: '💕',
                    message: text,
                    is_read: false
                });
            }

            setSent(true);
            playSound('romantic');
            setTimeout(() => { setSent(false); setSelectedId(null); }, 2500);
        } catch (e) { console.error(e); }
        setSending(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a] flex flex-col">

            {/* Header */}
            <header className="px-4 py-4 flex items-center">
                <Link href="/dashboard" className="p-2 -ml-2 text-white/60 hover:text-white">
                    {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                </Link>
                <h1 className="flex-1 text-center text-lg font-semibold text-white">
                    {isRTL ? 'همسة' : 'Whisper'}
                </h1>
                <div className="w-10" />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">

                {isLoading ? (
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                        <p className="text-white/50 text-sm">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : !isPaired ? (
                    <div className="text-center max-w-xs">
                        <div className="text-5xl mb-6">💔</div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isRTL ? 'اربط مع شريكك' : 'Pair with your partner'}
                        </h2>
                        <p className="text-white/50 text-sm mb-6">
                            {isRTL ? 'لازم تربط حسابك عشان تقدر تهمس' : 'You need to pair your account first'}
                        </p>
                        <Link
                            href="/pairing"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors"
                        >
                            <LinkIcon className="w-4 h-4" />
                            {isRTL ? 'ربط الشريك' : 'Pair Now'}
                        </Link>
                    </div>
                ) : sent ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ duration: 0.5 }}
                            className="text-7xl mb-6"
                        >
                            💕
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'وصلت!' : 'Sent!'}
                        </h2>
                        <p className="text-purple-300/70">
                            {isRTL ? `${partnerName} راح يشوفها` : `${partnerName} will see it`}
                        </p>
                    </motion.div>
                ) : (
                    <div className="w-full max-w-sm space-y-6">
                        {/* Title */}
                        <div className="text-center mb-8">
                            <div className="text-4xl mb-3">💌</div>
                            <h2 className="text-xl font-bold text-white">
                                {isRTL ? 'اختر همستك' : 'Choose your whisper'}
                            </h2>
                            <p className="text-white/40 text-sm mt-1">
                                {isRTL ? `إلى ${partnerName}` : `To ${partnerName}`}
                            </p>
                        </div>

                        {/* Message Options */}
                        <div className="space-y-2">
                            {whisperMessages.map((msg) => (
                                <button
                                    key={msg.id}
                                    onClick={() => { playSound('click'); setSelectedId(msg.id); }}
                                    className={`w-full px-4 py-4 rounded-xl text-right flex items-center gap-3 transition-all ${selectedId === msg.id
                                            ? 'bg-purple-600/30 border-2 border-purple-500'
                                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-2xl">{msg.emoji}</span>
                                    <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'} ${selectedId === msg.id ? 'text-white' : 'text-white/70'
                                        }`}>
                                        {isRTL ? msg.ar : msg.en}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!selectedId || sending}
                            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${selectedId
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    {isRTL ? 'أرسل' : 'Send'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-white/20 text-xs">
                {isRTL ? 'خاص بينكم 💕' : 'Private between you 💕'}
            </footer>
        </div>
    );
}
