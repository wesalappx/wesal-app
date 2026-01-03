'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw,
    MessageCircle,
    Zap,
    Trophy,
    Flame,
    ArrowLeft,
    ArrowRight,
    Camera,
    Gamepad2,
    Lock,
    Crown,
    Sparkles,
    Users,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from '@/hooks/useTranslation';
import { useTierLimits } from '@/hooks/useTierLimits';
import { useSettingsStore } from '@/stores/settings-store';
import SessionModeModal from '@/components/SessionModeModal';
import SessionModeIndicator from '@/components/SessionModeIndicator';
import { usePairing } from '@/hooks/usePairing';

// Game Types
type GameType = 'would-you-rather' | 'compliment-battle' | 'memory-lane' | 'deep-questions' | 'love-roulette' | 'truth-or-dare' | 'couple-quiz' | 'minute-challenges' | null;

interface GameCard {
    id: string;
    type: GameType;
    title: string;
    description: string;
    icon: any;
    color: string;
    bgGradient: string;
}

export default function PlayPage() {
    const { playSound } = useSound();
    const router = useRouter();
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';
    const { isGameAvailable, canUse, trackUsage, isPremium } = useTierLimits();

    const [sessionUsage, setSessionUsage] = useState<{ remaining: number; limit: number } | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const [selectedLockedGame, setSelectedLockedGame] = useState<string | null>(null);
    const [showModeModal, setShowModeModal] = useState(false);

    // Store
    const { preferredSessionMode, setPreferredSessionMode } = useSettingsStore();

    // Check Preference on Mount
    useEffect(() => {
        if (!preferredSessionMode) {
            setShowModeModal(true);
        }
    }, [preferredSessionMode]);

    // Fetch session usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            const usage = await canUse('game_sessions');
            if (usage.limit > 0) {
                setSessionUsage({ remaining: usage.remaining, limit: usage.limit });
            }
        };
        fetchUsage();
    }, [canUse]);


    // Active Session & Pairing Logic
    const { getStatus } = usePairing();
    const [activeSession, setActiveSession] = useState<any | null>(null);
    const [rejectedSessions, setRejectedSessions] = useState<string[]>([]);

    useEffect(() => {
        const checkStatus = async () => {
            const status = await getStatus();

            if (status.isPaired && status.coupleId) {
                const supabase = await import('@/lib/supabase/client').then(m => m.createClient());

                // Check for active GAME session
                const { data } = await supabase
                    .from('active_sessions')
                    .select('*')
                    .eq('couple_id', status.coupleId)
                    .eq('activity_type', 'game') // Only games here
                    .maybeSingle();

                if (data && !rejectedSessions.includes(data.id)) {
                    setActiveSession(data);
                }

                const channel = supabase.channel('games_hub')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'active_sessions',
                        filter: `couple_id=eq.${status.coupleId}`
                    }, (payload) => {
                        if (payload.new && (payload.new as any).activity_type === 'game') {
                            const newSession = payload.new as any;
                            if (!rejectedSessions.includes(newSession.id)) {
                                setActiveSession(newSession);
                                playSound('pop');
                            }
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
    }, [rejectedSessions]); // Re-run if rejected list changes? No, filter inside. Actually effect dep is tricky.

    // Better way: Filter in render or use effect to update activeSession based on rejectedSessions
    useEffect(() => {
        if (activeSession && rejectedSessions.includes(activeSession.id)) {
            setActiveSession(null);
        }
    }, [rejectedSessions, activeSession]);


    const handleJoinSession = () => {
        if (!activeSession) return;
        playSound('success');
        // Navigate to the specific game mode
        // Assuming activity_id is the game mode? Or activity_id is 'game'? 
        // In useSessionSync for games: activityType='game', activityId=mode (e.g. 'values')
        const gameMode = activeSession.activity_id;
        router.push(`/game-session?mode=${gameMode}`);
    };

    const handleRejectSession = () => {
        if (!activeSession) return;
        setRejectedSessions(prev => [...prev, activeSession.id]);
        setActiveSession(null);
    };

    const { theme } = useSettingsStore();

    // Games array with theme-aware styling logic handled in render
    const games: GameCard[] = [
        { id: '1', type: 'would-you-rather', title: t('play.wyr'), description: t('play.wyrDesc'), icon: Zap, color: 'text-amber-400', bgGradient: 'from-amber-500/20 to-orange-500/10' },
        { id: '2', type: 'compliment-battle', title: t('play.compliment'), description: t('play.complimentDesc'), icon: Trophy, color: 'text-rose-400', bgGradient: 'from-rose-500/20 to-pink-500/10' },
        { id: '3', type: 'love-roulette', title: t('play.roulette'), description: t('play.rouletteDesc'), icon: RefreshCw, color: 'text-green-400', bgGradient: 'from-green-500/20 to-emerald-500/10' },
        { id: '4', type: 'deep-questions', title: t('play.deep'), description: t('play.deepDesc'), icon: MessageCircle, color: 'text-purple-400', bgGradient: 'from-purple-500/20 to-violet-500/10' },
        { id: '5', type: 'memory-lane', title: t('play.memory'), description: t('play.memoryDesc'), icon: Camera, color: 'text-blue-400', bgGradient: 'from-blue-500/20 to-cyan-500/10' },
        { id: '6', type: 'truth-or-dare', title: t('play.tod'), description: t('play.todDesc'), icon: Flame, color: 'text-red-400', bgGradient: 'from-red-600/20 to-orange-600/10' },
        { id: '7', type: 'couple-quiz', title: isRTL ? 'معركة الأسئلة' : 'Couple Quiz', description: isRTL ? 'اختبر معرفتك بشريكك (50 سؤال)' : 'Test your partner knowledge (50 questions)', icon: Gamepad2, color: 'text-cyan-400', bgGradient: 'from-cyan-500/20 to-blue-500/10' },
        { id: '8', type: 'minute-challenges', title: isRTL ? 'تحدي الدقيقة' : 'Minute Challenges', description: isRTL ? 'تحديات مرحة في 60 ثانية' : 'Fun challenges in 60 seconds', icon: Zap, color: 'text-orange-400', bgGradient: 'from-orange-500/20 to-red-500/10' },
    ];

    const handleGameSelect = async (type: GameType, title: string) => {
        playSound('click');
        if (!type) return;

        // Check if game is available for this tier
        if (!isGameAvailable(type)) {
            setSelectedLockedGame(title);
            setShowUpgradePrompt(true);
            return;
        }

        // Check session limit
        const usage = await canUse('game_sessions');
        if (!usage.canUse && usage.limit > 0) {
            setShowUpgradePrompt(true);
            return;
        }

        // Track usage
        const trackResult = await trackUsage('game_sessions');
        if (trackResult.remaining >= 0) {
            setSessionUsage({ remaining: trackResult.remaining, limit: usage.limit });
        }

        router.push(`/game-session?mode=${type}`);
    };

    return (
        <main className={`min-h-screen p-4 pb-44 relative overflow-hidden font-sans transition-colors duration-500 ${theme === 'light'
            ? 'bg-gradient-to-br from-slate-50 via-white to-orange-50/30'
            : 'bg-surface-950'
            }`}>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] animate-pulse ${theme === 'light' ? 'bg-orange-200/20' : 'bg-primary-500/5'
                    }`} />
                <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] animate-pulse delay-1000 ${theme === 'light' ? 'bg-indigo-200/20' : 'bg-accent-500/5'
                    }`} />
            </div>

            <div className="max-w-md mx-auto pt-4 h-full min-h-[80vh]">
                <AnimatePresence mode="wait">
                    <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/dashboard" className={`inline-flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-surface-400 hover:text-white'
                                }`}>
                                <ArrowRight className={`w-5 h-5 ${!isRTL && 'rotate-180'}`} />
                                {t('common.back')}
                            </Link>

                            <div className="flex items-center gap-2">
                                {/* Mode Indicator */}
                                <SessionModeIndicator onClick={() => setShowModeModal(true)} />

                                {/* Session Usage Badge */}
                                {sessionUsage && sessionUsage.limit > 0 && (
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${sessionUsage.remaining <= 1
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : theme === 'light'
                                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                            : 'bg-surface-700/50 text-surface-300'
                                        }`}>
                                        {isRTL ? `${sessionUsage.remaining}/${sessionUsage.limit} جلسات` : `${sessionUsage.remaining}/${sessionUsage.limit} sessions`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className={`text-3xl font-bold bg-clip-text text-transparent mb-2 ${theme === 'light'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : 'bg-gradient-to-r from-amber-200 to-yellow-400'
                            }`}>
                            {t('play.title')}
                        </h1>

                        {/* Active Session Banner */}
                        <AnimatePresence>
                            {activeSession && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-6 overflow-hidden"
                                >
                                    <div className={`p-4 rounded-2xl flex items-center justify-between backdrop-blur-md border ${theme === 'light'
                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 shadow-lg shadow-green-500/10'
                                        : 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center animate-pulse ${theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'
                                                }`}>
                                                <Users className={`w-5 h-5 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                                    {isRTL ? 'جلسة نشطة مع الشريك' : 'Partner is Playing'}
                                                </h3>
                                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-green-200'}`}>
                                                    {isRTL ? 'شريكك بانتظارك!' : 'Join them now!'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleRejectSession}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white/50 hover:bg-white text-slate-400' : 'bg-black/20 hover:bg-black/40 text-white/60'}`}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleJoinSession}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                            >
                                                {isRTL ? 'انضمام' : 'Join'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className={`mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {t('play.subtitle')}
                        </p>

                        <div className="grid gap-4">
                            {games.map((game, idx) => {
                                const isLocked = !isGameAvailable(game.type || '');

                                return (
                                    <motion.button
                                        key={game.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ scale: isLocked ? 1 : 1.02 }}
                                        whileTap={{ scale: isLocked ? 1 : 0.98 }}
                                        onClick={() => handleGameSelect(game.type, game.title)}
                                        className={`relative w-full p-4 rounded-2xl text-right flex items-center gap-4 group transition-all border ${theme === 'light'
                                            ? isLocked
                                                ? 'bg-slate-50 border-slate-100 opacity-70'
                                                : 'bg-white border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-orange-200/50'
                                            : isLocked
                                                ? `bg-gradient-to-r ${game.bgGradient} border-white/5 opacity-70`
                                                : `bg-gradient-to-r ${game.bgGradient} border-white/5 hover:border-white/10`
                                            } ${isLocked ? 'cursor-pointer' : ''}`}
                                    >
                                        {/* Lock overlay for premium games */}
                                        {isLocked && (
                                            <div className={`absolute inset-0 rounded-2xl backdrop-blur-[1px] flex items-center justify-center ${theme === 'light' ? 'bg-white/40' : 'bg-surface-900/40'
                                                }`}>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-500 text-sm font-medium">
                                                    <Crown className="w-4 h-4" />
                                                    <span>Premium</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${!isLocked && 'group-hover:scale-110'} ${theme === 'light'
                                            ? 'bg-slate-50 shadow-sm'
                                            : `bg-surface-900/50`
                                            }`}>
                                            {isLocked
                                                ? <Lock className={`w-6 h-6 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                                : <game.icon className={`w-6 h-6 ${theme === 'light'
                                                    ? game.color.replace('text-', 'text-')
                                                    : game.color
                                                    }`} />
                                            }
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg mb-1 ${theme === 'light' ? 'text-slate-800' : game.color
                                                }`}>{game.title}</h3>
                                            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'
                                                }`}>{game.description}</p>
                                        </div>
                                        <ArrowLeft className={`w-5 h-5 transition-colors ${theme === 'light'
                                            ? 'text-slate-300 group-hover:text-slate-500'
                                            : 'text-surface-500 group-hover:text-white'
                                            }`} />
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Premium Banner for Free Users */}
                        {!isPremium && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className={`mt-8 p-4 rounded-2xl border ${theme === 'light'
                                    ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-200'
                                    : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-amber-100' : 'bg-amber-500/30'
                                        }`}>
                                        <Crown className={`w-5 h-5 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium text-sm ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'
                                            }`}>
                                            {isRTL ? 'افتح جميع الألعاب' : 'Unlock All Games'}
                                        </p>
                                        <p className={`text-xs ${theme === 'light' ? 'text-amber-600' : 'text-amber-400/70'
                                            }`}>
                                            {isRTL ? '8+ لعبة مع جلسات غير محدودة' : '8+ games with unlimited sessions'}
                                        </p>
                                    </div>
                                    <Link
                                        href="/settings/upgrade"
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-600 transition-colors"
                                    >
                                        {isRTL ? 'ترقية' : 'Upgrade'}
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Session Mode Modal */}
                <SessionModeModal
                    isOpen={showModeModal}
                    onClose={() => {
                        // If closing without picking, maybe fallback or ensure logic handles it?
                        // Ideally modal shouldn't be closable if forced? But user can just browse.
                        setShowModeModal(false);
                    }}
                    onSelectMode={(mode) => {
                        setPreferredSessionMode(mode);
                        setShowModeModal(false);
                        playSound('success');
                    }}
                    rememberChoice={true} // Force remember in this context
                />
            </div>

            {/* Upgrade Prompt Modal */}
            <AnimatePresence>
                {showUpgradePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setShowUpgradePrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded-3xl p-6 max-w-sm w-full text-center border ${theme === 'light'
                                ? 'bg-white border-slate-100 shadow-2xl'
                                : 'bg-surface-800 border-white/10'
                                }`}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {selectedLockedGame
                                    ? (isRTL ? 'لعبة Premium' : 'Premium Game')
                                    : (isRTL ? 'انتهت جلسات اليوم' : 'Daily Sessions Used')
                                }
                            </h3>
                            <p className={`mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {selectedLockedGame
                                    ? (isRTL
                                        ? `"${selectedLockedGame}" متاحة فقط لمشتركين Premium`
                                        : `"${selectedLockedGame}" is only available for Premium subscribers`)
                                    : (isRTL
                                        ? 'اشترك في Premium للعب بلا حدود'
                                        : 'Upgrade to Premium for unlimited game sessions')
                                }
                            </p>
                            <Link
                                href="/settings/upgrade"
                                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold mb-3 shadow-lg shadow-primary-500/20"
                            >
                                {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
                            </Link>
                            <button
                                onClick={() => {
                                    setShowUpgradePrompt(false);
                                    setSelectedLockedGame(null);
                                }}
                                className={`text-sm ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-surface-500 hover:text-surface-300'}`}
                            >
                                {isRTL ? 'لاحقاً' : 'Maybe Later'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
