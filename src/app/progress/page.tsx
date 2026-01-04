'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Trophy, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useProgress } from '@/hooks/useProgress';
import { useSettingsStore } from '@/stores/settings-store';

const trendConfig = {
    'Improving': { icon: TrendingUp, color: 'text-green-500', label: 'تحسن' },
    'Stable': { icon: Minus, color: 'text-blue-500', label: 'مستقر' },
    'Declining': { icon: TrendingDown, color: 'text-orange-500', label: 'تراجع' },
};

export default function WeeklyProgressPage() {
    const { progress, isLoading } = useProgress();
    const { theme } = useSettingsStore();

    if (isLoading) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : ''}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    if (!progress) {
        return (
            <main className={`min-h-screen pb-44 p-6 font-sans ${theme === 'light' ? 'bg-slate-50' : ''}`}>
                <header className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className={`p-2 -ml-2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-surface-400 hover:text-white'}`}>
                        <ArrowLeft className="w-6 h-6 transform rotate-180" />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>انعكاس أسبوعي</h1>
                </header>
                <div className={`text-center py-12 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                    <p>لا توجد بيانات كافية</p>
                    <Link href="/check-in" className="btn-primary mt-4 inline-block">
                        سجل حالتك
                    </Link>
                </div>
            </main>
        );
    }

    const trendKey = Object.keys(trendConfig).includes(progress.trend) ? progress.trend : 'Stable';
    const TrendIcon = trendConfig[trendKey as keyof typeof trendConfig].icon;
    const trendColor = trendConfig[trendKey as keyof typeof trendConfig].color;
    const trendLabel = trendConfig[trendKey as keyof typeof trendConfig].label;

    return (
        <main className={`min-h-screen pb-44 p-6 font-sans ${theme === 'light' ? 'bg-slate-50' : ''}`}>
            <header className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className={`p-2 -ml-2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-surface-400 hover:text-white'}`}>
                    <ArrowLeft className="w-6 h-6 transform rotate-180" />
                </Link>
                <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>انعكاس أسبوعي</h1>
            </header>

            {/* Orbital Chart Visualization */}
            <div className="relative h-64 mb-8 flex items-center justify-center">
                {/* Orbits */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-48 h-48 rounded-full border animate-spin-slow ${theme === 'light' ? 'border-slate-200' : 'border-surface-700/30'}`} />
                    <div className={`absolute w-32 h-32 rounded-full border ${theme === 'light' ? 'border-slate-300' : 'border-surface-700/50'}`} />
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
                    className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${progress.trend === 'Improving' ? 'bg-green-500/20 text-green-500' : progress.trend === 'Declining' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'}`}>
                            <TrendIcon className="w-5 h-5" />
                        </div>
                        <span className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{progress.week}</span>
                    </div>
                    <p className={`text-lg font-semibold ${trendColor}`}>{trendLabel}</p>
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        التركيز هذا الأسبوع: {progress.focus}
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`p-5 text-center rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'}`}
                    >
                        <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{progress.streak}</p>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>يوم متتالي</p>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className={`p-5 text-center rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'}`}
                    >
                        <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{progress.sessions}</p>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>جلسات</p>
                    </motion.div>
                </div>

                {/* Check-ins count */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'}`}
                >
                    <div className="flex items-center justify-between">
                        <ChevronRight className={`w-5 h-5 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                        <div className="text-right">
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>تسجيلات الحالة هذا الأسبوع</p>
                            <p className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{progress.checkIns}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Link */}
                <Link href="/insights" className={`p-4 flex items-center justify-between rounded-2xl border transition-colors ${theme === 'light'
                        ? 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                        : 'glass-card border-white/10 hover:bg-white/5'
                    }`}>
                    <ChevronRight className={`w-5 h-5 transform rotate-180 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>عرض الرؤى التفصيلية</span>
                </Link>
            </div>
        </main>
    );
}
