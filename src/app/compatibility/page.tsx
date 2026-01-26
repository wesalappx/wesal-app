'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Heart,
    Home,
    Wallet,
    Users,
    Sparkles,
    Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { usePairing } from '@/hooks/usePairing';

// Compatibility Question Categories
const categories = [
    { id: 'values', title: 'القيم', titleEn: 'Values', icon: Heart, color: 'from-rose-500 to-pink-600' },
    { id: 'living', title: 'السكن', titleEn: 'Living', icon: Home, color: 'from-emerald-500 to-teal-600' },
    { id: 'finances', title: 'المال', titleEn: 'Finances', icon: Wallet, color: 'from-amber-500 to-orange-600' },
    { id: 'family', title: 'الأهل', titleEn: 'Family', icon: Users, color: 'from-violet-500 to-purple-600' },
];

// Sample questions (In production, these would come from DB/API)
const questions: Record<string, { id: string; question: string; questionEn: string; options: { value: string; label: string; labelEn: string }[] }[]> = {
    values: [
        {
            id: 'religious_practice',
            question: 'ما مستوى الالتزام الديني المتوقع في حياتنا؟',
            questionEn: 'What level of religious practice do you expect?',
            options: [
                { value: 'strict', label: 'ملتزم جداً', labelEn: 'Very strict' },
                { value: 'moderate', label: 'معتدل', labelEn: 'Moderate' },
                { value: 'flexible', label: 'مرن', labelEn: 'Flexible' },
            ]
        },
        {
            id: 'career_priority',
            question: 'ما أهمية العمل والمهنة في حياتنا؟',
            questionEn: 'How important is career in our life?',
            options: [
                { value: 'top', label: 'أولوية قصوى', labelEn: 'Top priority' },
                { value: 'balanced', label: 'توازن مع الحياة', labelEn: 'Balanced with life' },
                { value: 'secondary', label: 'الأسرة أولاً', labelEn: 'Family first' },
            ]
        },
    ],
    living: [
        {
            id: 'live_with_family',
            question: 'هل نسكن مع الأهل بعد الزواج؟',
            questionEn: 'Will we live with family after marriage?',
            options: [
                { value: 'yes', label: 'نعم', labelEn: 'Yes' },
                { value: 'temporary', label: 'مؤقتاً ثم مستقلين', labelEn: 'Temporarily, then independent' },
                { value: 'no', label: 'مستقلين من البداية', labelEn: 'Independent from start' },
            ]
        },
        {
            id: 'location',
            question: 'أين نحب نسكن؟',
            questionEn: 'Where would we like to live?',
            options: [
                { value: 'same_city', label: 'نفس المدينة', labelEn: 'Same city' },
                { value: 'flexible', label: 'مرنين', labelEn: 'Flexible' },
                { value: 'abroad', label: 'منفتحين على السفر', labelEn: 'Open to moving abroad' },
            ]
        },
    ],
    finances: [
        {
            id: 'wife_work',
            question: 'هل الزوجة تعمل بعد الزواج؟',
            questionEn: 'Will the wife work after marriage?',
            options: [
                { value: 'yes', label: 'نعم', labelEn: 'Yes' },
                { value: 'optional', label: 'حسب رغبتها', labelEn: 'Her choice' },
                { value: 'no', label: 'لا', labelEn: 'No' },
            ]
        },
        {
            id: 'savings',
            question: 'ما نسبة الادخار الشهري؟',
            questionEn: 'What percentage should we save monthly?',
            options: [
                { value: 'high', label: '30%+', labelEn: '30%+' },
                { value: 'moderate', label: '10-30%', labelEn: '10-30%' },
                { value: 'flexible', label: 'حسب الظروف', labelEn: 'Depends on circumstances' },
            ]
        },
    ],
    family: [
        {
            id: 'children',
            question: 'متى نخطط للإنجاب؟',
            questionEn: 'When do we plan to have children?',
            options: [
                { value: 'soon', label: 'بأسرع وقت', labelEn: 'As soon as possible' },
                { value: 'wait', label: 'بعد سنة أو سنتين', labelEn: 'After 1-2 years' },
                { value: 'later', label: 'بعد الاستقرار', labelEn: 'After settling down' },
            ]
        },
        {
            id: 'parenting_style',
            question: 'أسلوب التربية المفضل؟',
            questionEn: 'Preferred parenting style?',
            options: [
                { value: 'strict', label: 'صارم ومنظم', labelEn: 'Strict and organized' },
                { value: 'balanced', label: 'متوازن', labelEn: 'Balanced' },
                { value: 'relaxed', label: 'مرن وحر', labelEn: 'Relaxed and free' },
            ]
        },
    ],
};

