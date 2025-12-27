'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Moon, Flame, Sparkles, Coffee, Clock, Check } from 'lucide-react';
import { useWhisper, WhisperRequest } from '@/hooks/useWhisper';
import { useSound } from '@/hooks/useSound';
import { useEffect } from 'react';

const whisperTypeConfig: Record<string, { icon: typeof Heart; color: string; gradient: string }> = {
    bed: { icon: Moon, color: 'text-purple-400', gradient: 'from-purple-500 to-indigo-500' },
    miss: { icon: Heart, color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
    want: { icon: Flame, color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
    cuddle: { icon: Sparkles, color: 'text-amber-400', gradient: 'from-amber-500 to-yellow-500' },
    morning: { icon: Coffee, color: 'text-teal-400', gradient: 'from-teal-500 to-cyan-500' },
    call: { icon: Heart, color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
    thinking: { icon: Heart, color: 'text-purple-400', gradient: 'from-purple-500 to-indigo-500' },
    custom: { icon: Sparkles, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' }
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
            playSound('romantic');
        }
    }, [hasIncoming, playSound]);

    if (!hasIncoming || !incomingWhisper) return null;

    const config = whisperTypeConfig[incomingWhisper.type] || whisperTypeConfig.call;
    const Icon = config.icon;

    const handleAccept = () => {
        playSound('success');
        respondToWhisper(true);
    };

    const handleLater = () => {
        playSound('click');
        respondToWhisper(false);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
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
                    {/* Animated Gradient Header */}
                    <div className={`relative h-52 bg-gradient-to-br ${config.gradient} overflow-hidden`}>
                        {/* Animated Hearts Background */}
                        <div className="absolute inset-0">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [100, -50],
                                        x: [Math.random() * 100, Math.random() * 100 - 50],
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1, 0.5]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.5,
                                        ease: 'easeOut'
                                    }}
                                    className="absolute text-white/20 text-4xl"
                                    style={{ left: `${(i + 1) * 15}%` }}
                                >
                                    💕
                                </motion.div>
                            ))}
                        </div>

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
                                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                            >
                                <Icon className="w-12 h-12 text-white" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center">
                        {/* Sender */}
                        <p className="text-surface-400 text-sm mb-1">
                            {isRTL ? 'همسة من' : 'Whisper from'}
                        </p>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {incomingWhisper.senderName} 💕
                        </h2>

                        {/* Message */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/10 mb-6">
                            <p className="text-white text-lg leading-relaxed">
                                "{incomingWhisper.message}"
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {/* Later */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLater}
                                className="flex-1 py-4 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/10 text-surface-300 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Clock className="w-5 h-5" />
                                {isRTL ? 'لاحقاً' : 'Later'}
                            </motion.button>

                            {/* Accept - Come */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAccept}
                                className={`flex-1 py-4 rounded-xl bg-gradient-to-r ${config.gradient} text-white font-bold flex items-center justify-center gap-2 shadow-lg`}
                            >
                                <Check className="w-5 h-5" />
                                {isRTL ? 'قادم/ة! 💕' : 'Coming! 💕'}
                            </motion.button>
                        </div>

                        {/* Waiting indicator */}
                        <div className="mt-4 flex items-center justify-center gap-2 text-surface-500 text-sm">
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-2 h-2 rounded-full bg-pink-500"
                            />
                            {isRTL ? 'ينتظرك بشوق...' : 'Waiting for you...'}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
