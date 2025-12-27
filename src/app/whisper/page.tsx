'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    Send,
    Moon,
    Sparkles,
    Flame,
    Coffee,
    Check,
    Loader2,
    WifiOff,
    Star
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';

// Romantic whisper options
const whisperOptions = [
    {
        id: 'hint',
        icon: '😏',
        color: 'from-rose-500 to-pink-600',
        labelAr: 'احم احم...',
        labelEn: 'Ahem ahem...',
    },
    {
        id: 'sweet',
        icon: '💝',
        color: 'from-pink-500 to-purple-600',
        labelAr: 'عندي لك شي حلو',
        labelEn: 'I have something sweet for you',
    },
    {
        id: 'cold',
        icon: '❄️',
        color: 'from-blue-400 to-indigo-600',
        labelAr: 'الجو بارد بدونك',
        labelEn: 'It\'s cold without you',
    },
    {
        id: 'night',
        icon: '🌟',
        color: 'from-purple-500 to-indigo-600',
        labelAr: 'تعال نسهر سوا',
        labelEn: 'Let\'s stay up together',
    },
    {
        id: 'hug',
        icon: '🤗',
        color: 'from-amber-500 to-rose-500',
        labelAr: 'تعال ضمني',
        labelEn: 'Come hold me',
    }
];

