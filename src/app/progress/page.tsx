'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Trophy, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';

const trendConfig = {
    'Improving': { icon: TrendingUp, color: 'text-green-400', label: 'تحسن' },
    'Stable': { icon: Minus, color: 'text-blue-400', label: 'مستقر' },
    'Declining': { icon: TrendingDown, color: 'text-orange-400', label: 'تراجع' },
};

export default function WeeklyProgressPage() {
    const { progress, isLoading } = useProgress();

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    if (!progress) {
        return (
            <main className="min-h-screen pb-44 p-6 font-sans">
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6 transform rotate-180" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">انعكاس أسبوعي</h1>
                </header>
                <div className="text-center py-12 text-surface-400">
                    <p>لا توجد بيانات كافية</p>
                    <Link href="/check-in" className="btn-primary mt-4 inline-block">
                        سجل حالتك
                    </Link>
                </div>
            </main>
        );
    }

    const trendKey = Object.keys(trendConfig).includes(progress.trend) ? progress.trend : 'Stable';
    const TrendIcon = trendConfig[trendKey].icon;
    const trendColor = trendConfig[trendKey].color;
    const trendLabel = trendConfig[trendKey].label;

    return (
        <main className="min-h-screen pb-44 p-6 font-sans">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6 transform rotate-180" />
                </Link>
                <h1 className="text-xl font-bold text-white">انعكاس أسبوعي</h1>
            </header>

            {/* Orbital Chart Visualization */}
            <div className="relative h-64 mb-8 flex items-center justify-center">
                {/* Orbits */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border border-surface-700/30 animate-spin-slow" />
                    <div className="absolute w-32 h-32 rounded-full border border-surface-700/50" />
                </div>

                {/* Central Core */}
                <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl shadow-rose-900/30">
                    <span className="text-3xl font-bold text-white">{Math.round(progress.alignment * 100)}%</span>
                    <span className="text-[10px] text-white/80 uppercase tracking-widest mt-1">توافق</span>
                </div>

                {/* Orbiting Planets */}
                <div className="absolute w-48 h-48 animate-spin-slow">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full shadow-lg shadow-amber-500/50" />
                </div>
                <div className="absolute w-32 h-32 animate-reverse-spin-slow">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50" />
                </div>
            </div>

            <div className="space-y-4">
                {/* Trend Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${progress.trend === 'Improving' ? 'bg-green-500/20 text-green-400' : progress.trend === 'Declining' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <TrendIcon className="w-5 h-5" />
                        </div>
                        <span className="text-surface-400 text-sm">{progress.week}</span>
                    </div>
                    <p className={`text-lg font-semibold ${trendColor}`}>{trendLabel}</p>
                    <p className="text-surface-400 text-sm">
                        التركيز هذا الأسبوع: {progress.focus}
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-5 text-center"
                    >
                        <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{progress.streak}</p>
                        <p className="text-xs text-surface-400">يوم متتالي</p>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card p-5 text-center"
                    >
                        <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{progress.sessions}</p>
                        <p className="text-xs text-surface-400">جلسات</p>
                    </motion.div>
                </div>

                {/* Check-ins count */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-5"
                >
                    <div className="flex items-center justify-between">
                        <ChevronRight className="w-5 h-5 text-surface-400" />
                        <div className="text-right">
                            <p className="text-sm text-surface-400">تسجيلات الحالة هذا الأسبوع</p>
                            <p className="text-xl font-bold">{progress.checkIns}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Link */}
                <Link href="/insights" className="glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <ChevronRight className="w-5 h-5 text-surface-400 transform rotate-180" />
                    <span className="font-medium">عرض الرؤى التفصيلية</span>
                </Link>
            </div>
        </main>
    );
}
