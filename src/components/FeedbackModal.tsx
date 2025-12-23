'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageCircle, Smile, Meh, Frown } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
    const [step, setStep] = useState(1);
    const [feeling, setFeeling] = useState<string | null>(null);
    const [rating, setRating] = useState<number>(0);

    const feelings = [
        { id: 'MORE_CONNECTED', icon: '🥰', label: 'Connected', color: 'bg-rose-500/20 text-rose-300' },
        { id: 'NEUTRAL', icon: '😐', label: 'Neutral', color: 'bg-surface-600/50 text-surface-300' },
        { id: 'STILL_TENSE', icon: '😓', label: 'Tense', color: 'bg-orange-500/20 text-orange-300' },
        { id: 'NEED_MORE_CONVERSATION', icon: '💬', label: 'Need Talk', color: 'bg-blue-500/20 text-blue-300' },
    ];

    const handleSubmit = () => {
        onSubmit({ feeling, rating });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="w-full max-w-sm bg-surface-800 border border-surface-700 rounded-3xl p-6 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-serif text-rose-100">Session Complete</h2>
                        <button onClick={onClose} className="text-surface-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Feeling */}
                        <div>
                            <p className="text-sm text-surface-300 mb-4 font-medium">How are you feeling?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {feelings.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFeeling(f.id)}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${feeling === f.id
                                                ? 'ring-2 ring-rose-500 bg-surface-700'
                                                : 'hover:bg-surface-700/50'
                                            } ${f.color}`}
                                    >
                                        <span className="text-3xl">{f.icon}</span>
                                        <span className="text-xs font-medium">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Rating (Conditional) */}
                        {feeling && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <p className="text-sm text-surface-300 mb-4 font-medium">Rate your connection</p>
                                <div className="flex justify-between px-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="text-2xl focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-surface-600'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        {rating > 0 && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleSubmit}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold transition-colors"
                            >
                                Complete Session
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
