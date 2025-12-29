'use client';

import { useState } from 'react';
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
    Gamepad2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSound } from '@/hooks/useSound';

// Game Types
type GameType = 'would-you-rather' | 'compliment-battle' | 'memory-lane' | 'deep-questions' | 'love-roulette' | 'truth-or-dare' | null;

interface GameCard {
    id: string;
    type: GameType;
    title: string;
    description: string;
    icon: any;
    color: string;
    bgGradient: string;
}

import { useTranslation } from '@/hooks/useTranslation';

// ... other imports

export default function PlayPage() {
    const { playSound } = useSound();
    const router = useRouter();
    const { t } = useTranslation();

    // Move games array inside to access t function
    const games: GameCard[] = [
        { id: '1', type: 'would-you-rather', title: t('play.wyr'), description: t('play.wyrDesc'), icon: Zap, color: 'text-amber-400', bgGradient: 'from-amber-500/20 to-orange-500/10' },
        { id: '2', type: 'compliment-battle', title: t('play.compliment'), description: t('play.complimentDesc'), icon: Trophy, color: 'text-rose-400', bgGradient: 'from-rose-500/20 to-pink-500/10' },
        { id: '3', type: 'love-roulette', title: t('play.roulette'), description: t('play.rouletteDesc'), icon: RefreshCw, color: 'text-green-400', bgGradient: 'from-green-500/20 to-emerald-500/10' },
        { id: '4', type: 'deep-questions', title: t('play.deep'), description: t('play.deepDesc'), icon: MessageCircle, color: 'text-purple-400', bgGradient: 'from-purple-500/20 to-violet-500/10' },
        { id: '5', type: 'memory-lane', title: t('play.memory'), description: t('play.memoryDesc'), icon: Camera, color: 'text-blue-400', bgGradient: 'from-blue-500/20 to-cyan-500/10' },
        { id: '6', type: 'truth-or-dare', title: t('play.tod'), description: t('play.todDesc'), icon: Flame, color: 'text-red-400', bgGradient: 'from-red-600/20 to-orange-600/10' },
    ];

    const handleGameSelect = (type: GameType) => {
        playSound('click');
        if (type) {
            router.push(`/game-session?mode=${type}`);
        }
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
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6">
                            <ArrowRight className="w-5 h-5 transform rotate-180" />
                            {t('common.back')}
                        </Link>

                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent mb-2">{t('play.title')}</h1>
                        <p className="text-surface-400 mb-8">{t('play.subtitle')}</p>

                        <div className="grid gap-4">
                            {games.map((game, idx) => (
                                <motion.button
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleGameSelect(game.type)}
                                    className={`w-full p-4 rounded-2xl bg-gradient-to-r ${game.bgGradient} border border-white/5 text-right flex items-center gap-4 group hover:border-white/10 transition-all`}
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-surface-900/50 flex items-center justify-center shrink-0 ${game.color} group-hover:scale-110 transition-transform`}>
                                        <game.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-lg mb-1 ${game.color}`}>{game.title}</h3>
                                        <p className="text-xs text-surface-300">{game.description}</p>
                                    </div>
                                    <ArrowLeft className="w-5 h-5 text-surface-500 group-hover:text-white transition-colors" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
