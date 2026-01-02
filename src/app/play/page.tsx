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
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from '@/hooks/useTranslation';
import { useTierLimits } from '@/hooks/useTierLimits';

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

    // Games array with translations
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
        <main className="min-h-screen p-4 pb-44 relative overflow-hidden font-sans">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md mx-auto pt-4 h-full min-h-[80vh]">
                <AnimatePresence mode="wait">
                    <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center justify-between mb-6">
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-surface-400 hover:text-white">
                                <ArrowRight className={`w-5 h-5 ${!isRTL && 'rotate-180'}`} />
                                {t('common.back')}
                            </Link>

                            {/* Session Usage Badge */}
                            {sessionUsage && sessionUsage.limit > 0 && (
                                <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${sessionUsage.remaining <= 1
                                        ? 'bg-orange-500/20 text-orange-400'
                                        : 'bg-surface-700/50 text-surface-300'
                                    }`}>
                                    {isRTL ? `${sessionUsage.remaining}/${sessionUsage.limit} جلسات` : `${sessionUsage.remaining}/${sessionUsage.limit} sessions`}
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent mb-2">{t('play.title')}</h1>
                        <p className="text-surface-400 mb-8">{t('play.subtitle')}</p>

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
                                        className={`relative w-full p-4 rounded-2xl bg-gradient-to-r ${game.bgGradient} border text-right flex items-center gap-4 group transition-all ${isLocked
                                                ? 'border-white/5 opacity-70 cursor-pointer'
                                                : 'border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        {/* Lock overlay for premium games */}
                                        {isLocked && (
                                            <div className="absolute inset-0 rounded-2xl bg-surface-900/40 backdrop-blur-[1px] flex items-center justify-center">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                                                    <Crown className="w-4 h-4" />
                                                    <span>Premium</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`w-12 h-12 rounded-xl bg-surface-900/50 flex items-center justify-center shrink-0 ${game.color} ${!isLocked && 'group-hover:scale-110'} transition-transform`}>
                                            {isLocked ? <Lock className="w-6 h-6" /> : <game.icon className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg mb-1 ${game.color}`}>{game.title}</h3>
                                            <p className="text-xs text-surface-300">{game.description}</p>
                                        </div>
                                        <ArrowLeft className={`w-5 h-5 text-surface-500 transition-colors ${!isLocked && 'group-hover:text-white'}`} />
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
                                className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                                        <Crown className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-amber-300 font-medium text-sm">
                                            {isRTL ? 'افتح جميع الألعاب' : 'Unlock All Games'}
                                        </p>
                                        <p className="text-amber-400/70 text-xs">
                                            {isRTL ? '8+ لعبة مع جلسات غير محدودة' : '8+ games with unlimited sessions'}
                                        </p>
                                    </div>
                                    <Link
                                        href="/settings/upgrade"
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm"
                                    >
                                        {isRTL ? 'ترقية' : 'Upgrade'}
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Upgrade Prompt Modal */}
            <AnimatePresence>
                {showUpgradePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
                        onClick={() => setShowUpgradePrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-surface-800 rounded-3xl p-6 max-w-sm w-full text-center border border-white/10"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {selectedLockedGame
                                    ? (isRTL ? 'لعبة Premium' : 'Premium Game')
                                    : (isRTL ? 'انتهت جلسات اليوم' : 'Daily Sessions Used')
                                }
                            </h3>
                            <p className="text-surface-400 mb-6">
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
                                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold mb-3"
                            >
                                {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
                            </Link>
                            <button
                                onClick={() => {
                                    setShowUpgradePrompt(false);
                                    setSelectedLockedGame(null);
                                }}
                                className="text-surface-500 text-sm"
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
