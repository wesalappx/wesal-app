'use client';

import { useState } from 'react';
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
    Heart
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from '@/hooks/useTranslation';
import { useJourneys } from '@/hooks/useJourneys';
import { journeysData, getJourneySteps } from '@/data/journeys';

export default function JourneysPage() {
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState<{ journeyId: string; stepIndex: number } | null>(null);
    const { playSound } = useSound();
    const router = useRouter();
    const { t } = useTranslation();
    const { progressMap, isLoading } = useJourneys();

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

    // Start exercise - navigate to dedicated journey exercise page
    const startExercise = (journeyId: string, stepIndex: number) => {
        playSound('success');
        router.push(`/journey-exercise?journey=${journeyId}&step=${stepIndex + 1}`);
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
                <motion.div
                    className="absolute top-24 right-8 text-3xl opacity-20"
                    animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    💕
                </motion.div>
                <motion.div
                    className="absolute top-1/2 left-6 text-2xl opacity-15"
                    animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                >
                    ✨
                </motion.div>
                <motion.div
                    className="absolute bottom-40 right-12 text-2xl opacity-10"
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                >
                    💖
                </motion.div>
            </div>

            <div className="max-w-md mx-auto pt-4">
                {/* Back Button with Glassmorphism */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10"
                >
                    <ArrowRight className="w-4 h-4 transform rotate-180" />
                    {t('common.back')}
                </Link>

                {/* Header with Creative Styling */}
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

                {/* Journey Cards with Enhanced Design */}
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

            {/* Step Detail Modal with Next/Back Navigation */}
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
                                {/* Close Button */}
                                <button
                                    onClick={closeStep}
                                    className="absolute top-4 left-4 p-2 bg-surface-700/50 rounded-full text-surface-400 hover:text-white hover:bg-surface-700 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Completed Badge */}
                                {isCompleted && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-bold flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" />
                                        مكتمل
                                    </motion.div>
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

                                {/* Modal Content */}
                                <div className="text-center mb-6">
                                    <motion.div
                                        key={step.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 relative
                                            ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400'}`}
                                    >
                                        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-50 ${isCompleted ? 'bg-green-500/30' : 'bg-primary-500/30'}`} />
                                        <step.icon className="w-10 h-10 relative z-10" />
                                    </motion.div>

                                    <div className="text-xs text-surface-500 mb-2">
                                        الخطوة {activeStep.stepIndex + 1} من {journey.totalSteps}
                                    </div>

                                    <motion.h2
                                        key={`title-${step.id}`}
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-2xl font-bold mb-2 text-white"
                                    >
                                        {step.title}
                                    </motion.h2>
                                    <p className="text-surface-400 text-sm">{step.duration}</p>
                                </div>

                                <motion.div
                                    key={`desc-${step.id}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-surface-800/50 p-4 rounded-2xl mb-6 border border-surface-700"
                                >
                                    <p className="text-surface-300 text-sm leading-relaxed text-center">
                                        {step.description}
                                    </p>
                                </motion.div>

                                {/* Navigation & Action Buttons */}
                                <div className="flex items-center gap-3">
                                    {/* Back Button */}
                                    <button
                                        onClick={prevStep}
                                        disabled={isFirst}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                            ${isFirst
                                                ? 'bg-surface-800/30 text-surface-600 cursor-not-allowed'
                                                : 'bg-surface-700 text-white hover:bg-surface-600'}`}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Start Exercise Button */}
                                    <button
                                        onClick={() => startExercise(activeStep.journeyId, activeStep.stepIndex)}
                                        className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform
                                            ${isCompleted
                                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/20'
                                                : 'bg-gradient-to-r from-primary-600 to-accent-600 shadow-primary-500/20'}`}
                                    >
                                        {isCompleted ? 'إعادة التمرين 🔁' : 'ابدأ التمرين'}
                                    </button>

                                    {/* Next Button */}
                                    <button
                                        onClick={nextStep}
                                        disabled={isLast}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                            ${isLast
                                                ? 'bg-surface-800/30 text-surface-600 cursor-not-allowed'
                                                : 'bg-surface-700 text-white hover:bg-surface-600'}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </main>
    );
}
