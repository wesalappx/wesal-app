'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    AlertTriangle,
    Check,
    X,
    Heart,
    Loader2,
    Sparkles,
    Lock,
    Unlock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { usePairing } from '@/hooks/usePairing';

interface DealbreakQuestion {
    id: string;
    question: string;
    questionEn: string;
    category: string;
    isHard: boolean;
}

const dealbreakers: DealbreakQuestion[] = [
    { id: 'kids_want', question: 'هل ترغب في الإنجاب؟', questionEn: 'Do you want kids?', category: 'family', isHard: true },
    { id: 'smoking', question: 'هل أنت مدخن؟', questionEn: 'Do you smoke?', category: 'lifestyle', isHard: true },
    { id: 'work_abroad', question: 'هل تقبل العمل في دولة أخرى؟', questionEn: 'Would you accept working abroad?', category: 'career', isHard: false },
    { id: 'pets', question: 'هل تقبل تربية حيوانات أليفة في البيت؟', questionEn: 'Do you accept having pets at home?', category: 'lifestyle', isHard: false },
    { id: 'debt', question: 'هل عليك ديون حالياً؟', questionEn: 'Do you currently have debt?', category: 'finances', isHard: true },
    { id: 'alone_time', question: 'هل تحتاج وقت خاص لنفسك يومياً؟', questionEn: 'Do you need alone time daily?', category: 'lifestyle', isHard: false },
    { id: 'in_laws', question: 'هل تقبل السكن مع أهل الزوج؟', questionEn: 'Would you accept living with in-laws?', category: 'living', isHard: true },
    { id: 'joint_account', question: 'هل تفضل حساب بنكي مشترك؟', questionEn: 'Do you prefer a joint bank account?', category: 'finances', isHard: false },
];

