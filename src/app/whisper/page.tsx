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
    X,
    Loader2,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSound } from '@/hooks/useSound';

// Intimate whisper options - polite Saudi style
const whisperOptions = [
    {
        id: 'hint',
        icon: Flame,
        color: 'from-rose-500 to-pink-500',
        bgColor: 'bg-rose-500/20',
        labelAr: 'احم احم... 😏',
        labelEn: 'Ahem ahem... 😏',
        descAr: 'تلميح لطيف',
        descEn: 'A playful hint'
    },
    {
        id: 'sweet',
        icon: Heart,
        color: 'from-pink-500 to-purple-500',
        bgColor: 'bg-pink-500/20',
        labelAr: 'عندي لك شي حلو 💝',
        labelEn: 'I have something sweet for you 💝',
        descAr: 'مفاجأة حلوة',
        descEn: 'Sweet surprise'
    },
    {
        id: 'cold',
        icon: Moon,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/20',
        labelAr: 'الجو بارد بدونك ❄️',
        labelEn: 'It\'s cold without you ❄️',
        descAr: 'أحتاج دفاك',
        descEn: 'Need your warmth'
    },
    {
        id: 'night',
        icon: Sparkles,
        color: 'from-purple-500 to-indigo-500',
        bgColor: 'bg-purple-500/20',
        labelAr: 'تعال نسهر سوا 🌟',
        labelEn: 'Let\'s stay up together 🌟',
        descAr: 'ليلة حلوة',
        descEn: 'Sweet night together'
    },
    {
        id: 'hug',
        icon: Coffee,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/20',
        labelAr: 'تعال ضمني 🤗',
        labelEn: 'Come hold me 🤗',
        descAr: 'أبي حضنك',
        descEn: 'I want your embrace'
    }
];

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
    const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [lastSentTime, setLastSentTime] = useState<Date | null>(null);

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
                        setPartnerName(status.partner.display_name || (isRTL ? 'الشريك' : 'Partner'));
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

            // Create channel and send broadcast
            const channel = supabase.channel(`whisper-${coupleId}`);

            await channel.subscribe();

            await channel.send({
                type: 'broadcast',
                event: 'whisper',
                payload: {
                    type: 'whisper_request',
                    senderId: user.id,
                    senderName: user.user_metadata?.display_name || (isRTL ? 'شريكك' : 'Your Partner'),
                    message: message,
                    whisperType: selectedOption,
                    timestamp: new Date().toISOString()
                }
            });

            // Also save to database for persistence
            await supabase.from('notifications').insert({
                user_id: partnerId,
                type: 'WHISPER',
                title: isRTL ? 'همسة من شريكك 💕' : 'Whisper from your partner 💕',
                message: message,
                data: { whisperId: selectedOption, senderId: user.id },
                is_read: false
            });

            setSendingStatus('sent');
            setLastSentTime(new Date());
            playSound('success');

            // Reset after 3 seconds
            setTimeout(() => {
                setSendingStatus('idle');
                setSelectedOption(null);
            }, 3000);

        } catch (error) {
            console.error('Error sending whisper:', error);
            setSendingStatus('error');
            setTimeout(() => setSendingStatus('idle'), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-purple-950/20 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        {isRTL ? <ArrowRight className="w-6 h-6 text-white" /> : <ArrowLeft className="w-6 h-6 text-white" />}
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Moon className="w-5 h-5 text-purple-400" />
                            {isRTL ? 'همسة حميمة' : 'Intimate Whisper'}
                        </h1>
                        <p className="text-xs text-surface-400">
                            {isRTL ? 'نادي شريكك بلطف' : 'Call your partner gently'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8 pb-32">
                {isLoading ? (
                    // Loading
                    <div className="text-center py-20">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-surface-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : !isPaired ? (
                    // Not Paired
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-800 flex items-center justify-center">
                            <WifiOff className="w-10 h-10 text-surface-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isRTL ? 'لم يتم الربط بعد' : 'Not Paired Yet'}
                        </h2>
                        <p className="text-surface-400 mb-6">
                            {isRTL ? 'اربط حسابك مع شريكك لتتمكن من الهمس' : 'Pair with your partner to whisper'}
                        </p>
                        <Link
                            href="/pairing"
                            className="inline-block px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-white font-medium transition-colors"
                        >
                            {isRTL ? 'ربط الشريك' : 'Pair Now'}
                        </Link>
                    </motion.div>
                ) : sendingStatus === 'sent' ? (
                    // Sent Success
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                        >
                            <Check className="w-12 h-12 text-white" />
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'تم إرسال الهمسة! 💕' : 'Whisper Sent! 💕'}
                        </h2>
                        <p className="text-surface-400">
                            {isRTL ? `وصلت همستك لـ ${partnerName}` : `${partnerName} received your whisper`}
                        </p>
                    </motion.div>
                ) : (
                    // Main - Select Whisper
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Partner Card */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">
                                    {partnerName.charAt(0)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {isRTL ? `همس لـ ${partnerName}` : `Whisper to ${partnerName}`}
                            </h2>
                            <p className="text-surface-400 text-sm mt-1">
                                {isRTL ? 'اختر رسالتك الحميمة' : 'Choose your intimate message'}
                            </p>
                        </div>

                        {/* Whisper Options */}
                        <div className="space-y-3">
                            {whisperOptions.map((option, index) => {
                                const Icon = option.icon;
                                const isSelected = selectedOption === option.id;

                                return (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.08 }}
                                        onClick={() => {
                                            playSound('click');
                                            setSelectedOption(option.id);
                                        }}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                            ? `border-purple-500 bg-purple-500/10`
                                            : 'bg-surface-800/50 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${option.color}`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            <p className={`font-bold ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                                                {isRTL ? option.labelAr : option.labelEn}
                                            </p>
                                            <p className="text-surface-400 text-sm">
                                                {isRTL ? option.descAr : option.descEn}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
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
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-purple-500/25 mt-6"
                        >
                            {sendingStatus === 'sending' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    {isRTL ? 'أرسل الهمسة' : 'Send Whisper'}
                                </>
                            )}
                        </motion.button>

                        {/* Privacy Note */}
                        <p className="text-center text-surface-500 text-xs mt-4">
                            {isRTL ? '🔒 خاص بينكما فقط' : '🔒 Private between you two only'}
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
