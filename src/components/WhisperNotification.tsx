'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Check } from 'lucide-react';
import { useWhisper } from '@/hooks/useWhisper';
import { useSound } from '@/hooks/useSound';
import { useEffect } from 'react';

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

    const handleAccept = () => {
        playSound('success');
        respondToWhisper(true);
    };

    const handleDismiss = () => {
        playSound('click');
        dismissWhisper();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -100, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
            >
                {/* Notification Card */}
                <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl shadow-purple-500/30 overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-400/20 animate-pulse" />

                    <div className="relative p-4">
                        <div className="flex items-center gap-3">
                            {/* Heart Icon */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                            >
                                <Heart className="w-6 h-6 text-white fill-white" />
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-white/80 text-xs mb-0.5">
                                    {isRTL ? 'همسة من' : 'Whisper from'} {incomingWhisper.senderName}
                                </p>
                                <p className="text-white font-bold text-base truncate">
                                    {incomingWhisper.message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Dismiss */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDismiss}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </motion.button>

                                {/* Accept */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleAccept}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
                                >
                                    <Check className="w-5 h-5 text-purple-600" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