export default function DealbreakersPage() {
    const router = useRouter();
    const supabase = createClient();
    const { theme } = useSettingsStore();
    const { getStatus } = usePairing();
    const isArabic = true;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | 'maybe'>>({});
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentQuestion = dealbreakers[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = dealbreakers.length;

    useEffect(() => {
        const init = async () => {
            const status = await getStatus();
            if (status.coupleId) {
                setCoupleId(status.coupleId);
                // Load existing answers
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('compatibility_answers')
                        .select('question_id, answer')
                        .eq('user_id', user.id)
                        .eq('is_dealbreaker', true);

                    if (data) {
                        const answersMap: Record<string, 'yes' | 'no' | 'maybe'> = {};
                        data.forEach(a => {
                            answersMap[a.question_id] = a.answer.value;
                        });
                        setAnswers(answersMap);
                    }
                }
            }
            setIsLoading(false);
        };
        init();
    }, []);

    const handleAnswer = async (value: 'yes' | 'no' | 'maybe') => {
        if (!currentQuestion) return;

        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // Save to DB
        if (coupleId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('compatibility_answers').upsert({
                    couple_id: coupleId,
                    user_id: user.id,
                    question_id: currentQuestion.id,
                    category: currentQuestion.category,
                    answer: { value },
                    is_dealbreaker: true,
                }, { onConflict: 'couple_id,user_id,question_id' });
            }
        }

        // Auto-advance
        setTimeout(() => {
            if (currentIndex < dealbreakers.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setShowResults(true);
            }
        }, 300);
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (isLoading) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-surface-50' : 'bg-surface-900'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    if (showResults) {
        const hardQuestions = dealbreakers.filter(q => q.isHard);
        const hardAnswered = hardQuestions.filter(q => answers[q.id]).length;

        return (
            <main className={`min-h-screen p-4 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
                <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-violet-500/20 via-transparent to-transparent rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto pt-20 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/30"
                    >
                        <Unlock className="w-12 h-12 text-white" />
                    </motion.div>

                    <h1 className="text-3xl font-bold mb-2">
                        {isArabic ? 'انتهيت! 🎉' : 'Done! 🎉'}
                    </h1>
                    <p className={`text-lg mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {isArabic ? 'أجبت على جميع الأسئلة المهمة' : 'You answered all important questions'}
                    </p>

                    <div className={`rounded-2xl p-6 mb-6 backdrop-blur-xl border ${theme === 'light' ? 'bg-white/60 border-white/50' : 'bg-surface-800/50 border-surface-700/30'}`}>
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-violet-500">{answeredCount}</p>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {isArabic ? 'أسئلة' : 'Questions'}
                                </p>
                            </div>
                            <div className="w-px h-12 bg-surface-300" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-amber-500">{hardAnswered}</p>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {isArabic ? 'أسئلة حاسمة' : 'Critical'}
                                </p>
                            </div>
                        </div>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {isArabic
                                ? 'انتظر شريكك يجاوب لتشوفوا النتائج معاً'
                                : 'Wait for your partner to answer to see results together'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn-primary w-full"
                    >
                        {isArabic ? 'رجوع للرئيسية' : 'Back to Dashboard'}
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className={`min-h-screen p-4 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-violet-500/20 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => currentIndex === 0 ? router.back() : handleBack()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border ${theme === 'light' ? 'bg-white/50 border-white/40' : 'bg-surface-800/60 border-surface-700/50'}`}
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <h1 className="text-lg font-bold">{isArabic ? 'أسئلة مهمة' : 'Key Questions'}</h1>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {currentIndex + 1}/{totalQuestions}
                    </p>
                </div>

                <div className="w-10" />
            </div>

            {/* Progress */}
            <div className="mb-8">
                <div className={`h-2 rounded-full ${theme === 'light' ? 'bg-white/50' : 'bg-surface-800/50'}`}>
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`rounded-2xl p-6 backdrop-blur-xl border mb-8 ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-lg' : 'bg-surface-800/50 border-surface-700/30'}`}
                >
                    {currentQuestion.isHard && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm mb-4">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{isArabic ? 'سؤال حاسم' : 'Critical Question'}</span>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold mb-8 leading-relaxed">
                        {isArabic ? currentQuestion.question : currentQuestion.questionEn}
                    </h2>

                    {/* Answer Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        <motion.button
                            onClick={() => handleAnswer('yes')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${answers[currentQuestion.id] === 'yes'
                                ? 'bg-emerald-500 text-white border-transparent'
                                : theme === 'light'
                                    ? 'bg-white/50 border-white/40 hover:border-emerald-500/50'
                                    : 'bg-surface-800/50 border-surface-700/30 hover:border-emerald-500/50'
                                }`}
                        >
                            <Check className="w-8 h-8" />
                            <span className="font-medium">{isArabic ? 'نعم' : 'Yes'}</span>
                        </motion.button>

                        <motion.button
                            onClick={() => handleAnswer('maybe')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${answers[currentQuestion.id] === 'maybe'
                                ? 'bg-amber-500 text-white border-transparent'
                                : theme === 'light'
                                    ? 'bg-white/50 border-white/40 hover:border-amber-500/50'
                                    : 'bg-surface-800/50 border-surface-700/30 hover:border-amber-500/50'
                                }`}
                        >
                            <Heart className="w-8 h-8" />
                            <span className="font-medium">{isArabic ? 'ممكن' : 'Maybe'}</span>
                        </motion.button>

                        <motion.button
                            onClick={() => handleAnswer('no')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all border ${answers[currentQuestion.id] === 'no'
                                ? 'bg-red-500 text-white border-transparent'
                                : theme === 'light'
                                    ? 'bg-white/50 border-white/40 hover:border-red-500/50'
                                    : 'bg-surface-800/50 border-surface-700/30 hover:border-red-500/50'
                                }`}
                        >
                            <X className="w-8 h-8" />
                            <span className="font-medium">{isArabic ? 'لا' : 'No'}</span>
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Tip */}
            <div className={`text-center text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>
                <Sparkles className="w-4 h-4 inline-block ml-1" />
                {isArabic ? 'كن صريحاً، هذه أسئلة مصيرية' : 'Be honest, these are life-changing questions'}
            </div>
        </main>
    );
}
