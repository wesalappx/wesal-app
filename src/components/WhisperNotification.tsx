'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
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
            setTimeout(() => setIsExpanded(true), 400);
        } else {
            setIsExpanded(false);
        }
    }, [hasIncoming, playSound]);

    if (!hasIncoming || !incomingWhisper) return null;

    return (
        <AnimatePresence>
            <div className="fixed top-3 left-0 right-0 z-[100] flex justify-center px-4">
                <motion.div
                    initial={{ width: 40, opacity: 0, y: -20 }}
                    animate={{
                        width: isExpanded ? 300 : 160,
                        opacity: 1,
                        y: 0
                    }}
                    exit={{ width: 40, opacity: 0, y: -20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    onClick={() => !isExpanded && setIsExpanded(true)}
                    className="cursor-pointer"
                >
                    {/* Dynamic Island */}
                    <div className="bg-black rounded-[22px] border border-white/10 shadow-xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent h-1/2 rounded-t-[22px]" />

                        {!isExpanded ? (
                            // Compact Pill
                            <div className="relative flex items-center gap-2 px-3 py-2">
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="text-sm"
                                >💕</motion.span>
                                <span className="text-white text-xs font-medium truncate flex-1">
                                    {incomingWhisper.senderName}
                                </span>
                                <motion.div
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-1.5 h-1.5 rounded-full bg-pink-500"
                                />
                            </div>
                        ) : (
                            // Expanded - Compact
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative p-3 space-y-2"
                            >
                                {/* Header Row */}
                                <div className="flex items-center gap-2">
                                    <motion.span
                                        animate={{ scale: [1, 1.15, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.2 }}
                                        className="text-lg"
                                    >💕</motion.span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold truncate">
                                            {incomingWhisper.senderName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); dismissWhisper(); }}
                                        className="p-1 hover:bg-white/10 rounded-full"
                                    >
                                        <X className="w-3.5 h-3.5 text-white/50" />
                                    </button>
                                </div>

                                {/* Message */}
                                <p className="text-white/80 text-xs text-center py-1.5 bg-white/5 rounded-lg">
                                    {incomingWhisper.message}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playSound('click'); dismissWhisper(); }}
                                        className="flex-1 py-1.5 text-xs text-white/60 bg-white/5 rounded-lg hover:bg-white/10"
                                    >
                                        {isRTL ? 'لاحقاً' : 'Later'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playSound('success'); respondToWhisper(true); }}
                                        className="flex-1 py-1.5 text-xs text-white font-semibold bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        {isRTL ? 'جاي!' : 'Coming!'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
