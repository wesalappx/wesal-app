'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Send, Loader2, LinkIcon, Check } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';

// Whisper messages with colors
const whisperMessages = [
    { id: 'hint', emoji: '😏', ar: 'احم احم...', en: 'Ahem ahem...', color: 'from-rose-500 to-pink-600' },
    { id: 'sweet', emoji: '💝', ar: 'عندي لك شي حلو', en: 'Something sweet for you', color: 'from-pink-500 to-fuchsia-600' },
    { id: 'cold', emoji: '❄️', ar: 'الجو بارد بدونك', en: 'Cold without you', color: 'from-cyan-500 to-blue-600' },
    { id: 'night', emoji: '🌟', ar: 'تعال نسهر سوا', en: 'Stay up together', color: 'from-violet-500 to-purple-600' },
    { id: 'hug', emoji: '🤗', ar: 'تعال ضمني', en: 'Hold me', color: 'from-amber-500 to-orange-600' }
];

// Animated Background Orbs
function FloatingOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
                { size: 300, x: '10%', y: '20%', color: 'bg-pink-500/20', delay: 0 },
                { size: 200, x: '80%', y: '10%', color: 'bg-purple-500/20', delay: 2 },
                { size: 250, x: '70%', y: '60%', color: 'bg-fuchsia-500/15', delay: 4 },
                { size: 180, x: '20%', y: '70%', color: 'bg-rose-500/15', delay: 1 },
            ].map((orb, i) => (
                <motion.div
                    key={i}
                    initial={{ x: orb.x, y: orb.y, scale: 0.8 }}
                    animate={{
                        y: [`${parseInt(orb.y as string)}%`, `${parseInt(orb.y as string) - 10}%`, `${parseInt(orb.y as string)}%`],
                        scale: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        delay: orb.delay,
                        ease: 'easeInOut'
                    }}
                    style={{ width: orb.size, height: orb.size, left: orb.x, top: orb.y }}
                    className={`absolute ${orb.color} rounded-full blur-3xl`}
                />
            ))}
        </div>
    );
}

