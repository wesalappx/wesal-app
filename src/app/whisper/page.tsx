'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Heart,
    Send,
    Phone,
    Sparkles,
    MessageCircle,
    Check,
    X,
    Loader2,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { useWhisper } from '@/hooks/useWhisper';
import { useSound } from '@/hooks/useSound';

// Whisper message options
const whisperOptions = [
    {
        id: 'call',
        icon: Phone,
        color: 'from-rose-500 to-pink-500',
        bgColor: 'bg-rose-500/20',
        labelAr: 'أحبك وأفكر فيك',
        labelEn: 'I love you, thinking of you'
    },
    {
        id: 'miss',
        icon: Heart,
        color: 'from-purple-500 to-indigo-500',
        bgColor: 'bg-purple-500/20',
        labelAr: 'أشتقت لك كثير',
        labelEn: 'I miss you so much'
    },
    {
        id: 'thinking',
        icon: Sparkles,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/20',
        labelAr: 'تعال نتكلم شوي',
        labelEn: "Let's talk for a bit"
    },
    {
        id: 'custom',
        icon: MessageCircle,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/20',
        labelAr: 'رسالة خاصة...',
        labelEn: 'Custom message...'
    }
];

export default function WhisperPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { getStatus } = usePairing();
    const { language } = useSettingsStore();
    const { playSound } = useSound();
    const isRTL = language === 'ar';

    const {
        status,
        outgoingWhisper,
        partnerName,
        isConnected,
        isWaiting,
        sendWhisper,
        cancelWhisper,
        resetWhisper
    } = useWhisper();

    const [isPaired, setIsPaired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [partnerDisplayName, setPartnerDisplayName] = useState('');

    // Load pairing
    useEffect(() => {
        async function loadData() {
            // Wait for auth to finish loading
            if (authLoading) return;

            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const pairingStatus = await getStatus();

                // Check if paired - coupleId is the most reliable indicator
                if (pairingStatus.isPaired && pairingStatus.coupleId) {
                    setIsPaired(true);
                    if (pairingStatus.partner) {
                        setPartnerDisplayName(
                            pairingStatus.partner.display_name ||
                            pairingStatus.partner.username ||
                            (isRTL ? 'الشريك' : 'Partner')
                        );
                    }
                }
            } catch (error) {
                console.error('Error loading pairing status:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user, authLoading, isRTL]);

    const handleOptionSelect = (optionId: string) => {
        playSound('click');
        setSelectedOption(optionId);
        if (optionId === 'custom') {
            setShowCustomInput(true);
        } else {
            setShowCustomInput(false);
            setCustomMessage('');
        }
    };

    const handleSendWhisper = async () => {
        if (!selectedOption) return;

        playSound('whoosh');

        const option = whisperOptions.find(o => o.id === selectedOption);
        const message = selectedOption === 'custom'
            ? customMessage
            : (isRTL ? option?.labelAr : option?.labelEn) || '';

        await sendWhisper(message, selectedOption as 'call' | 'thinking' | 'miss' | 'custom');
    };

    const handleCancel = () => {
        playSound('click');
        cancelWhisper();
        setSelectedOption(null);
        setCustomMessage('');
        setShowCustomInput(false);
    };

    const handleReset = () => {
        playSound('click');
        resetWhisper();
        setSelectedOption(null);
        setCustomMessage('');
        setShowCustomInput(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        {isRTL ? <ArrowRight className="w-6 h-6 text-white" /> : <ArrowLeft className="w-6 h-6 text-white" />}
                    </Link>
                    <h1 className="text-xl font-bold text-white">
                        {isRTL ? 'همسة' : 'Whisper'}
                    </h1>
                    <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-2`}>
                        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-surface-500'}`} />
                        <span className="text-sm text-surface-400">
                            {status === 'connected' ? (isRTL ? 'متصل' : 'Connected') : ''}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8 pb-32">
                {isLoading ? (
                    // Loading State
                    <div className="text-center py-16">
                        <div className="w-12 h-12 mx-auto mb-4 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-surface-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                    </div>
                ) : !isPaired ? (
                    // Not Paired State
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
                            {isRTL ? 'اربط حسابك مع شريكك لتتمكن من الهمس' : 'Pair with your partner to start whispering'}
                        </p>
                        <Link
                            href="/pairing"
                            className="inline-block px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                        >
                            {isRTL ? 'ربط الشريك' : 'Pair Now'}
                        </Link>
                    </motion.div>
                ) : isWaiting ? (
                    // Waiting for Response State
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        {/* Animated calling circles */}
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 rounded-full bg-primary-500/30"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.05, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                className="absolute inset-0 rounded-full bg-primary-500/20"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                    <Phone className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? `يتم الاتصال بـ ${partnerDisplayName}...` : `Calling ${partnerDisplayName}...`}
                        </h2>
                        <p className="text-surface-400 mb-8">
                            {isRTL ? 'في انتظار الرد' : 'Waiting for response'}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCancel}
                            className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-medium transition-colors"
                        >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </motion.button>
                    </motion.div>
                ) : isConnected ? (
                    // Connected State
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        >
                            <Check className="w-12 h-12 text-emerald-400" />
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'تم التواصل! 💕' : 'Connected! 💕'}
                        </h2>
                        <p className="text-surface-400 mb-8">
                            {isRTL ? `${partnerDisplayName} قبل دعوتك` : `${partnerDisplayName} accepted your call`}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReset}
                            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                        >
                            {isRTL ? 'همسة جديدة' : 'New Whisper'}
                        </motion.button>
                    </motion.div>
                ) : status === 'declined' ? (
                    // Declined State
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-800 flex items-center justify-center">
                            <X className="w-10 h-10 text-surface-500" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">
                            {isRTL ? 'ليس الآن' : 'Not Now'}
                        </h2>
                        <p className="text-surface-400 mb-8">
                            {isRTL ? 'شريكك مشغول حالياً، حاول لاحقاً' : 'Your partner is busy, try again later'}
                        </p>
                    </motion.div>
                ) : (
                    // Default - Select Whisper Type
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Partner Info */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white">
                                {partnerDisplayName.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-white">
                                {isRTL ? `همس لـ ${partnerDisplayName}` : `Whisper to ${partnerDisplayName}`}
                            </h2>
                            <p className="text-surface-400 text-sm mt-1">
                                {isRTL ? 'اختر رسالتك أو اكتب همستك الخاصة' : 'Choose a message or write your own'}
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
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleOptionSelect(option.id)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                            ? `${option.bgColor} border-current bg-gradient-to-r ${option.color} bg-clip-text text-transparent`
                                            : 'bg-surface-800/50 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${option.bgColor}`}>
                                            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-surface-300'}`} />
                                        </div>
                                        <span className={`text-lg font-medium flex-1 ${isRTL ? 'text-right' : 'text-left'} ${isSelected ? '' : 'text-white'}`}>
                                            {isRTL ? option.labelAr : option.labelEn}
                                        </span>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-6 h-6 rounded-full bg-white flex items-center justify-center"
                                            >
                                                <Check className="w-4 h-4 text-primary-500" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Custom Message Input */}
                        <AnimatePresence>
                            {showCustomInput && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder={isRTL ? 'اكتب همستك هنا...' : 'Write your whisper here...'}
                                        className="w-full p-4 rounded-xl bg-surface-800 border border-white/10 text-white placeholder-surface-500 resize-none focus:border-primary-500 outline-none"
                                        rows={3}
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Send Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSendWhisper}
                            disabled={!selectedOption || (selectedOption === 'custom' && !customMessage.trim()) || status === 'sending'}
                            className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary-500/25"
                        >
                            {status === 'sending' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    {isRTL ? 'أرسل الهمسة' : 'Send Whisper'}
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
