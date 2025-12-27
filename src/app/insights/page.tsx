'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, TrendingUp, Heart, MessageCircle, Sparkles, AlertCircle, Loader2, Moon, Zap, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { useInsights } from '@/hooks/useInsights';

const emotionConfig = {
    love: { label: 'حب وامتنان', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: Heart },
    happy: { label: 'سعادة', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Sparkles },
    neutral: { label: 'عادي', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: MessageCircle },
};

export default function InsightsPage() {
    const [mounted, setMounted] = useState(false);
    const { insights, isLoading } = useInsights();

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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!insights) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 text-center">
                <div className="glass-card p-8">
                    <AlertCircle className="w-12 h-12 text-surface-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">لا توجد بيانات كافية</h2>
                    <p className="text-surface-400 mb-4">سجل حالتك اليومية لتحصل على رؤى مفيدة</p>
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
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 overflow-hidden font-sans">
            <div className="max-w-md mx-auto p-4 pb-44">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pt-4">
                    <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white">
                        <ArrowRight className="w-6 h-6 transform rotate-180" />
                    </Link>
                    <h1 className="text-xl font-bold">رؤى العلاقة</h1>
                    <div className="w-10" />
                </div>

                {/* Main Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 mb-6 text-center"
                >
                    <div className="relative inline-block mb-4">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                            <span className="text-4xl font-bold">{insights.score}</span>
                        </div>
                        {insights.scoreDelta !== 0 && (
                            <div className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-medium ${insights.scoreDelta > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {insights.scoreDelta > 0 ? '+' : ''}{insights.scoreDelta}
                            </div>
                        )}
                    </div>

                    <h2 className="text-lg font-semibold mb-2">نتيجة العلاقة</h2>
                    <p className="text-sm text-surface-400">
                        بناءً على {insights.checkInCount} تسجيلات هذا الأسبوع
                    </p>
                </motion.div>

                {/* Partner Sync Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card p-4 mb-6 bg-gradient-to-r from-rose-500/10 to-pink-500/10"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-rose-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-surface-400">التوافق مع الشريك</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${insights.partnerSync}%` }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                                    />
                                </div>
                                <span className="text-lg font-bold text-rose-400">{insights.partnerSync}%</span>
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
                        className="glass-card p-6 mb-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-primary-400" />
                            <h3 className="font-semibold">اتجاه المشاعر</h3>
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
                    className={`glass-card p-6 mb-6 ${emotionInfo.bg}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                            <EmotionIcon className={`w-7 h-7 ${emotionInfo.color}`} />
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-sm text-surface-400 mb-1">المشاعر السائدة</p>
                            <h3 className={`text-lg font-semibold ${emotionInfo.color}`}>{emotionInfo.label}</h3>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid with Progress Bars */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {/* Mood */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> المزاج العام
                            </span>
                            <span className="text-sm font-bold text-amber-400">{insights.avgMood}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insights.avgMood}%` }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Energy */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> مستوى الطاقة
                            </span>
                            <span className="text-sm font-bold text-blue-400">{insights.avgEnergy}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insights.avgEnergy}%` }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Stress (inverted - shown as calmness) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {mounted && (document.dir === 'rtl' ? 'الهدوء (عكس التوتر)' : 'Calmness (Low Stress)')}
                            </span>
                            <span className="text-sm font-bold text-emerald-400">{insights.avgStress}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insights.avgStress}%` }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Sleep */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                                <Moon className="w-3 h-3" /> جودة النوم
                            </span>
                            <span className="text-sm font-bold text-purple-400">{insights.avgSleep}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insights.avgSleep}%` }}
                                transition={{ delay: 0.8, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                            />
                        </div>
                    </motion.div>

                    {/* Connection */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-surface-400 flex items-center gap-1">
                                <Heart className="w-3 h-3" /> الاتصال العاطفي
                            </span>
                            <span className="text-sm font-bold text-rose-400">{insights.avgConnection}%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insights.avgConnection}%` }}
                                transition={{ delay: 0.9, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold">توصيات</h3>
                    </div>
                    <ul className="space-y-3">
                        {insights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-right">
                                <span className="text-surface-300">{rec}</span>
                                <span className="text-primary-400 mt-1">•</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
