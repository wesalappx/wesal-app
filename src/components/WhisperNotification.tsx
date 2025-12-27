'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X } from 'lucide-react';
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

    useEffect(() => {
        if (hasIncoming) {
            playSound('romantic');
        }
    }, [hasIncoming, playSound]);

    if (!hasIncoming || !incomingWhisper) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-0 left-0 right-0 z-[100]"
            >
                {/* Simple Top Bar */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-3">
                    <div className="max-w-lg mx-auto flex items-center gap-3">
                        {/* Heart */}
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-lg"
                        >
                            💕
                        </motion.span>

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {incomingWhisper.senderName}: {incomingWhisper.message}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { playSound('success'); respondToWhisper(true); }}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-medium transition-colors"
                            >
                                {isRTL ? '✓ شفت' : '✓ Seen'}
                            </button>
                            <button
                                onClick={() => { playSound('click'); dismissWhisper(); }}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-white/70" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
