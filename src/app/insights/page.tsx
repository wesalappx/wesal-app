'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, TrendingUp, Heart, MessageCircle, Sparkles, AlertCircle, Loader2, Moon, Zap, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { useInsights } from '@/hooks/useInsights';
import { useSettingsStore } from '@/stores/settings-store';

const emotionConfig = {
    love: { label: 'حب وامتنان', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Heart },
    happy: { label: 'سعادة', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Sparkles },
    neutral: { label: 'عادي', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: MessageCircle },
};

export default function InsightsPage() {
    const [mounted, setMounted] = useState(false);
    const { insights, isLoading } = useInsights();
    const { theme } = useSettingsStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Function to generate path for line chart
    const getPath = (points: number[]) => {
        if (points.length === 0) return '';
        const width = 100;
        const height = 40;
        const max = 100;
        const min = 0;

        const stepX = width / Math.max(1, points.length - 1);

        const pathPoints = points.map((val, idx) => {
            const x = idx * stepX;
            const y = height - ((val - min) / (max - min)) * height;
            return `${x},${y}`;
        });

        return `M ${pathPoints.join(' L ')}`;
    };

    if (!mounted || isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-slate-50' : ''}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!insights) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 text-center ${theme === 'light' ? 'bg-slate-50' : ''}`}>
                <div className={`p-8 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'}`}>
                    <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                    <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>لا توجد بيانات كافية</h2>
                    <p className={`mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>سجل حالتك اليومية لتحصل على رؤى مفيدة</p>
                    <Link href="/check-in" className="btn-primary">
                        تسجيل الحالة
                    </Link>
                </div>
            </div>
        );
    }

    // Determine primary emotion based on average mood
    const primaryEmotion = insights.avgMood >= 70 ? 'love' : insights.avgMood >= 50 ? 'happy' : 'neutral';
    const emotionInfo = emotionConfig[primaryEmotion];
    const EmotionIcon = emotionInfo.icon;

    return (
        <div className={`min-h-screen overflow-hidden font-sans ${theme === 'light'
                ? 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
                : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'
            }`}>
            <div className="max-w-md mx-auto p-4 pb-44">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pt-4">
                    <Link href="/dashboard" className={`p-2 -ml-2 ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-surface-400 hover:text-white'}`}>
                        <ArrowRight className="w-6 h-6 transform rotate-180" />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>رؤى العلاقة</h1>
                    <div className="w-10" />
                </div>

                {/* Main Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 mb-6 text-center rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'
                        }`}
                >
                    <div className="relative inline-block mb-4">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                            <span className={`text-4xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{insights.score}</span>
                        </div>
                        {insights.scoreDelta !== 0 && (
                            <div className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-medium ${insights.scoreDelta > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                }`}>
                                {insights.scoreDelta > 0 ? '+' : ''}{insights.scoreDelta}
                            </div>
                        )}
                    </div>

                    <h2 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>نتيجة العلاقة</h2>
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        بناءً على {insights.checkInCount} تسجيلات هذا الأسبوع
                    </p>
                </motion.div>

                {/* Partner Sync Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className={`p-4 mb-6 rounded-2xl border bg-gradient-to-r from-rose-500/10 to-pink-500/10 ${theme === 'light' ? 'border-rose-100' : 'border-rose-500/20'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-rose-500" />
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>التوافق مع الشريك</p>
                            <div className="flex items-center gap-2">
                                <div className={`flex-1 h-2 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'}`}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${insights.partnerSync}%` }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                                    />
                                </div>
                                <span className="text-lg font-bold text-rose-500">{insights.partnerSync}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Trend Chart */}
                {insights.emotionTrend.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={`p-6 mb-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary-500" />
                            <h3 className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>اتجاه المشاعر</h3>
                        </div>
                        <svg viewBox="0 0 100 40" className="w-full h-20">
                            <path
                                d={getPath(insights.emotionTrend)}
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f43f5e" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </motion.div>
                )}

                {/* Primary Emotion */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 mb-6 rounded-2xl border ${emotionInfo.bg} ${theme === 'light' ? 'border-slate-100' : 'border-white/10'
                        }`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                            <EmotionIcon className={`w-7 h-7 ${emotionInfo.color}`} />
                        </div>
                        <div className="flex-1 text-right">
                            <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>المشاعر السائدة</p>
                            <h3 className={`text-lg font-semibold ${emotionInfo.color}`}>{emotionInfo.label}</h3>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid with Progress Bars */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {[
                        { label: 'المزاج العام', value: insights.avgMood, icon: Sparkles, color: 'amber', gradient: 'from-amber-500 to-yellow-400' },
                        { label: 'مستوى الطاقة', value: insights.avgEnergy, icon: Zap, color: 'blue', gradient: 'from-blue-500 to-cyan-400' },
                        { label: 'الهدوء', value: insights.avgStress, icon: MessageCircle, color: 'emerald', gradient: 'from-green-500 to-emerald-400' },
                        { label: 'جودة النوم', value: insights.avgSleep, icon: Moon, color: 'purple', gradient: 'from-purple-500 to-violet-400' },
                        { label: 'الاتصال العاطفي', value: insights.avgConnection, icon: Heart, color: 'rose', gradient: 'from-rose-500 to-pink-400' },
                    ].map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + idx * 0.05 }}
                            className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs flex items-center gap-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    <stat.icon className="w-3 h-3" /> {stat.label}
                                </span>
                                <span className={`text-sm font-bold text-${stat.color}-500`}>{stat.value}%</span>
                            </div>
                            <div className={`w-full h-3 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'}`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.value}%` }}
                                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.8 }}
                                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card border-white/10'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-purple-500" />
                        <h3 className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>توصيات</h3>
                    </div>
                    <ul className="space-y-3">
                        {insights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-right">
                                <span className={theme === 'light' ? 'text-slate-700' : 'text-surface-300'}>{rec}</span>
                                <span className="text-primary-500 mt-1">•</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