// Particle Hearts
function ParticleHearts() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: `${10 + (i * 8)}%`,
                        y: '110%',
                        opacity: 0,
                        scale: 0.3 + Math.random() * 0.5
                    }}
                    animate={{
                        y: '-10%',
                        opacity: [0, 0.7, 0.7, 0],
                        rotate: [0, 20, -20, 0]
                    }}
                    transition={{
                        duration: 10 + Math.random() * 5,
                        repeat: Infinity,
                        delay: i * 1.5,
                        ease: 'linear'
                    }}
                    className="absolute text-xl"
                >
                    {['💕', '💗', '✨', '💖', '💫'][i % 5]}
                </motion.div>
            ))}
        </div>
    );
}

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
            setTimeout(() => { setSent(false); setSelectedId(null); }, 3000);
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const selectedMessage = whisperMessages.find(m => m.id === selectedId);

    return (
        <div className="min-h-screen bg-[#0a0a12] relative overflow-hidden flex flex-col">

            {/* Animated Background */}
            <FloatingOrbs />
            <ParticleHearts />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a12]/50 to-[#0a0a12] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-4 py-4 flex items-center">
                <Link href="/dashboard" className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
                    {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                </Link>
                <div className="flex-1 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-white"
                    >
                        {isRTL ? 'همسة' : 'Whisper'}
                    </motion.h1>
                </div>
                <div className="w-10" />
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-20">

                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-pink-500/30 border-t-pink-500"
                        />
                    </motion.div>
                ) : !isPaired ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center max-w-xs"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-6xl mb-6"
                        >
                            💔
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {isRTL ? 'اربط مع شريكك' : 'Pair with partner'}
                        </h2>
                        <p className="text-white/40 mb-8">
                            {isRTL ? 'لازم تربط حسابك أول' : 'Connect your accounts first'}
                        </p>
                        <Link
                            href="/pairing"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-shadow"
                        >
                            <LinkIcon className="w-5 h-5" />
                            {isRTL ? 'اربط الحين' : 'Pair Now'}
                        </Link>
                    </motion.div>
                ) : sent ? (
                    // Beautiful Success Animation
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        {/* Explosion Effect */}
                        <div className="relative h-40 flex items-center justify-center">
                            {/* Center Heart */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                                transition={{ duration: 0.6, ease: 'backOut' }}
                                className="text-8xl relative z-10"
                            >
                                💕
                            </motion.div>

                            {/* Burst Particles */}
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                                    animate={{
                                        scale: [0, 1, 0.5],
                                        x: Math.cos((i * 30) * Math.PI / 180) * 100,
                                        y: Math.sin((i * 30) * Math.PI / 180) * 100,
                                        opacity: [1, 1, 0]
                                    }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="absolute text-2xl"
                                >
                                    {['✨', '💖', '💗', '⭐'][i % 4]}
                                </motion.div>
                            ))}

                            {/* Ring Effect */}
                            <motion.div
                                initial={{ scale: 0.5, opacity: 1 }}
                                animate={{ scale: 3, opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute w-20 h-20 rounded-full border-4 border-pink-500"
                            />
                        </div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold text-white mt-4"
                        >
                            {isRTL ? 'وصلت! 💕' : 'Sent! 💕'}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-white/50 mt-2"
                        >
                            {isRTL ? `${partnerName} راح يشوف همستك` : `${partnerName} will see your whisper`}
                        </motion.p>
                    </motion.div>
                ) : (
                    // Message Selection - Creative Cards
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md space-y-6"
                    >
                        {/* Partner Preview */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center mb-2"
                        >
                            <motion.div
                                animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="inline-block text-5xl mb-3"
                            >
                                💌
                            </motion.div>
                            <h2 className="text-xl font-bold text-white">
                                {isRTL ? `همسة لـ ${partnerName}` : `Whisper to ${partnerName}`}
                            </h2>
                        </motion.div>

                        {/* Message Cards - Creative Style */}
                        <div className="space-y-3">
                            {whisperMessages.map((msg, idx) => {
                                const isSelected = selectedId === msg.id;

                                return (
                                    <motion.button
                                        key={msg.id}
                                        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.08 }}
                                        onClick={() => { playSound('pop'); setSelectedId(msg.id); }}
                                        className={`w-full relative overflow-hidden rounded-2xl transition-all duration-300 ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                                            }`}
                                    >
                                        {/* Background Gradient - Shows when selected */}
                                        <div className={`absolute inset-0 bg-gradient-to-r ${msg.color} transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'
                                            }`} />

                                        {/* Glass Background - Default */}
                                        <div className={`absolute inset-0 bg-white/5 backdrop-blur-sm transition-opacity duration-300 ${isSelected ? 'opacity-0' : 'opacity-100'
                                            }`} />

                                        {/* Border */}
                                        <div className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-300 ${isSelected ? 'border-white/30' : 'border-white/10'
                                            }`} />

                                        {/* Content */}
                                        <div className="relative p-4 flex items-center gap-4">
                                            <motion.span
                                                animate={isSelected ? {
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 10, -10, 0]
                                                } : {}}
                                                transition={{ repeat: isSelected ? Infinity : 0, duration: 0.6 }}
                                                className="text-3xl"
                                            >
                                                {msg.emoji}
                                            </motion.span>

                                            <span className={`flex-1 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'} ${isSelected ? 'text-white' : 'text-white/70'
                                                }`}>
                                                {isRTL ? msg.ar : msg.en}
                                            </span>

                                            {/* Selection Check */}
                                            <AnimatePresence>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -90 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0, rotate: 90 }}
                                                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                                                    >
                                                        <Check className="w-5 h-5 text-white" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Send Button - Gradient with Glow */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: selectedId ? 1.02 : 1 }}
                            whileTap={{ scale: selectedId ? 0.98 : 1 }}
                            onClick={handleSend}
                            disabled={!selectedId || sending}
                            className="relative w-full overflow-hidden"
                        >
                            {/* Glow Effect */}
                            {selectedId && (
                                <div className={`absolute inset-0 bg-gradient-to-r ${selectedMessage?.color} blur-xl opacity-50`} />
                            )}

                            <div className={`relative py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${selectedId
                                    ? `bg-gradient-to-r ${selectedMessage?.color} text-white shadow-lg`
                                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                                }`}>
                                {sending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                        {isRTL ? 'أرسل الهمسة' : 'Send Whisper'}
                                    </>
                                )}
                            </div>
                        </motion.button>

                        {/* Privacy Note */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-white/20 text-xs"
                        >
                            {isRTL ? '🔒 سري بينكم' : '🔒 Private between you'}
                        </motion.p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
