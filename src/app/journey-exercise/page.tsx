'use client';

import { useState, Suspense, useEffect } from 'react';
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
    MessageCircle,
    Users
} from 'lucide-react';
import { useJourneys } from '@/hooks/useJourneys';
import { useSessionSync } from '@/hooks/useSessionSync';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import SessionChat from '@/components/SessionChat';
import SessionModeModal from '@/components/SessionModeModal';
import { journeysData, getJourneySteps } from '@/data/journeys';
import { sessionData } from '@/app/game-session/data/gameContent';
import { useSettingsStore } from '@/stores/settings-store';

function JourneyExerciseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { progressMap, updateProgress } = useJourneys();
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const { theme } = useSettingsStore();

    const journeyId = searchParams.get('journey') || 'basics';
    const stepParam = searchParams.get('step');
    const stepIndex = stepParam ? parseInt(stepParam) - 1 : 0;

    const modeParam = searchParams.get('mode') as 'local' | 'remote' | null;

    // Session Sync
    const {
        session,
        mode,
        initSession,
        updateState,
        isRemote,
        loading: sessionLoading,
        isConnected
    } = useSessionSync('journey', journeyId);

    const [showModeModal, setShowModeModal] = useState(!modeParam);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);

    // Initial Mode Effect
    useEffect(() => {
        if (modeParam && !mode) {
            initSession(modeParam);
        }
    }, [modeParam, initSession, mode]);

    // Data Loading
    const journey = journeysData.find(j => j.id === journeyId);
    const steps = getJourneySteps(journeyId);
    const currentStep = steps?.[stepIndex];

    // Send Notification on Session Create
    useEffect(() => {
        const sendInvite = async () => {
            if (isRemote && session && session.id && !hasNotified) {
                // Check if I am creator
                if (session.created_by === user?.id) {
                    const status = await getStatus();
                    if (status.partner) {
                        const supabase = createClient();
                        await supabase.from('notifications').insert({
                            user_id: status.partner.id,
                            type: 'journey_invite',
                            title_ar: 'دعوة لرحلة 🚀',
                            title_en: 'Journey Invitation 🚀',
                            body_ar: `شريكك دعاك لإكمال "${currentStep?.title || 'رحلة'}"`,
                            body_en: `Partner invited you to "${currentStep?.title || 'Journey'}"`,
                            data: { url: `/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}&mode=remote` }
                        });
                        setHasNotified(true);
                    }
                }
            }
        };
        sendInvite();
    }, [isRemote, session, hasNotified, user, journeyId, stepIndex, currentStep, getStatus]);

    // Sync State Effect
    useEffect(() => {
        if (isRemote && session?.state?.stepIndex !== undefined) {
            setCurrentQuestionIndex(session.state.stepIndex);
        }
    }, [isRemote, session?.state?.stepIndex]);

    const handleModeSelect = (selectedMode: 'local' | 'remote') => {
        initSession(selectedMode);
        setShowModeModal(false);
    };

    // Get step-specific content
    const getStepContent = () => {
        const values = sessionData['values'] || [];
        const deepQuestions = sessionData['deep-questions'] || [];
        const compliments = sessionData['compliment-battle'] || [];
        // const memories = sessionData['memory-lane'] || []; // Unused
        // const roulette = sessionData['love-roulette'] || []; // Unused

        // New specific content
        const loveLanguages = sessionData['love-languages'] || [];
        const listeningSkills = sessionData['listening-skills'] || [];
        const echoExercise = sessionData['echo-exercise'] || [];
        const bodyLanguage = sessionData['body-language'] || [];
        const conflictStyles = sessionData['conflict-styles'] || [];
        const financialGoals = sessionData['financial-goals'] || [];
        const familyValues = sessionData['family-values'] || [];
        const retirementPlans = sessionData['retirement-plans'] || [];
        const futureLetter = sessionData['future-letter'] || [];

        // Fixes:
        const pillowTalk = sessionData['pillow-talk'] || [];
        const bucketList = sessionData['bucket-list'] || [];
        const legacy = sessionData['legacy'] || [];

        // Map each step to appropriate content based on theme
        // (Logic identical to previous file)
        if (journeyId === 'basics') {
            const stepContent: Record<number, any[]> = {
                0: loveLanguages,
                1: deepQuestions.slice(30, 38),
                2: values.slice(5, 13),
                3: compliments.slice(0, 8),
                4: futureLetter,
            };
            return stepContent[stepIndex] || values.slice(0, 8);
        } else if (journeyId === 'communication') {
            const stepContent: Record<number, any[]> = {
                0: listeningSkills,
                1: echoExercise,
                2: bodyLanguage,
                3: compliments.slice(30, 38),
                4: conflictStyles,
                5: deepQuestions.slice(0, 8),
                6: pillowTalk,
            };
            return stepContent[stepIndex] || deepQuestions.slice(0, 8);
        } else if (journeyId === 'future') {
            const stepContent: Record<number, any[]> = {
                0: deepQuestions.slice(20, 28),
                1: financialGoals,
                2: familyValues,
                3: bucketList,
                4: retirementPlans,
                5: legacy,
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
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            if (isRemote) updateState({ stepIndex: nextIndex });
        } else {
            const newProgress = Math.max(completedSteps, stepIndex + 1);
            await updateProgress(journeyId, newProgress);
            setIsFinished(true);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            const prevIndex = currentQuestionIndex - 1;
            setCurrentQuestionIndex(prevIndex);
            if (isRemote) updateState({ stepIndex: prevIndex });
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
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900'}`}>
                <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>خطأ في تحميل التمرين</p>
            </main>
        );
    }

    if (!question) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900'}`}>
                <div className="text-center">
                    <p className={`mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>لا توجد أسئلة لهذه الخطوة</p>
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
            <main className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950'}`}>
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
                        className={`text-4xl font-bold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
                    >
                        أحسنتم! 🎊
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`text-lg mb-8 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}
                    >
                        أكملتم "<span className="text-primary-400 font-semibold">{currentStep?.title}</span>" بنجاح
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
                            className={`w-full py-4 backdrop-blur-sm rounded-2xl font-bold border transition-all ${theme === 'light' ? 'bg-white/50 border-slate-200 text-slate-700 hover:bg-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                            العودة للرحلات
                        </button>
                    </motion.div>
                </motion.div>
            </main>
        );
    }

    const isWaiting = isRemote && !isConnected;

    return (
        <main className={`min-h-screen flex flex-col relative overflow-hidden ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950'}`}>
            {/* Premium Background Effects */}
            <div className={`absolute inset-0 pointer-events-none overflow-hidden ${theme === 'light' ? 'opacity-30' : ''}`}>
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-500/20 via-primary-500/5 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-radial from-accent-500/15 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/2 -left-20 w-[300px] h-[300px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="p-4 flex items-center justify-between z-10">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/journeys')}
                    className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all shadow-lg ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white' : 'bg-white/5 border-white/10 text-surface-400 hover:text-white hover:bg-white/10'}`}
                >
                    <X className="w-5 h-5" />
                </motion.button>

                {/* Journey Title Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-xl border shadow-lg ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}
                >
                    <journey.icon className={`w-4 h-4 ${journey?.color}`} />
                    <span className={`font-semibold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{journey?.title}</span>
                </motion.div>

                <div className="w-11" />
            </header>

            {/* Step Info */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-4 z-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30 text-primary-300 text-sm font-medium mb-3 shadow-lg shadow-primary-500/10">
                    <Sparkles className="w-4 h-4" />
                    الخطوة {stepIndex + 1} من {journey?.totalSteps}
                </div>
                <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentStep?.title}</h2>
            </motion.div>

            {/* Progress Bar */}
            <div className="px-6 pb-6 z-10">
                <div className="flex items-center justify-between text-xs mb-3">
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
                    <span className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 font-bold">{Math.round(progress)}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden shadow-inner ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-800/80'}`}>
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
            <div className={`flex-1 flex flex-col justify-center px-4 ${isRemote ? 'pb-48' : 'pb-40'} z-10`}>
                <AnimatePresence mode="wait">
                    {!isWaiting ? (
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -60, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-lg mx-auto"
                        >
                            {/* Question Card */}
                            <div className="relative">
                                {theme !== 'light' && <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-rose-500/20 rounded-[2rem] blur-xl opacity-50" />}
                                <div className={`relative backdrop-blur-2xl rounded-3xl border p-7 shadow-2xl ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-gradient-to-b from-white/10 to-white/5 border-white/20'}`}>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
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
                                    <h3 className={`text-xl md:text-2xl font-bold text-center leading-relaxed mb-5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} dir="rtl">
                                        {question.text}
                                    </h3>
                                    <p className={`text-sm text-center px-4 py-3 rounded-2xl border ${theme === 'light' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'text-surface-300 bg-surface-800/30 border-surface-700/50'}`}>
                                        💡 {question.hint}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Users className="w-10 h-10 text-primary-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">في انتظار الشريك...</h2>
                            <p className="text-surface-400">تم إرسال دعوة لإكمال الرحلة معاً</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Overlay */}
            {isRemote && session && user && (
                <SessionChat
                    sessionId={session.id}
                    userId={user.id}
                    partnerName={(session as any).partner_id ? 'Partner' : undefined}
                />
            )}

            {/* Bottom Navigation */}
            {!isWaiting && (
                <div className={`fixed bottom-0 left-0 right-0 z-20 ${isRemote ? 'mb-[70px]' : ''}`}>
                    <div className={`h-24 pointer-events-none ${theme === 'light' ? 'bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent' : 'bg-gradient-to-t from-surface-950 via-surface-950/95 to-transparent'}`} />
                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                        <div className="max-w-lg mx-auto flex items-center gap-4">
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
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNext}
                                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary-500 via-accent-500 to-rose-500 flex items-center justify-center gap-3 text-white font-bold text-lg shadow-xl shadow-primary-500/25 relative overflow-hidden"
                            >
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
            )}

            <SessionModeModal
                isOpen={showModeModal}
                onSelectMode={handleModeSelect}
                onClose={() => setShowModeModal(false)}
            />
        </main>
    );
}

export default function JourneyExercisePage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-surface-950 to-surface-900">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </main>
        }>
            <JourneyExerciseContent />
        </Suspense>
    );
}
