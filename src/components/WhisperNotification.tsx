'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, Clock, X, Check, MessageCircle, Sparkles } from 'lucide-react';
import { useWhisper, WhisperRequest } from '@/hooks/useWhisper';
import { useSound } from '@/hooks/useSound';
import { useEffect } from 'react';

const whisperTypeConfig = {
    call: { icon: Phone, color: 'from-rose-500 to-pink-500', label: 'يفكر فيك', labelEn: 'Thinking of you' },
    thinking: { icon: Heart, color: 'from-purple-500 to-indigo-500', label: 'يشتاق لك', labelEn: 'Missing you' },
    miss: { icon: Sparkles, color: 'from-amber-500 to-orange-500', label: 'يريدك', labelEn: 'Wants you' },
    custom: { icon: MessageCircle, color: 'from-blue-500 to-cyan-500', label: 'رسالة', labelEn: 'Message' }
};

interface WhisperNotificationProps {
    language?: 'ar' | 'en';
}

export default function WhisperNotification({ language = 'ar' }: WhisperNotificationProps) {
    const { incomingWhisper, respondToWhisper, dismissWhisper, hasIncoming } = useWhisper();
    const { playSound } = useSound();
    const isRTL = language === 'ar';

    // Play sound when receiving whisper
    useEffect(() => {
        if (hasIncoming) {
            playSound('notification');
        }
    }, [hasIncoming, playSound]);

    if (!hasIncoming || !incomingWhisper) return null;

    const config = whisperTypeConfig[incomingWhisper.type] || whisperTypeConfig.call;
    const Icon = config.icon;

    const handleAccept = () => {
        playSound('success');
        respondToWhisper(true);
    };

    const handleDecline = () => {
        playSound('click');
        respondToWhisper(false);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                onClick={dismissWhisper}
            >
                <motion.div
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className="w-full max-w-sm bg-surface-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                >
                    {/* Animated Gradient Background */}
                    <div className={`relative h-48 bg-gradient-to-br ${config.color} overflow-hidden`}>
                        {/* Pulsing circles */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute w-32 h-32 rounded-full bg-white/20"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.05, 0.2] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                className="absolute w-48 h-48 rounded-full bg-white/10"
                            />
                        </div>

                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                            >
                                <Icon className="w-10 h-10 text-white" />
                            </motion.div>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={dismissWhisper}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
                        >
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center">
                        {/* Partner Name */}
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {incomingWhisper.senderName}
                        </h2>

                        {/* Type Label */}
                        <p className="text-surface-400 mb-4">
                            {isRTL ? config.label : config.labelEn}
                        </p>

                        {/* Message */}
                        {incomingWhisper.message && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                                <p className="text-white text-lg leading-relaxed">
                                    "{incomingWhisper.message}"
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {/* Decline */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDecline}
                                className="flex-1 py-4 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-surface-300 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Clock className="w-5 h-5" />
                                {isRTL ? 'لاحقاً' : 'Later'}
                            </motion.button>

                            {/* Accept */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAccept}
                                className={`flex-1 py-4 rounded-xl bg-gradient-to-r ${config.color} text-white font-bold flex items-center justify-center gap-2 shadow-lg`}
                            >
                                <Check className="w-5 h-5" />
                                {isRTL ? 'تواصل' : 'Connect'}
                            </motion.button>
                        </div>

                        {/* Timer indicator */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-surface-500 text-sm">
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-2 h-2 rounded-full bg-green-500"
                            />
                            {isRTL ? 'ينتظر ردك...' : 'Waiting for your response...'}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