// Floating Hearts Component
function FloatingHearts() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
                        y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
                        opacity: 0,
                        scale: 0.5 + Math.random() * 0.5
                    }}
                    animate={{
                        y: -100,
                        opacity: [0, 0.6, 0.6, 0],
                        rotate: Math.random() * 360
                    }}
                    transition={{
                        duration: 8 + Math.random() * 4,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: 'linear'
                    }}
                    className="absolute text-2xl md:text-3xl"
                >
                    {['💕', '💗', '💖', '✨', '💫'][i % 5]}
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

    // States
    const [isPaired, setIsPaired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState('');

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Load pairing data
    useEffect(() => {
        async function loadData() {
            if (authLoading) return;

            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const status = await getStatus();

                if (status.isPaired && status.coupleId) {
                    setIsPaired(true);
                    setCoupleId(status.coupleId);
                    if (status.partner) {
                        setPartnerId(status.partner.id);
                        setPartnerName(status.partner.display_name || (isRTL ? 'حبيبي' : 'My Love'));
                    }
                }
            } catch (error) {
                console.error('Error loading pairing:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, authLoading, isRTL]);

    const handleSendWhisper = async () => {
        if (!selectedOption || !coupleId || !user?.id) return;

        setSendingStatus('sending');
        playSound('whoosh');

        try {
            const option = whisperOptions.find(o => o.id === selectedOption);
            const message = isRTL ? option?.labelAr : option?.labelEn;

            const channel = supabase.channel(`whisper-${coupleId}`);
            await channel.subscribe();

            await channel.send({
                type: 'broadcast',
                event: 'whisper',
                payload: {
                    type: 'whisper_request',
                    senderId: user.id,
                    senderName: user.user_metadata?.display_name || (isRTL ? 'حبيبك' : 'Your Love'),
                    message: message,
                    whisperType: selectedOption,
                    timestamp: new Date().toISOString()
                }
            });

            // Save to notifications
            if (partnerId) {
                await supabase.from('notifications').insert({
                    user_id: partnerId,
                    type: 'WHISPER',
                    title: isRTL ? '💕 همسة' : '💕 Whisper',
                    message: message,
                    data: { whisperId: selectedOption, senderId: user.id },
                    is_read: false
                });
            }

            setSendingStatus('sent');
            playSound('romantic');

            setTimeout(() => {
                setSendingStatus('idle');
                setSelectedOption(null);
            }, 3000);

        } catch (error) {
            console.error('Error sending whisper:', error);
            setSendingStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-950 via-purple-950 to-indigo-950 relative overflow-hidden">
            {/* Floating Hearts Background */}
            <FloatingHearts />

            {/* Ambient Glow Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        {isRTL ? <ArrowRight className="w-6 h-6 text-white" /> : <ArrowLeft className="w-6 h-6 text-white" />}
                    </Link>
                    <div className="flex-1 text-center">
                        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                💕
                            </motion.span>
                            {isRTL ? 'همسة' : 'Whisper'}
                        </h1>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="relative z-10 max-w-lg mx-auto px-4 py-8 pb-32">
                {isLoading ? (
                    <div className="text-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-pink-500/30 border-t-pink-500"
                        />
                        <p className="text-pink-300/60">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : !isPaired ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <WifiOff className="w-12 h-12 text-pink-300/50" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {isRTL ? 'اربط مع شريكك أولاً' : 'Pair with your partner first'}
                        </h2>
                        <p className="text-pink-200/60 mb-8">
                            {isRTL ? 'الهمسة تحتاج شريك 💕' : 'Whisper needs a partner 💕'}
                        </p>
                        <Link
                            href="/pairing"
                            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl text-white font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-shadow"
                        >
                            {isRTL ? 'ربط الشريك' : 'Pair Now'}
                        </Link>
                    </motion.div>
                ) : sendingStatus === 'sent' ? (
                    // Success State - Beautiful Animation
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        {/* Flying Heart Animation */}
                        <div className="relative h-48 mb-8">
                            <motion.div
                                initial={{ scale: 0, y: 0 }}
                                animate={{
                                    scale: [0, 1.5, 1],
                                    y: [0, -20, 0]
                                }}
                                transition={{ duration: 0.8, ease: 'backOut' }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <span className="text-8xl">💕</span>
                            </motion.div>

                            {/* Sparkles */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0],
                                        x: Math.cos(i * 45 * Math.PI / 180) * 80,
                                        y: Math.sin(i * 45 * Math.PI / 180) * 80
                                    }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    className="absolute top-1/2 left-1/2 text-2xl"
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-3xl font-bold text-white mb-3"
                        >
                            {isRTL ? 'وصلت همستك!' : 'Whisper Sent!'}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-pink-200/70 text-lg"
                        >
                            {isRTL ? `${partnerName} راح يشوفها الحين` : `${partnerName} will see it now`}
                        </motion.p>
                    </motion.div>
                ) : (
                    // Main Selection UI
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Romantic Header */}
                        <div className="text-center pt-4 pb-2">
                            <motion.div
                                animate={{
                                    y: [0, -8, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="text-6xl mb-4"
                            >
                                💌
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {isRTL ? `أرسل همسة لـ ${partnerName}` : `Send a whisper to ${partnerName}`}
                            </h2>
                            <p className="text-pink-200/60">
                                {isRTL ? 'اختر رسالتك الرومانسية' : 'Choose your romantic message'}
                            </p>
                        </div>

                        {/* Whisper Options - Card Style */}
                        <div className="space-y-3">
                            {whisperOptions.map((option, index) => {
                                const isSelected = selectedOption === option.id;

                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => {
                                            playSound('pop');
                                            setSelectedOption(option.id);
                                        }}
                                        className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 ${isSelected
                                                ? 'border-pink-500 bg-pink-500/20 scale-[1.02]'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Emoji Icon */}
                                            <motion.span
                                                animate={isSelected ? {
                                                    scale: [1, 1.3, 1],
                                                    rotate: [0, 10, -10, 0]
                                                } : {}}
                                                transition={{ repeat: isSelected ? Infinity : 0, duration: 1 }}
                                                className="text-4xl"
                                            >
                                                {option.icon}
                                            </motion.span>

                                            {/* Label */}
                                            <span className={`flex-1 text-lg font-medium ${isRTL ? 'text-right' : 'text-left'} ${isSelected ? 'text-white' : 'text-white/80'
                                                }`}>
                                                {isRTL ? option.labelAr : option.labelEn}
                                            </span>

                                            {/* Selection Indicator */}
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center"
                                                >
                                                    <Check className="w-5 h-5 text-white" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Send Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendWhisper}
                            disabled={!selectedOption || sendingStatus === 'sending'}
                            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${selectedOption
                                    ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                                }`}
                        >
                            {sendingStatus === 'sending' ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
                                    {isRTL ? 'أرسل الهمسة 💕' : 'Send Whisper 💕'}
                                </>
                            )}
                        </motion.button>

                        {/* Subtle Footer */}
                        <p className="text-center text-pink-200/40 text-sm">
                            {isRTL ? '✨ خاصة وسرية بينكم ✨' : '✨ Private and secret between you two ✨'}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