export default function CompatibilityTestPage() {
    const router = useRouter();
    const supabase = createClient();
    const { theme } = useSettingsStore();
    const { getStatus } = usePairing();
    const isArabic = true; // TODO: Use translation hook

    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [partnerAnswers, setPartnerAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [isPaired, setIsPaired] = useState(false);

    const currentCategory = categories[currentCategoryIndex];
    const categoryQuestions = questions[currentCategory.id] || [];
    const currentQuestion = categoryQuestions[currentQuestionIndex];
    const totalQuestions = Object.values(questions).flat().length;
    const answeredCount = Object.keys(answers).length;

    useEffect(() => {
        const init = async () => {
            const status = await getStatus();
            setIsPaired(status.isPaired);
            if (status.coupleId) {
                setCoupleId(status.coupleId);
                // Load existing answers
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: existingAnswers } = await supabase
                        .from('compatibility_answers')
                        .select('question_id, answer')
                        .eq('user_id', user.id);

                    if (existingAnswers) {
                        const answersMap: Record<string, string> = {};
                        existingAnswers.forEach(a => {
                            answersMap[a.question_id] = a.answer.value;
                        });
                        setAnswers(answersMap);
                    }
                }
            }
        };
        init();
    }, []);

    const handleSelectAnswer = async (value: string) => {
        if (!currentQuestion) return;

        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        // Save to database
        if (coupleId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('compatibility_answers').upsert({
                    couple_id: coupleId,
                    user_id: user.id,
                    question_id: currentQuestion.id,
                    category: currentCategory.id,
                    answer: { value },
                }, { onConflict: 'couple_id,user_id,question_id' });
            }
        }

        // Auto-advance
        setTimeout(() => {
            if (currentQuestionIndex < categoryQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else if (currentCategoryIndex < categories.length - 1) {
                setCurrentCategoryIndex(prev => prev + 1);
                setCurrentQuestionIndex(0);
            } else {
                // All done - show results
                setShowResults(true);
            }
        }, 300);
    };

    const handleBack = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        } else if (currentCategoryIndex > 0) {
            setCurrentCategoryIndex(prev => prev - 1);
            const prevCategoryQuestions = questions[categories[currentCategoryIndex - 1].id];
            setCurrentQuestionIndex(prevCategoryQuestions.length - 1);
        }
    };

    const calculateScore = () => {
        // For now, return a mock score. In production, compare with partner's answers
        const answered = Object.keys(answers).length;
        const total = totalQuestions;
        return Math.round((answered / total) * 100);
    };

    if (showResults) {
        const score = calculateScore();
        return (
            <main className={`min-h-screen p-4 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
                <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-emerald-500/20 via-transparent to-transparent rounded-full blur-3xl" />
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
                        className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                    >
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>

                    <h1 className="text-3xl font-bold mb-2">
                        {isArabic ? 'أحسنت! 🎉' : 'Well Done! 🎉'}
                    </h1>
                    <p className={`text-lg mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {isArabic ? 'أجبت على جميع الأسئلة' : 'You answered all questions'}
                    </p>

                    <div className={`rounded-2xl p-6 mb-6 backdrop-blur-xl border ${theme === 'light' ? 'bg-white/60 border-white/50' : 'bg-surface-800/50 border-surface-700/30'}`}>
                        <p className={`text-sm mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {isArabic ? 'إكمالك للاختبار' : 'Your completion'}
                        </p>
                        <div className="text-5xl font-bold text-emerald-500 mb-2">{score}%</div>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {isArabic
                                ? 'انتظر شريكك يكمل الاختبار لتشوفوا التوافق'
                                : 'Wait for your partner to complete the test to see compatibility'}
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

    if (!currentQuestion) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-surface-50' : 'bg-surface-900'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className={`min-h-screen p-4 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial ${currentCategory.color.replace('from-', 'from-').replace('to-', 'via-')}/20 to-transparent rounded-full blur-3xl`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => currentQuestionIndex === 0 && currentCategoryIndex === 0 ? router.back() : handleBack()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border ${theme === 'light' ? 'bg-white/50 border-white/40' : 'bg-surface-800/60 border-surface-700/50'}`}
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <h1 className="text-lg font-bold">{isArabic ? currentCategory.title : currentCategory.titleEn}</h1>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {answeredCount}/{totalQuestions} {isArabic ? 'سؤال' : 'questions'}
                    </p>
                </div>

                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className={`h-2 rounded-full ${theme === 'light' ? 'bg-white/50' : 'bg-surface-800/50'}`}>
                    <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${currentCategory.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                {/* Category Pills */}
                <div className="flex justify-center gap-2 mt-4">
                    {categories.map((cat, idx) => (
                        <div
                            key={cat.id}
                            className={`w-3 h-3 rounded-full transition-all ${idx === currentCategoryIndex
                                ? `bg-gradient-to-r ${cat.color} scale-125`
                                : idx < currentCategoryIndex
                                    ? 'bg-emerald-500'
                                    : theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className={`rounded-2xl p-6 backdrop-blur-xl border mb-6 ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-lg' : 'bg-surface-800/50 border-surface-700/30'}`}
                >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentCategory.color} flex items-center justify-center shadow-lg mb-4`}>
                        <currentCategory.icon className="w-7 h-7 text-white" />
                    </div>

                    <h2 className="text-xl font-bold mb-6">
                        {isArabic ? currentQuestion.question : currentQuestion.questionEn}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQuestion.options.map((option) => (
                            <motion.button
                                key={option.value}
                                onClick={() => handleSelectAnswer(option.value)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full p-4 rounded-xl text-right transition-all border ${answers[currentQuestion.id] === option.value
                                    ? `bg-gradient-to-r ${currentCategory.color} text-white border-transparent`
                                    : theme === 'light'
                                        ? 'bg-white/50 border-white/40 hover:border-primary-500/30'
                                        : 'bg-surface-800/50 border-surface-700/30 hover:border-primary-500/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                        {isArabic ? option.label : option.labelEn}
                                    </span>
                                    {answers[currentQuestion.id] === option.value && (
                                        <Check className="w-5 h-5" />
                                    )}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Tip */}
            <div className={`text-center text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>
                <Sparkles className="w-4 h-4 inline-block ml-1" />
                {isArabic ? 'أجب بصراحة، لا توجد إجابة خاطئة' : 'Answer honestly, there are no wrong answers'}
            </div>
        </main>
    );
}
