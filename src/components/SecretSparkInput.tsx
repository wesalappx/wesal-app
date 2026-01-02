'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores/settings-store';

export default function SecretSparkInput() {
    const { language } = useSettingsStore();
    const isRTL = language === 'ar';

    const [isOpen, setIsOpen] = useState(false);
    const [secret, setSecret] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!secret.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/sparks/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: secret, category })
            });

            if (res.ok) {
                const data = await res.json();
                // Trigger AI processing async
                fetch('/api/sparks/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sparkId: data.spark.id })
                });

                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setIsOpen(false);
                    setSecret('');
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to create spark', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="gap-2 border-primary-500/20 hover:bg-primary-500/10 text-primary-400"
            >
                <Sparkles className="w-4 h-4" />
                {isRTL ? 'إضافة رغبة سرية' : 'Add Secret Spark'}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`border backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl relative ${useSettingsStore.getState().theme === 'light'
                                    ? 'bg-white/90 border-white/20 shadow-primary-500/10'
                                    : 'bg-slate-900/90 border-white/10'
                                }`}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`absolute top-4 right-4 hover:text-primary-500 transition-colors ${useSettingsStore.getState().theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                            >
                                ✕
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                                    <Lock className="w-6 h-6 text-primary-500" />
                                </div>
                                <h3 className={`text-xl font-bold ${useSettingsStore.getState().theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {isRTL ? 'رغبة سرية' : 'Secret Spark'}
                                </h3>
                                <p className={`text-sm mt-2 ${useSettingsStore.getState().theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {isRTL
                                        ? 'سيقوم الذكاء الاصطناعي باستكشاف رأي شريكك بطريقة غير مباشرة. لن يتم كشف السر إلا إذا أبدى اهتماماً!'
                                        : 'AI will subtly probe your partner\'s interest. Your secret is only revealed if they match your vibe!'
                                    }
                                </p>
                            </div>

                            {success ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className={`font-bold ${useSettingsStore.getState().theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                        {isRTL ? 'تم إرسال المهمة للـ AI!' : 'AI is on the case!'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className={`text-xs font-medium ${useSettingsStore.getState().theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {isRTL ? 'الفئة' : 'Category'}
                                        </label>
                                        <div className="flex gap-2 text-sm overflow-x-auto pb-2">
                                            {[
                                                { id: 'Adventure', ar: 'مغامرة', en: 'Adventure' },
                                                { id: 'Romance', ar: 'رومانسية', en: 'Romance' },
                                                { id: 'Intimacy', ar: 'حميمية', en: 'Intimacy' },
                                                { id: 'Lifestyle', ar: 'أسلوب حياة', en: 'Lifestyle' }
                                            ].map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setCategory(cat.id)}
                                                    className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${category === cat.id
                                                        ? 'bg-primary-500 border-primary-500 text-white'
                                                        : useSettingsStore.getState().theme === 'light'
                                                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            : 'border-white/10 text-slate-400 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {isRTL ? cat.ar : cat.en}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-xs font-medium ${useSettingsStore.getState().theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {isRTL ? 'ما هي رغبتك؟' : 'What is your desire?'}
                                        </label>
                                        <textarea
                                            value={secret}
                                            onChange={(e) => setSecret(e.target.value)}
                                            placeholder={isRTL ? 'مثلاً: أريد تجربة رقص السالسا...' : 'e.g., I want to try salsa dancing...'}
                                            className={`flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${useSettingsStore.getState().theme === 'light'
                                                    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                                                    : 'bg-slate-950/50 border-white/10 text-white placeholder:text-slate-500'
                                                }`}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !secret.trim()}
                                        className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                        {isRTL ? 'إطلاق الشرارة' : 'Ignite Spark'}
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
