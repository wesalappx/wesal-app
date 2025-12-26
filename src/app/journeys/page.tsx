'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    CheckCircle,
    Play,
    X,
    Clock,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Heart,
    Users,
    MessageCircle
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from '@/hooks/useTranslation';
import { useJourneys } from '@/hooks/useJourneys';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { journeysData, getJourneySteps } from '@/data/journeys';
import SessionModeModal from '@/components/SessionModeModal';

export default function JourneysPage() {
    const supabase = createClient();
    const router = useRouter();
    const { t } = useTranslation();
    const { playSound } = useSound();

    // Hooks
    const { progressMap, isLoading } = useJourneys();
    const { getStatus } = usePairing();

    // State
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState<{ journeyId: string; stepIndex: number } | null>(null);

    // Pairing & Session State
    const [isPaired, setIsPaired] = useState(false);
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [showModeModal, setShowModeModal] = useState(false);
    const [pendingExercise, setPendingExercise] = useState<{ journeyId: string; stepIndex: number } | null>(null);

    // Check pairing and active sessions
    useEffect(() => {
        const checkStatus = async () => {
            const status = await getStatus();
            setIsPaired(status.isPaired);

            if (status.isPaired && status.coupleId) {
                // Check for ANY active journey session
                const { data } = await supabase
                    .from('active_sessions')
                    .select('*')
                    .eq('couple_id', status.coupleId)
                    .eq('activity_type', 'journey')
                    .maybeSingle();

                if (data) {
                    setActiveSession(data);
                }

                // Subscribe to new sessions (invites)
                const channel = supabase.channel('journeys_hub')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'active_sessions',
                        filter: `couple_id=eq.${status.coupleId}`
                    }, (payload) => {
                        if (payload.new && (payload.new as any).activity_type === 'journey') {
                            setActiveSession(payload.new);
                            playSound('pop');
                        } else if (payload.eventType === 'DELETE') {
                            setActiveSession(null);
                        }
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        };
        checkStatus();
    }, []);

    // Toggle journey expansion
    const toggleJourney = (journeyId: string) => {
        playSound('click');
        setSelectedJourneyId(selectedJourneyId === journeyId ? null : journeyId);
    };

    // Open step modal
    const openStep = (journeyId: string, stepIndex: number) => {
        playSound('pop');
        setActiveStep({ journeyId, stepIndex });
    };

    // Close step modal
    const closeStep = () => {
        playSound('click');
        setActiveStep(null);
    };

    // Navigate to previous step in modal
    const prevStep = () => {
        if (!activeStep) return;
        const steps = getJourneySteps(activeStep.journeyId);
        if (steps && activeStep.stepIndex > 0) {
            playSound('click');
            setActiveStep({ ...activeStep, stepIndex: activeStep.stepIndex - 1 });
        }
    };

    // Navigate to next step in modal
    const nextStep = () => {
        if (!activeStep) return;
        const steps = getJourneySteps(activeStep.journeyId);
        if (steps && activeStep.stepIndex < steps.length - 1) {
            playSound('click');
            setActiveStep({ ...activeStep, stepIndex: activeStep.stepIndex + 1 });
        }
    };

    // Initiate Exercise Flow
    const initiateExercise = (journeyId: string, stepIndex: number) => {
        if (isPaired) {
            setPendingExercise({ journeyId, stepIndex });
            setShowModeModal(true);
        } else {
            // Solo user directly goes to local mode
            playSound('success');
            router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}&mode=local`);
        }
    };

    // Handle Mode Selection
    const handleModeSelect = async (mode: 'local' | 'remote') => {
        if (!pendingExercise) return;
        setShowModeModal(false);
        playSound('success');

        const { journeyId, stepIndex } = pendingExercise;

        if (mode === 'remote') {
            // Create session if not exists logic will be handled by destination page or here?
            // To ensure "Conflict-style" robustness, we should create it here IF we are the initiator,
            // OR let the useSessionSync hook on the next page handle it.
            // But useSessionSync requires activityId.
            // Let's pass mode=remote to the page. 
            // Better: Pre-create session to ensure it's ready?
            // "ConflictPage" creates session then sets state.
            // let's trust the destination page to use `useSessionSync` correctly with `initSession`.
            router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}&mode=remote`);
        } else {
            router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}&mode=local`);
        }
        setPendingExercise(null);
    };

    // Join existing session
    const handleJoinSession = () => {
        if (!activeSession) return;
        playSound('success');
        // We assume activeSession.activity_id is the journeyId
        // And state has the step? If not, defaults to 1?
        // Let's assume active_sessions.activity_id holds the JOURNEY ID.
        const journeyId = activeSession.activity_id;
        const stepIndex = activeSession.state?.stepIndex || 0;
        router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}&mode=remote`);
    };

    // Get completed steps count for a journey
    const getCompletedSteps = (journeyId: string): number => {
        return progressMap[journeyId]?.completed_steps || 0;
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-32 relative overflow-hidden bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950">
            {/* Creative Animated Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-primary-500/15 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-accent-500/15 via-transparent to-transparent rounded-full blur-3xl" />

                {/* Floating Hearts */}
                <motion.div className="absolute top-24 right-8 text-3xl opacity-20" animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }}>💕</motion.div>
                <motion.div className="absolute top-1/2 left-6 text-2xl opacity-15" animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}>✨</motion.div>
            </div>

            <div className="max-w-md mx-auto pt-4 relative z-10">
                {/* Back Button with Glassmorphism */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10"
                >
                    <ArrowRight className="w-4 h-4 transform rotate-180" />
                    {t('common.back')}
                </Link>

                {/* Header */}
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm mb-4"
                    >
                        <Sparkles className="w-4 h-4" />
                        رحلة التواصل
                    </motion.div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-surface-300 bg-clip-text text-transparent">
                        {t('journeys.title')}
                    </h1>
                    <p className="text-surface-400">{t('journeys.subtitle')}</p>
                </div>

                {/* Active Session Banner */}
                <AnimatePresence>
                    {activeSession && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 border border-primary-500/30 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center animate-pulse">
                                        <Users className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">جلسة نشطة مع الشريك</h3>
                                        <p className="text-xs text-primary-200">يبدو أن شريكك بدأ رحلة!</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleJoinSession}
                                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/20"
                                >
                                    انضمام
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Journey Cards */}
                <div className="space-y-4">
                    {journeysData.map((journey, journeyIdx) => {
                        const completedSteps = getCompletedSteps(journey.id);
                        const isExpanded = selectedJourneyId === journey.id;
                        const steps = getJourneySteps(journey.id);
                        const progressPercent = Math.round((completedSteps / journey.totalSteps) * 100);

                        return (
                            <motion.div
                                key={journey.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: journeyIdx * 0.1 }}
                                className={`rounded-3xl border overflow-hidden bg-white/5 backdrop-blur-xl ${journey.border} shadow-lg`}
                            >
                                {/* Journey Header */}
                                <div
                                    onClick={() => toggleJourney(journey.id)}
                                    className="p-5 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon with Glow Effect */}
                                        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${journey.bg} flex items-center justify-center`}>
                                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${journey.bg} blur-lg opacity-50`} />
                                            <journey.icon className={`w-7 h-7 ${journey.color} relative z-10`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-white mb-1">{journey.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-surface-400">
                                                <span>{completedSteps}/{journey.totalSteps} خطوات</span>
                                                {progressPercent > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                                        {progressPercent}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expand Arrow */}
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            className="w-8 h-8 rounded-full bg-surface-700/50 flex items-center justify-center text-surface-400"
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4 h-2 bg-surface-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 0.5 }}
                                            className={`h-full rounded-full bg-gradient-to-r ${journey.bg.replace('/20', '')}`}
                                        />
                                    </div>
                                </div>

                                {/* Steps List */}
                                <AnimatePresence>
                                    {isExpanded && steps && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5"
                                        >
                                            <div className="p-4 space-y-2">
                                                {steps.map((step, idx) => {
                                                    const isCompleted = idx < completedSteps;
                                                    const isCurrent = idx === completedSteps;

                                                    return (
                                                        <motion.div
                                                            key={step.id}
                                                            initial={{ x: -20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            onClick={() => openStep(journey.id, idx)}
                                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                                                                ${isCurrent
                                                                    ? 'bg-primary-500/10 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                                                                    : 'hover:bg-surface-700/50 border border-transparent'}`}
                                                        >
                                                            {/* Step Icon */}
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
                                                                ${isCompleted
                                                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                                                    : isCurrent
                                                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                                                        : 'bg-surface-600 text-surface-300'}`}
                                                            >
                                                                {isCompleted ? (
                                                                    <CheckCircle className="w-5 h-5" />
                                                                ) : (
                                                                    <Play className="w-4 h-4" />
                                                                )}
                                                            </div>

                                                            {/* Step Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`font-medium text-sm truncate
                                                                    ${isCompleted ? 'text-green-400' : isCurrent ? 'text-primary-300' : 'text-white'}`}
                                                                >
                                                                    {step.title}
                                                                </h4>
                                                                <div className="flex items-center gap-1 text-xs text-surface-500">
                                                                    <Clock className="w-3 h-3" />
                                                                    {step.duration}
                                                                </div>
                                                            </div>

                                                            {/* Arrow */}
                                                            <ChevronLeft className="w-4 h-4 text-surface-500" />
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Step Detail Modal */}
            <AnimatePresence>
                {activeStep && (() => {
                    const journey = journeysData.find(j => j.id === activeStep.journeyId);
                    const steps = getJourneySteps(activeStep.journeyId);
                    const step = steps?.[activeStep.stepIndex];
                    const completedSteps = getCompletedSteps(activeStep.journeyId);
                    const isCompleted = activeStep.stepIndex < completedSteps;
                    const isFirst = activeStep.stepIndex === 0;
                    const isLast = steps ? activeStep.stepIndex === steps.length - 1 : true;

                    if (!journey || !step) return null;

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                            onClick={closeStep}
                        >
                            <motion.div
                                initial={{ y: '100%', scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: '100%', scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-gradient-to-b from-surface-800 to-surface-900 border border-surface-700 w-full max-w-md rounded-3xl p-6 relative shadow-2xl"
                            >
                                <button
                                    onClick={closeStep}
                                    className="absolute top-4 left-4 p-2 bg-surface-700/50 rounded-full text-surface-400 hover:text-white hover:bg-surface-700 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Completed Badge */}
                                {isCompleted && (
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        مكتمل
                                    </div>
                                )}

                                {/* Progress Indicator */}
                                <div className="flex justify-center gap-1.5 mb-6 pt-2">
                                    {steps?.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all ${idx === activeStep.stepIndex
                                                ? 'w-6 bg-primary-500'
                                                : idx < completedSteps
                                                    ? 'w-1.5 bg-green-500'
                                                    : 'w-1.5 bg-surface-600'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <div className="text-center mb-6">
                                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 relative ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400'}`}>
                                        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${isCompleted ? 'bg-green-500/30' : 'bg-primary-500/30'}`} />
                                        <step.icon className="w-10 h-10 relative z-10" />
                                    </div>
                                    <div className="text-xs text-surface-500 mb-2">الخطوة {activeStep.stepIndex + 1} من {journey.totalSteps}</div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">{step.title}</h2>
                                    <p className="text-surface-400 text-sm">{step.duration}</p>
                                </div>

                                <div className="bg-surface-800/50 p-4 rounded-2xl mb-6 border border-surface-700">
                                    <p className="text-surface-300 text-sm leading-relaxed text-center">{step.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={prevStep} disabled={isFirst} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isFirst ? 'bg-surface-800/30 text-surface-600 cursor-not-allowed' : 'bg-surface-700 text-white hover:bg-surface-600'}`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => initiateExercise(activeStep.journeyId, activeStep.stepIndex)}
                                        className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform ${isCompleted ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/20' : 'bg-gradient-to-r from-primary-600 to-accent-600 shadow-primary-500/20'}`}
                                    >
                                        {isCompleted ? 'إعادة التمرين 🔁' : 'ابدأ التمرين'}
                                    </button>
                                    <button onClick={nextStep} disabled={isLast} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isLast ? 'bg-surface-800/30 text-surface-600 cursor-not-allowed' : 'bg-surface-700 text-white hover:bg-surface-600'}`}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* Session Mode Modal */}
            <SessionModeModal
                isOpen={showModeModal}
                onClose={() => setShowModeModal(false)}
                onSelectMode={handleModeSelect}
                isSharedAvailable={isPaired}
            />
        </main>
    );
}
