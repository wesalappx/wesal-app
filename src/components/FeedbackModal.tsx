'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageCircle, Smile, Meh, Frown } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
    const { theme } = useSettingsStore();
    const [step, setStep] = useState(1);
    const [feeling, setFeeling] = useState<string | null>(null);
    const [rating, setRating] = useState<number>(0);

    const feelings = [
        { id: 'MORE_CONNECTED', icon: '🥰', label: 'Connected', color: theme === 'light' ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/20 text-rose-300' },
        { id: 'NEUTRAL', icon: '😐', label: 'Neutral', color: theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-surface-600/50 text-surface-300' },
        { id: 'STILL_TENSE', icon: '😓', label: 'Tense', color: theme === 'light' ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-300' },
        { id: 'NEED_MORE_CONVERSATION', icon: '💬', label: 'Need Talk', color: theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-300' },
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
                className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm ${theme === 'light' ? 'bg-slate-900/40' : 'bg-black/80'
                    }`}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${theme === 'light'
                            ? 'bg-white/95 border-white/40 shadow-xl shadow-purple-500/10'
                            : 'bg-surface-800 border-surface-700'
                        }`}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-xl font-bold font-serif ${theme === 'light' ? 'text-slate-800' : 'text-rose-100'}`}>Session Complete</h2>
                        <button onClick={onClose} className={`transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-surface-400 hover:text-white'}`}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Step 1: Feeling */}
                        <div>
                            <p className={`text-sm mb-4 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>How are you feeling?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {feelings.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFeeling(f.id)}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${feeling === f.id
                                                ? `ring-2 ring-rose-500 ${theme === 'light' ? 'bg-white shadow-md border-rose-200' : 'bg-surface-700 border-transparent'}`
                                                : `${theme === 'light' ? 'hover:bg-slate-50 border-slate-100' : 'hover:bg-surface-700/50 border-transparent'}`
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
                                <p className={`text-sm mb-4 font-medium ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>Rate your connection</p>
                                <div className="flex justify-between px-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            className="text-2xl focus:outline-none transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-8 h-8 ${rating >= star
                                                        ? 'fill-amber-400 text-amber-400'
                                                        : theme === 'light' ? 'text-slate-200' : 'text-surface-600'
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
                                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${theme === 'light'
                                        ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                                    }`}
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
