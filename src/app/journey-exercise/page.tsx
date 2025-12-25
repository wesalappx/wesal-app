'use client';

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Sparkles,
    Star,
    X,
    Heart,
    MessageCircle
} from 'lucide-react';
import { useJourneys } from '@/hooks/useJourneys';
import { journeysData, getJourneySteps } from '@/data/journeys';
import { sessionData } from '@/app/game-session/data/gameContent';

function JourneyExerciseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { progressMap, updateProgress } = useJourneys();

    const journeyId = searchParams.get('journey') || 'basics';
    const stepParam = searchParams.get('step');
    const stepIndex = stepParam ? parseInt(stepParam) - 1 : 0;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const journey = journeysData.find(j => j.id === journeyId);
    const steps = getJourneySteps(journeyId);
    const currentStep = steps?.[stepIndex];

    // Get step-specific content that matches the journey theme
    const getStepContent = () => {
        const values = sessionData['values'] || [];
        const deepQuestions = sessionData['deep-questions'] || [];
        const compliments = sessionData['compliment-battle'] || [];
        const memories = sessionData['memory-lane'] || [];
        const roulette = sessionData['love-roulette'] || [];

        // New specific content
        const loveLanguages = sessionData['love-languages'] || [];
        const listeningSkills = sessionData['listening-skills'] || [];
        const echoExercise = sessionData['echo-exercise'] || [];
        const bodyLanguage = sessionData['body-language'] || [];
        const conflictStyles = sessionData['conflict-styles'] || [];
        const financialGoals = sessionData['financial-goals'] || [];
        const familyValues = sessionData['family-values'] || [];
        const retirementPlans = sessionData['retirement-plans'] || [];

        // Map each step to appropriate content based on theme
        if (journeyId === 'basics') {
            // 5 steps: لغات الحب, جلسة مصارحة, قيمنا المشتركة, تحدي الامتنان, رسالة للمستقبل
            const stepContent: Record<number, any[]> = {
                0: loveLanguages,            // Step 1: Love Languages
                1: deepQuestions.slice(30, 38), // Step 2: Session (Openness)
                2: values.slice(5, 13),      // Step 3: Shared Values
                3: compliments.slice(0, 8),  // Step 4: Gratitude Challenge
                4: deepQuestions.slice(20, 28), // Step 5: Message to Future
            };
            return stepContent[stepIndex] || values.slice(0, 8);
        } else if (journeyId === 'communication') {
            // 7 steps: المستمع الجيد, تمرين الصدى, لغة الجسد, درس في التقدير, طرق الزعل, أنا أشعر, حديث الوسادة
            const stepContent: Record<number, any[]> = {
                0: listeningSkills,          // Step 1: Good Listener
                1: echoExercise,             // Step 2: Echo Exercise
                2: bodyLanguage,             // Step 3: Body Language
                3: compliments.slice(30, 38), // Step 4: Appreciation Lesson
                4: conflictStyles,           // Step 5: Conflict Styles
                5: deepQuestions.slice(0, 8),   // Step 6: I feel...
                6: roulette.slice(0, 8),     // Step 7: Pillow Talk
            };
            return stepContent[stepIndex] || deepQuestions.slice(0, 8);
        } else if (journeyId === 'future') {
            // 6 steps: لوحة الأحلام, الأهداف المالية, العائلة والتربية, قائمة الأمنيات, التقاعد السعيد, الإرث
            const stepContent: Record<number, any[]> = {
                0: deepQuestions.slice(20, 28), // Step 1: Dream Board
                1: financialGoals,           // Step 2: Financial Goals
                2: familyValues,             // Step 3: Family & Parenting
                3: memories.slice(0, 8),     // Step 4: Bucket List
                4: retirementPlans,          // Step 5: Happy Retirement
                5: values.slice(10, 18),     // Step 6: Legacy
            };
            return stepContent[stepIndex] || deepQuestions.slice(0, 8);
        }
        return values.slice(0, 8);
    };

    const questions = getStepContent();
    const question = questions[currentQuestionIndex];

    const completedSteps = progressMap[journeyId]?.completed_steps || 0;
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    const handleNext = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            const newProgress = Math.max(completedSteps, stepIndex + 1);
            await updateProgress(journeyId, newProgress);
            setIsFinished(true);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const goToNextStep = () => {
        if (steps && stepIndex < steps.length - 1) {
            router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 2}`);
            setCurrentQuestionIndex(0);
            setIsFinished(false);
        } else {
            router.push('/journeys');
        }
    };

    if (!journey || !currentStep) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface-900">
                <p className="text-surface-400">خطأ في تحميل التمرين</p>
            </main>
        );
    }

    if (!question) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-surface-900">
                <div className="text-center">
                    <p className="text-surface-400 mb-4">لا توجد أسئلة لهذه الخطوة</p>
                    <button
                        onClick={() => router.push('/journeys')}
                        className="px-6 py-3 bg-primary-500 rounded-xl text-white"
                    >
                        العودة للرحلات
                    </button>
                </div>
            </main>
        );
    }

    // Completion Screen
    if (isFinished) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Celebration Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]" />

                    {/* Floating Celebrations */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-2xl"
                            style={{
                                left: `${15 + i * 15}%`,
                                top: `${20 + (i % 3) * 25}%`,
                            }}
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 3 + i * 0.5,
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        >
                            {['🎉', '✨', '💫', '🌟', '💖', '🎊'][i]}
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center max-w-md relative z-10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-28 h-28 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-500/30"
                    >
                        <CheckCircle className="w-14 h-14 text-white" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-bold text-white mb-3"
                    >
                        أحسنتم! 🎊
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-surface-300 text-lg mb-8"
                    >
                        أكملتم "<span className="text-primary-400 font-semibold">{currentStep.title}</span>" بنجاح
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        {steps && stepIndex < steps.length - 1 && (
                            <button
                                onClick={goToNextStep}
                                className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl font-bold text-white text-lg shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] transition-all"
                            >
                                الخطوة التالية ←
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/journeys')}
                            className="w-full py-4 bg-white/5 backdrop-blur-sm rounded-2xl font-bold text-white border border-white/10 hover:bg-white/10 transition-all"
                        >
                            العودة للرحلات
                        </button>
                    </motion.div>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 flex flex-col relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Main gradient orbs */}
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-500/20 via-primary-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-radial from-accent-500/15 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent rounded-full blur-3xl" />

                {/* Floating hearts and sparkles */}
                <motion.div
                    className="absolute top-20 right-6 text-3xl"
                    animate={{ y: [0, -20, 0], rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    💕
                </motion.div>
                <motion.div
                    className="absolute top-1/3 left-4 text-2xl"
                    animate={{ y: [0, -15, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                    ✨
                </motion.div>
                <motion.div
                    className="absolute bottom-1/3 right-8 text-xl"
                    animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                >
                    💫
                </motion.div>

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Header */}
            <header className="p-4 flex items-center justify-between z-10">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/journeys')}
                    className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/10 transition-all shadow-lg"
                >
                    <X className="w-5 h-5" />
                </motion.button>

                {/* Journey Title Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
                >
                    <journey.icon className={`w-4 h-4 ${journey.color}`} />
                    <span className="text-white font-semibold text-sm">{journey.title}</span>
                </motion.div>

                <div className="w-11" />
            </header>

            {/* Step Info with Premium Styling */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-4 z-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 text-sm font-medium mb-3 shadow-lg shadow-primary-500/10">
                    <Sparkles className="w-4 h-4" />
                    الخطوة {stepIndex + 1} من {journey.totalSteps}
                </div>
                <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
            </motion.div>

            {/* Progress Bar - Enhanced */}
            <div className="px-6 pb-6 z-10">
                <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-surface-400 font-medium">السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                    <span className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-surface-800/80 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-rose-500 rounded-full relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full" />
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-4 pb-40 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, x: 60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -60, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-lg mx-auto"
                    >
                        {/* Question Card - Premium Design */}
                        <div className="relative">
                            {/* Card glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-rose-500/20 rounded-[2rem] blur-xl opacity-50" />

                            <div className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 p-7 shadow-2xl">
                                {/* Decorative top accent */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />

                                {/* Phase badge if exists */}
                                {question.phase && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center mb-5"
                                    >
                                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold shadow-lg">
                                            <MessageCircle className="w-4 h-4" />
                                            {question.phase}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Question Text */}
                                <h3 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed mb-5" dir="rtl">
                                    {question.text}
                                </h3>

                                {/* Hint */}
                                <p className="text-surface-300 text-sm text-center px-4 py-3 bg-surface-800/30 rounded-2xl border border-surface-700/50">
                                    💡 {question.hint}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation - Premium */}
            <div className="fixed bottom-0 left-0 right-0 z-20">
                {/* Gradient fade */}
                <div className="h-24 bg-gradient-to-t from-surface-950 via-surface-950/95 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                    <div className="max-w-lg mx-auto flex items-center gap-4">
                        {/* Back Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg
                                ${currentQuestionIndex === 0
                                    ? 'bg-surface-800/30 text-surface-600 cursor-not-allowed'
                                    : 'bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/10'}`}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </motion.button>

                        {/* Next/Complete Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleNext}
                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary-500 via-accent-500 to-rose-500 flex items-center justify-center gap-3 text-white font-bold text-lg shadow-xl shadow-primary-500/25 relative overflow-hidden"
                        >
                            {/* Shimmer effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        إنهاء الخطوة
                                    </>
                                ) : (
                                    <>
                                        التالي
                                        <ChevronLeft className="w-5 h-5" />
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function JourneyExercisePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-surface-950 to-surface-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"
                />
            </main>
        }>
            <JourneyExerciseContent />
        </Suspense>
    );
}
