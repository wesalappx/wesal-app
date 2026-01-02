"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Send, X, Lock } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useRouter } from 'next/navigation';

interface AIProbeCardProps {
    sparkId: string;
    question: string;
    category: string;
    onRespond: () => void;
}

export default function AIProbeCard({ sparkId, question, category, onRespond }: AIProbeCardProps) {
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { theme, language } = useSettingsStore();
    const isRTL = language === 'ar';
    const router = useRouter();

    const handleSubmit = async () => {
        if (!response.trim()) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/sparks/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sparkId, response })
            });

            if (res.ok) {
                onRespond();
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to respond to spark:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl border p-6 ${theme === 'light'
                ? 'bg-white/80 border-purple-200 shadow-xl shadow-purple-500/10'
                : 'bg-surface-800/80 border-purple-500/30 shadow-xl shadow-purple-900/20'
                }`}
        >
            {/* Background Effects */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 ${theme === 'light' ? 'bg-purple-400' : 'bg-purple-600'
                }`} />
            <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-2xl opacity-20 -ml-10 -mb-10 ${theme === 'light' ? 'bg-indigo-400' : 'bg-indigo-600'
                }`} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-purple-500/20 text-purple-300'
                        }`}>
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {language === 'ar' ? 'سؤال خاص من AI' : 'Special Question from AI'}
                        </h3>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {language === 'ar' ? 'شريكك شارك شيئاً، والذكاء الاصطناعي يريد رأيك' : 'Your partner shared something, AI wants your input'}
                        </p>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl mb-6 border ${theme === 'light'
                    ? 'bg-purple-50/50 border-purple-100 text-slate-700'
                    : 'bg-surface-900/50 border-white/5 text-slate-200'
                    }`}>
                    <p className="text-lg font-medium leading-relaxed">"{question}"</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${theme === 'light'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-purple-500/20 text-purple-300'
                            }`}>
                            {category}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder={language === 'ar' ? 'اكتب ردك هنا...' : 'Type your honest response here...'}
                        className={`w-full p-4 rounded-xl border resize-none focus:ring-2 transition-all ${theme === 'light'
                            ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-400 focus:ring-purple-100'
                            : 'bg-surface-900 border-surface-700 text-white placeholder-surface-500 focus:border-purple-500/50 focus:ring-purple-500/20'
                            }`}
                        rows={3}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={!response.trim() || isSubmitting}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${!response.trim() || isSubmitting
                            ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25 transform hover:scale-[1.02]'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                        ) : (
                            <>
                                <span>{language === 'ar' ? 'إرسال الرد' : 'Send Response'}</span>
                                <Send className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </>
                        )}
                    </button>

                    <p className={`text-xs text-center flex items-center justify-center gap-1 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        <Lock className="w-3 h-3" />
                        {language === 'ar' ? 'ردك سيبقى سرياً حتى يقرر AI غير ذلك' : 'Your response is private until AI decides otherwise'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
