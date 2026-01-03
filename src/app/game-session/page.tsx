'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MessageCircle, ChevronRight, Check, Trophy, Zap, Camera, Flame, Heart, RefreshCw, Star, ThumbsUp, SkipForward, X, Users } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';


// Import game content from extracted data file
import { sessionData, getTruthsAndDares } from './data/gameContent';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/useJourneys';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settings-store';
import { useSessionSync } from '@/hooks/useSessionSync';
import { usePairing } from '@/hooks/usePairing';
import SessionChat from '@/components/SessionChat';
import SessionModeModal from '@/components/SessionModeModal';


// Map game modes to journey types
const MODE_TO_JOURNEY: Record<string, string> = {
    'values': 'basics',
    'deep-questions': 'communication',
    'would-you-rather': 'fun',
    'compliment-battle': 'gratitude',
    'love-roulette': 'intimacy',
    'memory-lane': 'connection',
    'truth-or-dare': 'adventure',
    'couple-quiz': 'knowledge',
    'minute-challenges': 'active'
};

// Shuffle array helper (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

function GameSessionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { theme } = useSettingsStore();
    const mode = searchParams.get('mode') || 'values';

    const getModeTitle = () => {
        switch (mode) {
            case 'values': return t('games.values', 'Shared Values');
            case 'deep-questions': return t('games.deepQuestions', 'Deep Questions');
            case 'truth-or-dare': return t('games.truthOrDare', 'Truth or Dare');
            case 'would-you-rather': return t('games.wouldYouRather', 'Would You Rather');
            case 'compliment-battle': return t('games.complimentBattle', 'Compliment Battle');
            case 'love-roulette': return t('games.loveRoulette', 'Love Roulette');
            case 'memory-lane': return t('games.memoryLane', 'Memory Lane');
            case 'couple-quiz': return 'معركة الأسئلة';
            case 'minute-challenges': return 'تحدي الدقيقة';
            default: return t('games.game', 'Game');
        }
    };
    const stepNumber = parseInt(searchParams.get('step') || '1');
    const journeyId = searchParams.get('journey'); // Get journey ID directly from URL

    // State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
    const [scores, setScores] = useState({ p1: 0, p2: 0 });
    const [isFinished, setIsFinished] = useState(false);
    const [wyrChoice, setWyrChoice] = useState<'A' | 'B' | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<any>(null);
    // Truth or Dare specific state
    const [todChoice, setTodChoice] = useState<'TRUTH' | 'DARE' | null>(null);
    const [todRevealed, setTodRevealed] = useState(false);
    const [todTruths, setTodTruths] = useState<any[]>([]);
    const [todDares, setTodDares] = useState<any[]>([]);
    const [todCurrentChallenge, setTodCurrentChallenge] = useState<any>(null);

    // Couple Quiz state
    const [quizScore, setQuizScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);

    // Minute to Win It state
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [challengeComplete, setChallengeComplete] = useState(false);

    // Would You Rather fix - voting
    const [p1Vote, setP1Vote] = useState<string | null>(null);
    const [p2Vote, setP2Vote] = useState<string | null>(null);
    const [showVotes, setShowVotes] = useState(false);

    // Compliment Battle fix - ratings
    const [complimentRating, setComplimentRating] = useState<number>(0);
    const [complimentScores, setComplimentScores] = useState<number[]>([]);

    // Prepare questions - RANDOMIZED ORDER
    const questions = sessionData[mode] || sessionData['values'] || [];
    const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);

    // For Truth or Dare, split into truths and dares
    const truths = mode === 'truth-or-dare' ? currentQuestions.filter((q: any) => q.type === 'TRUTH') : [];
    const dares = mode === 'truth-or-dare' ? currentQuestions.filter((q: any) => q.type === 'DARE') : [];

    const question = currentQuestions?.[currentIndex];
    const progress = currentQuestions.length > 0 ? ((currentIndex + 1) / currentQuestions.length) * 100 : 0;

    // Session Sync
    const {
        session,
        mode: sessionMode,
        initSession: initGameSession,
        updateState,
        isRemote,
        loading: sessionLoading,
        isConnected
    } = useSessionSync('game', mode);

    const { updateProgress, progressMap } = useJourneys();
    const { user } = useAuth();
    const { preferredSessionMode } = useSettingsStore();

    // Init modal state - start with true (show modal) then check preference
    const [showModeModal, setShowModeModal] = useState(true);

    // Check preference on mount and init session if needed
    useEffect(() => {
        if (preferredSessionMode) {
            setShowModeModal(false);
            if (!session) {
                initGameSession(preferredSessionMode);
            }
        }
    }, [preferredSessionMode, session]);

    // Sync Game State
    useEffect(() => {
        if (isRemote && session?.state) {
            // Sync questions order if provided
            if (Array.isArray(session.state.questions) && session.state.questions.length > 0) {
                // Ensure we don't overwrite if already set to avoid re-render loops
                // But we trust the session state as source of truth.
                setCurrentQuestions(session.state.questions);
            }

            if (session.state.currentIndex !== undefined) setCurrentIndex(session.state.currentIndex);
            if (session.state.turn) setTurn(session.state.turn as 'p1' | 'p2');
            if (session.state.scores) setScores(session.state.scores);
            // Sync specific game states
            if (session.state.wyrChoice) setWyrChoice(session.state.wyrChoice);
            if (session.state.spinResult) setSpinResult(session.state.spinResult);
            if (session.state.isSpinning !== undefined) setIsSpinning(session.state.isSpinning);
            if (session.state.todChoice) setTodChoice(session.state.todChoice);
            // ... add others
        }
    }, [isRemote, session?.state]);

    const [hasNotified, setHasNotified] = useState(false);
    const { getStatus } = usePairing(); // Need partner ID

    // Timer effect for Minute to Win It
    useEffect(() => {
        if (mode === 'minute-challenges' && timerRunning && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (timeLeft === 0 && timerRunning) {
            setTimerRunning(false);
        }
    }, [mode, timerRunning, timeLeft]);

    // Handle Mode Selection
    const handleModeSelect = (selectedMode: 'local' | 'remote') => {
        initGameSession(selectedMode);
        setShowModeModal(false);
    };

    // Auto-select mode based on preference or active session
    useEffect(() => {
        if (sessionLoading) return;

        // If session exists (e.g. joined via invite), hide modal
        if (session) {
            setShowModeModal(false);
            return;
        }

        // If no session but we have a preference, use it
        const { preferredSessionMode } = useSettingsStore.getState();
        if (showModeModal && preferredSessionMode) {
            initGameSession(preferredSessionMode);
            setShowModeModal(false);
        }
    }, [sessionLoading, session, showModeModal]);

    // Send Notification on Session Create
    useEffect(() => {
        const sendInvite = async () => {
            if (isRemote && session && session.id && !hasNotified) {
                // Check if I am creator
                if (session.created_by === user?.id) {
                    const status = await getStatus();
                    if (status.partner) {
                        await createClient().from('notifications').insert({
                            user_id: status.partner.id,
                            type: 'game_invite',
                            title_ar: 'دعوة للعب 🎮',
                            title_en: 'Game Invitation 🎮',
                            body_ar: `شريكك دعاك للعب "${getModeTitle()}"`,
                            body_en: `Partner invited you to play "${getModeTitle()}"`,
                            data: { url: `/game-session?mode=${mode}&journey=${journeyId || ''}` } // session_id isn't needed if we assume ONE active session, but standard practice is nice.
                            // Actually, standard link should probably include session_id in query if we want direct join, 
                            // but useSessionSync usually finds active session by Type.
                            // Let's stick to simple URL.
                        });
                        setHasNotified(true);
                    }
                }
            }
        };
        sendInvite();
    }, [isRemote, session, hasNotified, user]);

    // Initialize Questions (Only if local or if Creator in remote)
    useEffect(() => {
        // If remote and NOT creator, wait for sync (handled above).
        // If local OR (remote AND creator), shuffle and set.
        const shouldInit = sessionMode === 'local' || (isRemote && session?.created_by === user?.id) || !sessionMode;

        if (shouldInit && questions.length > 0 && currentQuestions.length === 0) {
            const shuffled = shuffleArray(questions);
            setCurrentQuestions(shuffled);

            // If remote creator, push state
            if (isRemote) {
                updateState({ questions: shuffled });
            }
        }
    }, [mode, sessionMode, isRemote, session?.created_by, user?.id, questions, currentQuestions.length, updateState]);
    // Removed legacy sync logic (replaced by useSessionSync hook)

    const handleNext = async () => {
        if (currentIndex < currentQuestions.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextTurn = turn === 'p1' ? 'p2' : 'p1';

            setCurrentIndex(nextIndex);
            setTurn(nextTurn);
            setWyrChoice(null);

            if (isRemote) updateState({ currentIndex: nextIndex, turn: nextTurn, wyrChoice: null });
        } else {
            setIsFinished(true);
            if (isRemote) updateState({ isFinished: true });

            // Save journey progress - use journey ID from URL directly
            if (journeyId) {
                const currentProgress = progressMap[journeyId]?.completed_steps || 0;
                const newProgress = Math.max(currentProgress, stepNumber);
                await updateProgress(journeyId, newProgress);
            }
        }
    };

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setSpinResult(null);

        if (isRemote) updateState({ isSpinning: true, spinResult: null });

        setTimeout(() => {
            // Only the one who clicked spins? Or centralized?
            // For simplicity, local random then push
            const randomItem = currentQuestions[Math.floor(Math.random() * currentQuestions.length)];
            setSpinResult(randomItem);
            setIsSpinning(false);
            if (isRemote) updateState({ spinResult: randomItem, isSpinning: false });
        }, 2000);
    };

    const addScore = async (player: 'p1' | 'p2') => {
        const newScores = { ...scores, [player]: scores[player] + 1 };
        setScores(newScores);

        if (currentIndex < currentQuestions.length - 1) {
            const nextIndex = currentIndex + 1;
            const nextTurn = turn === 'p1' ? 'p2' : 'p1';
            setCurrentIndex(nextIndex);
            setTurn(nextTurn);
            setWyrChoice(null);
            if (isRemote) updateState({ scores: newScores, currentIndex: nextIndex, turn: nextTurn, wyrChoice: null });
        } else {
            setIsFinished(true);
            if (isRemote) updateState({ scores: newScores, isFinished: true });

            // Save journey progress - use journey ID from URL directly
            if (journeyId) {
                const currentProgress = progressMap[journeyId]?.completed_steps || 0;
                const newProgress = Math.max(currentProgress, stepNumber);
                await updateProgress(journeyId, newProgress);
            }
        }
    };

    const getModeIcon = () => {
        switch (mode) {
            case 'truth-or-dare': return <Flame className="w-6 h-6 text-red-400" />;
            case 'compliment-battle': return <Trophy className="w-6 h-6 text-yellow-400" />;
            case 'would-you-rather': return <Zap className="w-6 h-6 text-amber-400" />;
            case 'memory-lane': return <Camera className="w-6 h-6 text-blue-400" />;
            case 'love-roulette': return <RefreshCw className="w-6 h-6 text-green-400" />;
            default: return <MessageCircle className="w-6 h-6 text-primary-400" />;
        }
    };



    // --- FINISHED SCREEN ---
    if (isFinished) {
        const journeyId = searchParams.get('journey');
        const nextStep = stepNumber + 1;

        return (
            <main className={`min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900'}`}>
                <div className={`absolute inset-0 opacity-50 pointer-events-none ${theme === 'light' ? 'bg-gradient-to-b from-rose-100/50 to-transparent' : 'bg-gradient-to-b from-rose-900/20 to-transparent '}`} />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`backdrop-blur-xl p-8 rounded-3xl border max-w-md w-full ${theme === 'light' ? 'bg-white/80 border-slate-200 shadow-xl' : 'bg-surface-800/80 border-white/10'}`}>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className={`text-3xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>يعطيكم العافية! ✨</h2>
                    {mode === 'compliment-battle' && (
                        <div className={`mb-6 p-4 rounded-xl ${theme === 'light' ? 'bg-slate-100' : 'bg-surface-700/50'}`}>
                            <p className={`mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>النتيجة النهائية:</p>
                            <div className="flex justify-center gap-8 text-2xl font-bold">
                                <span className="text-rose-400">أنا: {scores.p1}</span>
                                <span className="text-blue-400">شريكي: {scores.p2}</span>
                            </div>
                        </div>
                    )}
                    <p className={`mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>خلصتوا تمرين اليوم. نتمنى لكم حوار مثمر وقرب أكثر.</p>

                    <div className="space-y-3">
                        {journeyId && (
                            <button
                                onClick={() => {
                                    window.location.href = `/game-session?mode=${mode}&step=${nextStep}&journey=${journeyId}`;
                                }}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                التمرين التالي ←
                            </button>
                        )}
                        <button
                            onClick={() => {
                                window.location.href = '/journeys';
                            }}
                            className={`w-full py-4 rounded-2xl font-bold transition-colors ${theme === 'light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-surface-700 hover:bg-surface-600 text-white'}`}
                        >
                            العودة للرحلة
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

    if (!question) {
        return <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50 text-slate-500' : 'bg-surface-900 text-white'}`}>جاري التحميل...</div>;
    }

    // --- RENDER GAME CONTENT BASED ON MODE ---
    const renderGameContent = () => {
        switch (mode) {
            // ========================
            // WOULD YOU RATHER - 2 Options
            // ========================
            case 'would-you-rather':
                return (
                    <div className="space-y-6">
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setWyrChoice('A'); }}
                            className={`w-full p-6 rounded-2xl border-2 transition-all text-right ${wyrChoice === 'A'
                                ? 'bg-rose-500/30 border-rose-500 ring-2 ring-rose-500/50'
                                : theme === 'light'
                                    ? 'bg-white border-slate-200 hover:border-rose-500/50 shadow-sm'
                                    : 'bg-surface-800/60 border-surface-700 hover:border-rose-500/50'}`}
                            dir="rtl"
                        >
                            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{question.optionA}</h3>
                        </motion.button>

                        <div className="flex items-center justify-center">
                            <span className="bg-surface-700 text-surface-300 px-4 py-1 rounded-full text-sm font-bold">أو</span>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setWyrChoice('B'); }}
                            className={`w-full p-6 rounded-2xl border-2 transition-all text-right ${wyrChoice === 'B'
                                ? 'bg-blue-500/30 border-blue-500 ring-2 ring-blue-500/50'
                                : theme === 'light'
                                    ? 'bg-white border-slate-200 hover:border-blue-500/50 shadow-sm'
                                    : 'bg-surface-800/60 border-surface-700 hover:border-blue-500/50'}`}
                            dir="rtl"
                        >
                            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{question.optionB}</h3>
                        </motion.button>

                        {wyrChoice && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleNext}
                                className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-bold mt-4 shadow-lg hover:scale-[1.02] transition-transform"
                            >
                                السؤال التالي <ChevronRight className="inline w-5 h-5 transform rotate-180" />
                            </motion.button>
                        )}
                    </div>
                );

            // ========================
            // TRUTH OR DARE - HIGH TENSION REDESIGN
            // ========================
            case 'truth-or-dare':
                // HELPER: Animated Background Particles (Simple Dots)
                const Particle = ({ delay, color }: { delay: number, color: string }) => (
                    <motion.div
                        initial={{ y: 0, opacity: 0 }}
                        animate={{ y: -100, opacity: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
                        className={`absolute w-2 h-2 rounded-full ${color}`}
                        style={{ left: `${Math.random() * 100}%`, bottom: '0%' }}
                    />
                );

                // STATE: If no choice made yet, show the SPLIT SCREEN DUEL
                if (!todChoice) {
                    return (
                        <div className="relative h-[70vh] w-full flex flex-col md:flex-row gap-4 overflow-hidden rounded-3xl">
                            {/* TURN INDICATOR - Floating UI */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-black/40 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl"
                                >
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${turn === 'p1' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                    <span className="text-white font-bold tracking-wider text-sm">
                                        {turn === 'p1' ? 'دورك أنت' : 'دور الشريك'}
                                    </span>
                                </motion.div>
                            </div>

                            {/* TRUTH ZONE (ICE) */}
                            <motion.button
                                whileHover={{ flex: 1.5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const t = truths?.length > 0 ? truths : (currentQuestions || []);
                                    const randomTruth = t[Math.floor(Math.random() * t.length)];
                                    setTodChoice('TRUTH');
                                    setTodCurrentChallenge(randomTruth);
                                }}
                                className="relative flex-1 bg-gradient-to-b from-cyan-900 to-blue-950 flex flex-col items-center justify-center group overflow-hidden border-2 border-transparent hover:border-cyan-400/30 transition-all duration-500 rounded-2xl md:rounded-l-3xl md:rounded-r-none"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                {/* Ice Glow */}
                                <div className="absolute inset-0 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="z-10 flex flex-col items-center gap-6 transform group-hover:scale-110 transition-transform duration-300">
                                    <div className="p-6 rounded-full bg-cyan-500/20 ring-4 ring-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                                        <MessageCircle className="w-16 h-16 text-cyan-300" />
                                    </div>
                                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400 uppercase tracking-widest">
                                        صـراحـة
                                    </h2>
                                    <p className="text-cyan-300/60 font-medium text-sm tracking-wide">اكتشف الحقائق المخفية</p>
                                </div>

                                {/* Floating Ice Particles */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {[...Array(5)].map((_, i) => <Particle key={i} delay={i * 0.5} color="bg-cyan-200/30" />)}
                                </div>
                            </motion.button>

                            {/* VS BADGE (Desktop Only) */}
                            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 bg-white rounded-full items-center justify-center font-black text-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                                VS
                            </div>

                            {/* DARE ZONE (FIRE) */}
                            <motion.button
                                whileHover={{ flex: 1.5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    const d = dares?.length > 0 ? dares : (currentQuestions || []);
                                    const randomDare = d[Math.floor(Math.random() * d.length)];
                                    setTodChoice('DARE');
                                    setTodCurrentChallenge(randomDare);
                                }}
                                className="relative flex-1 bg-gradient-to-b from-orange-900 to-red-950 flex flex-col items-center justify-center group overflow-hidden border-2 border-transparent hover:border-red-400/30 transition-all duration-500 rounded-2xl md:rounded-r-3xl md:rounded-l-none"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                {/* Fire Glow */}
                                <div className="absolute inset-0 bg-red-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="z-10 flex flex-col items-center gap-6 transform group-hover:scale-110 transition-transform duration-300">
                                    <div className="p-6 rounded-full bg-red-500/20 ring-4 ring-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                                        <Flame className="w-16 h-16 text-red-300 animate-[pulse_3s_ease-in-out_infinite]" />
                                    </div>
                                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-red-400 uppercase tracking-widest">
                                        تــحــدي
                                    </h2>
                                    <p className="text-red-300/60 font-medium text-sm tracking-wide">واجه الخوف والشجاعة</p>
                                </div>

                                {/* Floating Embers */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {[...Array(5)].map((_, i) => <Particle key={i} delay={i * 0.7} color="bg-orange-400/30" />)}
                                </div>
                            </motion.button>
                        </div>
                    );
                }

                // REVEAL SCREEN - Cinema Style
                return (
                    <div className="relative py-8 px-4">
                        {/* Dramatic Backdrop Glow based on choice */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-[100px] -z-10 opacity-40 pointer-events-none ${todChoice === 'DARE' ? 'bg-red-600' : 'bg-cyan-600'}`} />

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 100 }}
                            className="relative max-w-sm mx-auto perspective-1000"
                        >
                            {/* The Card */}
                            <div className={`
                                relative p-8 rounded-[2rem] border-2 shadow-2xl overflow-hidden
                                ${todChoice === 'DARE'
                                    ? 'bg-gradient-to-br from-red-950 via-red-900 to-black border-red-500/30 shadow-red-900/50'
                                    : 'bg-gradient-to-br from-cyan-950 via-blue-900 to-black border-cyan-500/30 shadow-cyan-900/50'}
                            `}>
                                {/* Card Texture */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

                                {/* Header Badge */}
                                <div className="flex justify-center mb-8">
                                    <div className={`
                                        px-6 py-2 rounded-full font-black tracking-widest text-sm uppercase flex items-center gap-2 border
                                        ${todChoice === 'DARE' ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'}
                                    `}>
                                        {todChoice === 'DARE' ? <><Flame className="w-4 h-4" /> تحدي ناري</> : <><MessageCircle className="w-4 h-4" /> صراحة صادمة</>}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center space-y-6 relative z-10">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-md" dir="rtl">
                                        "{todCurrentChallenge?.text || question.text}"
                                    </h2>
                                    <div className="w-12 h-1 bg-surface-700/50 mx-auto rounded-full" />
                                    <p className="text-surface-400 font-medium text-sm bg-black/20 inline-block px-4 py-2 rounded-lg">
                                        💡 {todCurrentChallenge?.hint || question.hint}
                                    </p>
                                </div>

                                {/* Decorative Corner Icons */}
                                <div className="absolute top-4 right-4 opacity-10 rotate-12">
                                    {todChoice === 'DARE' ? <Flame className="w-24 h-24 text-red-500" /> : <MessageCircle className="w-24 h-24 text-cyan-500" />}
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-4 max-w-sm mx-auto mt-8"
                        >
                            <button
                                onClick={() => {
                                    setTodChoice(null);
                                    setTodCurrentChallenge(null);
                                    setTurn(prev => prev === 'p1' ? 'p2' : 'p1');
                                }}
                                className="flex-1 py-4 bg-surface-800/80 backdrop-blur text-surface-400 hover:text-white rounded-2xl font-bold border border-white/5 transition-all hover:bg-surface-700"
                            >
                                تخطي ⏭️
                            </button>
                            <button
                                onClick={() => {
                                    setTodChoice(null);
                                    setTodCurrentChallenge(null);
                                    setTurn(prev => prev === 'p1' ? 'p2' : 'p1');
                                }}
                                className={`
                                    flex-[2] py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all
                                    ${todChoice === 'DARE' ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-red-900/30' : 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-900/30'}
                                `}
                            >
                                <Check className="w-6 h-6" /> تــم التنفيــذ!
                            </button>
                        </motion.div>
                    </div>
                );

            // ========================
            // COMPLIMENT BATTLE - Scoring System
            // ========================
            case 'compliment-battle':
                return (
                    <div className="text-center space-y-8">
                        {/* Scoreboard */}
                        <div className={`flex justify-between items-center p-6 backdrop-blur-xl rounded-3xl border shadow-xl relative overflow-hidden ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-800/80 border-white/10'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-blue-500/5" />
                            <motion.div
                                animate={turn === 'p1' ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 0.5 }}
                                className="text-center relative z-10"
                            >
                                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>أنا</p>
                                <p className="text-4xl font-black text-rose-400 drop-shadow-lg">{scores.p1}</p>
                            </motion.div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-500/30 blur-xl rounded-full" />
                                <Trophy className="w-12 h-12 text-yellow-400 relative z-10" />
                            </div>

                            <motion.div
                                animate={turn === 'p2' ? { scale: 1.1, opacity: 1 } : { scale: 1, opacity: 0.5 }}
                                className="text-center relative z-10"
                            >
                                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>شريكي</p>
                                <p className="text-4xl font-black text-blue-400 drop-shadow-lg">{scores.p2}</p>
                            </motion.div>
                        </div>

                        <div className={`inline-block py-2 px-6 rounded-full ${turn === 'p1' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'} text-sm font-bold shadow-lg`}>
                            {turn === 'p1' ? 'الدور عليك ✨' : 'دور الشريك 👤'}
                        </div>

                        <div className="py-4">
                            <h2 className={`text-3xl font-bold leading-relaxed mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} dir="rtl">{question.text}</h2>
                            <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>{question.hint}</p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => addScore('p1')} className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-2xl font-bold border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-center gap-2 transition-all active:scale-95">
                                <ThumbsUp className="w-5 h-5" /> نقطة لي
                            </button>
                            <button onClick={() => addScore('p2')} className="flex-1 py-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-2xl font-bold border border-blue-500/30 hover:border-blue-500/50 flex items-center justify-center gap-2 transition-all active:scale-95">
                                <ThumbsUp className="w-5 h-5" /> نقطة للشريك
                            </button>
                        </div>
                    </div>
                );

            // ========================
            // LOVE ROULETTE - Spin to Reveal
            // ========================
            case 'love-roulette':
                return (
                    <div className="text-center space-y-8">
                        {!spinResult ? (
                            <>
                                <div className="relative w-64 h-64 mx-auto">
                                    {/* Main Glow */}
                                    <div className="absolute inset-0 bg-green-500/30 blur-[40px] rounded-full" />

                                    <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-emerald-700 rounded-full flex items-center justify-center shadow-2xl border-[6px] border-white/10 ring-4 ring-black/20">
                                        <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-full animate-[spin_8s_linear_infinite]" />

                                        <motion.div
                                            animate={isSpinning ? { rotate: 360 * 5, scale: [1, 0.9, 1.1, 1] } : { rotate: 0 }}
                                            transition={{ duration: 2.5, ease: "circOut" }}
                                            className="bg-white/10 p-5 rounded-full backdrop-blur-md shadow-inner"
                                        >
                                            <RefreshCw className="w-16 h-16 text-white drop-shadow-md" />
                                        </motion.div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSpin}
                                    disabled={isSpinning}
                                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl disabled:opacity-50 shadow-lg shadow-green-900/30 hover:scale-[1.02] transition-transform"
                                >
                                    {isSpinning ? 'جاري الدوران...' : 'لف العجلة! 🎲'}
                                </button>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                className="space-y-8 relative max-w-sm mx-auto"
                            >
                                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full -z-10" />

                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-900/30 ring-4 ring-white/10">
                                    <Heart className="w-12 h-12 text-white fill-white/20 animate-pulse" />
                                </div>

                                <div className={`p-8 rounded-3xl border shadow-2xl ${theme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-surface-800/80 backdrop-blur-xl border-white/10'}`}>
                                    <h2 className={`text-3xl font-black mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} dir="rtl">{spinResult.text}</h2>
                                    <p className={`font-medium text-lg ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>{spinResult.hint}</p>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setSpinResult(null)} className="flex-1 py-4 bg-surface-700/50 hover:bg-surface-700 text-white rounded-2xl font-medium transition-colors border border-white/5">
                                        لف مرة ثانية
                                    </button>
                                    <button onClick={() => router.push('/play')} className="flex-1 py-4 bg-white text-green-700 rounded-2xl font-bold shadow-lg hover:bg-green-50 transition-colors">
                                        خلاص ✓
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );

            // ========================
            // MEMORY LANE - Photo Prompt
            // ========================
            case 'memory-lane':
                return (
                    <div className="text-center space-y-8">
                        <div className="w-32 h-32 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center border-4 border-dashed border-blue-500/30 relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            <Camera className="w-16 h-16 text-blue-400 relative z-10" />
                        </div>
                        <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-surface-800/50 border-white/5'}`}>
                            <h2 className={`text-2xl font-bold leading-relaxed mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} dir="rtl">{question.text}</h2>
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{question.hint}</p>
                        </div>
                        <button onClick={handleNext} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform">
                            التالي <ChevronRight className="inline w-5 h-5 transform rotate-180" />
                        </button>
                    </div>
                );

            // ========================
            // COUPLE QUIZ BATTLE
            // ========================
            case 'couple-quiz':
                return (
                    <div className="space-y-6">
                        {/* Score Display */}
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-primary-400">{currentIndex + 1}</div>
                                <div className={`text-sm ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`}>/{currentQuestions.length}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-400">⭐ {quizScore}</div>
                                <div className={`text-sm ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`}>النتيجة</div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-8 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-gradient-to-br from-surface-800/80 to-surface-800/50 border-surface-700/50'}`}
                        >
                            <h2 className={`text-2xl md:text-3xl font-bold text-center mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} dir="rtl">
                                {question.question}
                            </h2>
                            <p className={`text-sm text-center mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{question.hint}</p>

                            {/* Options */}
                            <div className="grid gap-4">
                                {question.options?.map((option: string, idx: number) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            if (!showAnswer) {
                                                setSelectedAnswer(option);
                                                setShowAnswer(true);
                                            }
                                        }}
                                        disabled={showAnswer}
                                        className={`p-5 rounded-xl border-2 transition-all text-lg font-medium text-right
                                            ${showAnswer && selectedAnswer === option
                                                ? 'border-primary-500 bg-primary-500/20 ring-2 ring-primary-500/30'
                                                : showAnswer
                                                    ? 'border-surface-700 bg-surface-800/30 opacity-50 cursor-not-allowed'
                                                    : theme === 'light'
                                                        ? 'border-slate-200 hover:border-primary-500/50 hover:bg-slate-50 cursor-pointer'
                                                        : 'border-surface-700 hover:border-primary-500/50 hover:bg-surface-700/50 cursor-pointer'
                                            }`}
                                        dir="rtl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option}</span>
                                            {showAnswer && selectedAnswer === option && <span>✓</span>}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Answer Reveal */}
                            {showAnswer && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center"
                                >
                                    <p className="text-blue-400 mb-3">⏳ الشريك يختار الإجابة الصحيحة</p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                setQuizScore(quizScore + 1);
                                                setShowAnswer(false);
                                                setSelectedAnswer(null);
                                                handleNext();
                                            }}
                                            className="px-6 py-2 bg-green-500 rounded-lg hover:bg-green-600 font-bold"
                                        >
                                            ✓ صحيح
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAnswer(false);
                                                setSelectedAnswer(null);
                                                handleNext();
                                            }}
                                            className="px-6 py-2 bg-red-500/80 rounded-lg hover:bg-red-500 font-bold"
                                        >
                                            ✗ خطأ
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                );

            // ========================
            // MINUTE TO WIN IT
            // ========================
            case 'minute-challenges':
                return (
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-8 rounded-3xl border border-orange-500/30"
                        >
                            {/* Challenge Title */}
                            <div className="text-center mb-6">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2" dir="rtl">
                                    {question.title}
                                </h2>
                                <p className="text-xl text-surface-200 mb-4" dir="rtl">
                                    {question.description}
                                </p>
                                <p className="text-sm text-orange-400">💡 {question.hint}</p>
                            </div>

                            {/* Timer Display */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center transition-all
                                        ${timerRunning
                                            ? timeLeft > 10
                                                ? 'border-primary-500 animate-pulse'
                                                : 'border-red-500 animate-bounce'
                                            : timeLeft === 0
                                                ? 'border-green-500'
                                                : 'border-surface-700'
                                        }`}
                                    >
                                        <span className="text-6xl font-bold">
                                            {timeLeft}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-surface-400">
                                        {timerRunning ? 'جاري...' : timeLeft === 0 ? 'انتهى!' : 'جاهز'}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4">
                                {!timerRunning && timeLeft === 60 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setTimerRunning(true)}
                                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:from-orange-600 hover:to-red-600 text-xl font-bold shadow-lg"
                                    >
                                        🚀 ابدأ التحدي!
                                    </motion.button>
                                )}

                                {timeLeft === 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                setTimeLeft(60);
                                                setTimerRunning(false);
                                            }}
                                            className="py-3 bg-surface-700 rounded-xl hover:bg-surface-600 font-bold"
                                        >
                                            🔄 إعادة
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTimeLeft(60);
                                                setTimerRunning(false);
                                                handleNext();
                                            }}
                                            className="py-3 bg-primary-500 rounded-xl hover:bg-primary-600 font-bold"
                                        >
                                            التالي ⏭
                                        </button>
                                    </div>
                                )}

                                {timerRunning && (
                                    <button
                                        onClick={() => setTimerRunning(false)}
                                        className="py-3 bg-red-500/80 rounded-xl hover:bg-red-500 font-bold"
                                    >
                                        ⏸ إيقاف
                                    </button>
                                )}
                            </div>

                            {/* Goal */}
                            {question.goal && (
                                <div className="mt-6 p-4 bg-surface-800/50 rounded-xl text-center">
                                    <span className="text-sm text-surface-400">الهدف: </span>
                                    <span className="text-white font-bold">{question.goal}</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                );

            // ========================
            // DEFAULT: Deep Questions / Values (Standard Q&A)
            // ========================
            default:
                return (
                    <div className="text-center space-y-6">
                        {question.phase && (
                            <div className="inline-block px-4 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-300 text-sm font-bold">
                                {question.phase}
                            </div>
                        )}
                        <h2 className="text-2xl md:text-3xl font-serif text-white leading-tight" dir="rtl">{question.text}</h2>
                        <p className="text-surface-400 text-sm">{question.hint}</p>

                        {question.points && question.points.length > 0 && (
                            <div className="bg-surface-800/50 p-5 rounded-2xl border border-surface-700/50 text-right" dir="rtl">
                                <h3 className="text-xs font-medium text-surface-400 mb-3 uppercase">نقاط للتفكير</h3>
                                <ul className="space-y-2 text-surface-200 text-sm">
                                    {question.points.map((point: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Star className="w-3 h-3 text-rose-400 mt-1 shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button onClick={handleNext} className="w-full py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-2xl font-bold hover:scale-[1.02] transition-transform">
                            التالي <ChevronRight className="inline w-5 h-5 transform rotate-180" />
                        </button>
                    </div>
                );
        }
    };

    // Handle finish button click
    const handleFinish = async () => {
        setIsFinished(true);

        // Save journey progress
        if (journeyId) {
            const currentProgress = progressMap[journeyId]?.completed_steps || 0;
            const newProgress = Math.max(currentProgress, stepNumber);
            await updateProgress(journeyId, newProgress);
        }
    };

    return (
        <main className="min-h-screen bg-surface-900 flex flex-col relative overflow-hidden">
            {/* Simple Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 bg-gradient-to-b from-primary-900/20 to-transparent opacity-50" />
            </div>

            {/* Header */}
            <header className="p-4 flex items-center justify-between z-10">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-surface-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 transform rotate-180" />
                </button>
                <div className="flex items-center gap-2">
                    {getModeIcon()}
                    <span className="text-white font-bold text-sm">{getModeTitle()}</span>
                </div>
                <div className="w-10" />
            </header>

            {/* Main Content */}
            {/* Main Content */}
            <div className={`flex-1 flex flex-col justify-center px-6 ${isRemote ? 'pb-48' : 'pb-32'} z-10`}>
                <AnimatePresence mode="wait">
                    {(!isRemote || (isRemote && isConnected) || (isRemote && sessionMode === 'local')) ? (
                        <motion.div
                            key={question?.id || currentIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md mx-auto"
                        >
                            {renderGameContent()}
                        </motion.div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Users className="w-10 h-10 text-primary-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">في انتظار الشريك...</h2>
                            <p className="text-surface-400">تم إرسال دعوة لشريكك للانضمام للجلسة</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Overlay */}
            {isRemote && session && user && (
                <SessionChat
                    sessionId={session.id}
                    userId={user.id}
                    partnerName={isConnected ? 'Partner' : undefined}
                />
            )}

            {/* Session Mode Modal */}
            <SessionModeModal
                isOpen={showModeModal}
                onSelectMode={handleModeSelect}
                onClose={() => setShowModeModal(false)}
            />
        </main>
    );
}

export default function GameSessionPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-surface-400">Loading...</p>
                </div>
            </main>
        }>
            <GameSessionContent />
        </Suspense>
    );
}


