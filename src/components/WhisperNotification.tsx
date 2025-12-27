'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles } from 'lucide-react';
import { useWhisper } from '@/hooks/useWhisper';
import { useSound } from '@/hooks/useSound';
import { useEffect, useState } from 'react';

interface WhisperNotificationProps {
    language?: 'ar' | 'en';
}

export default function WhisperNotification({ language = 'ar' }: WhisperNotificationProps) {
    const { incomingWhisper, respondToWhisper, dismissWhisper, hasIncoming } = useWhisper();
    const { playSound } = useSound();
    const isRTL = language === 'ar';
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (hasIncoming) {
            playSound('romantic');
            // Auto-expand after a moment
            setTimeout(() => setIsExpanded(true), 500);
        } else {
            setIsExpanded(false);
        }
    }, [hasIncoming, playSound]);

    if (!hasIncoming || !incomingWhisper) return null;

    const handleAccept = () => {
        playSound('success');
        respondToWhisper(true);
    };

    const handleDismiss = () => {
        setIsExpanded(false);
        setTimeout(() => {
            playSound('click');
            dismissWhisper();
        }, 200);
    };

    return (
        <AnimatePresence>
            <div className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
                <motion.div
                    initial={{ width: 50, height: 50, opacity: 0, y: -30 }}
                    animate={{
                        width: isExpanded ? 320 : 180,
                        height: isExpanded ? 'auto' : 50,
                        opacity: 1,
                        y: 0
                    }}
                    exit={{ width: 50, height: 50, opacity: 0, y: -30 }}
                    transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                        mass: 0.8
                    }}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                    className="pointer-events-auto cursor-pointer overflow-hidden"
                >
                    {/* Dynamic Island Container */}
                    <div className="relative bg-black rounded-[28px] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">

                        {/* Glossy Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" style={{ height: '40%' }} />

                        {/* Inner Glow */}
                        <div className="absolute inset-0 rounded-[28px] shadow-[inset_0_0_20px_rgba(236,72,153,0.3)]" />

                        {/* Content */}
                        <div className="relative p-3">
                            {!isExpanded ? (
                                // Compact State - Pill
                                <div className="flex items-center gap-3 min-h-[26px]">
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="text-lg"
                                    >
                                        💕
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium truncate">
                                            {incomingWhisper.senderName}
                                        </p>
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="w-2 h-2 rounded-full bg-pink-500"
                                    />
                                </div>
                            ) : (
                                // Expanded State
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-4"
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ scale: [1, 1.15, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center"
                                            >
                                                <span className="text-xl">💕</span>
                                            </motion.div>
                                            {/* Ripple Effect */}
                                            <motion.div
                                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="absolute inset-0 rounded-full bg-pink-500/30"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white/60 text-xs">
                                                {isRTL ? 'همسة من' : 'Whisper from'}
                                            </p>
                                            <p className="text-white font-bold">
                                                {incomingWhisper.senderName}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDismiss}
                                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-white/70" />
                                        </button>
                                    </div>

                                    {/* Message */}
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl blur-xl" />
                                        <div className="relative bg-white/5 rounded-xl p-4 border border-white/10">
                                            <p className="text-white text-center text-lg leading-relaxed">
                                                "{incomingWhisper.message}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDismiss}
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium text-sm hover:bg-white/15 transition-colors"
                                        >
                                            {isRTL ? 'لاحقاً' : 'Later'}
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAccept}
                                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            {isRTL ? 'جاي!' : 'Coming!'}
                                        </motion.button>
                                    </div>

                                    {/* Waiting Animation */}
                                    <div className="flex items-center justify-center gap-1 pb-1">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full bg-pink-400"
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
