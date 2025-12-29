'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Heart,
    Zap,
    Brain,
    Share2,
    Sparkles,
    CheckCircle,
    Sun,
    BarChart3,
    Loader2,
    Quote,
    Moon
} from 'lucide-react';
import Confetti from '@/components/Confetti';
import { useSound } from '@/hooks/useSound';
import { useCheckIn, CheckIn } from '@/hooks/useCheckIn';
import { analyzeMood } from '@/lib/ai';

// --- DATA & TYPES ---

// Question Configuration
const QUESTIONS = [
    {
        id: 'mood',
        label: 'كيف المود اليوم؟',
        icon: Sun,
        color: 'text-amber-400',
        bgColor: 'bg-amber-400', // Explicit for Tailwind
        options: [
            { val: 1, emoji: '😢', label: 'متضايق' },
            { val: 2, emoji: '😞', label: 'طفشان' },
            { val: 3, emoji: '😐', label: 'عادي' },
            { val: 4, emoji: '🙂', label: 'رايق' },
            { val: 5, emoji: '🤩', label: 'مبسوط' }
        ]
    },
    {
        id: 'energy',
        label: 'كيف طاقتك؟',
        icon: Zap,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400', // Explicit for Tailwind
        options: [
            { val: 1, emoji: '🪫', label: 'منتهي' },
            { val: 2, emoji: '🥱', label: 'خمول' },
            { val: 3, emoji: '😐', label: 'وسط' },
            { val: 4, emoji: '💪', label: 'نشيط' },
            { val: 5, emoji: '🚀', label: 'فل' }
        ]
    },
    {
        id: 'stress',
        label: 'مستوى الضغط؟',
        icon: Brain,
        color: 'text-rose-400',
        bgColor: 'bg-rose-400', // Explicit for Tailwind
        options: [
            { val: 1, emoji: '🤯', label: 'جداً مضغوط' }, // Low score = Bad
            { val: 2, emoji: '😰', label: 'مشغول بالي' },
            { val: 3, emoji: '😐', label: 'مستقر' },
            { val: 4, emoji: '🙂', label: 'هادي' },
            { val: 5, emoji: '😌', label: 'مرتاح' } // High score = Good
        ]
    },
    {
        id: 'sleep',
        label: 'كيف نومك؟',
        icon: Sun, // Fallback icon
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400', // Explicit for Tailwind
        options: [
            { val: 1, emoji: '😫', label: 'سيء' },
            { val: 2, emoji: '😴', label: 'ما شبعت' },
            { val: 3, emoji: '😐', label: 'مقبول' },
            { val: 4, emoji: '🛌', label: 'جيد' },
            { val: 5, emoji: '💤', label: 'عميق' }
        ]
    },
    {
        id: 'connection',
        label: 'شعورك تجاه الشريك؟',
        icon: Heart,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500', // Explicit for Tailwind
        options: [
            { val: 1, emoji: '💔', label: 'بعيدين' },
            { val: 2, emoji: '🥀', label: 'جاف' },
            { val: 3, emoji: '😐', label: 'عادي' },
            { val: 4, emoji: '💖', label: 'متصلين' },
            { val: 5, emoji: '💞', label: 'في قمة الحب' }
        ]
    }
];

type Scores = Record<string, number>;

// AI Response Type
interface AiResponse {
    insight: string;
    action: string;
    quote: string;
}

export default function CheckInPage() {
    const [qIndex, setQIndex] = useState(0);
    const [scores, setScores] = useState<Scores>({});
    const [isComplete, setIsComplete] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [shareWithPartner, setShareWithPartner] = useState(true);
    const { playSound } = useSound();
    const [showConfetti, setShowConfetti] = useState(false);
    const { createCheckIn, getHistory } = useCheckIn();
    const [weeklyData, setWeeklyData] = useState<CheckIn[]>([]);

    // AI & Loading State
    const [aiData, setAiData] = useState<AiResponse | null>(null);
    const [loadingState, setLoadingState] = useState<'idle' | 'fluid' | 'ready' | 'done'>('idle');
    const [isSharing, setIsSharing] = useState(false);

    const currentQ = QUESTIONS[qIndex];

    // Share functionality
    const handleShare = async () => {
        setIsSharing(true);
        playSound('click');

        const shareText = `📊 ملخص يومي من وصال\n\n` +
            `المزاج: ${scores.mood}/5 ${'⭐'.repeat(scores.mood)}\n` +
            `الطاقة: ${scores.energy}/5 ${'⚡'.repeat(scores.energy)}\n` +
            `الراحة: ${scores.stress}/5 ${'🧘'.repeat(scores.stress)}\n` +
            `التواصل: ${scores.connection}/5 ${'💖'.repeat(scores.connection)}\n\n` +
            `💡 ${aiData?.insight || 'رؤية اليوم'}\n\n` +
            `#وصال #صحة_نفسية #تطوير_الذات`;

        try {
            // Try Web Share API first (mobile)
            if (navigator.share) {
                await navigator.share({
                    title: 'ملخص يومي - وصال',
                    text: shareText,
                });
                playSound('success');
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareText);
                alert('تم نسخ الملخص! يمكنك مشاركته الآن 📋');
                playSound('success');
            }
        } catch (error) {
            console.error('Share failed:', error);
        } finally {
            setIsSharing(false);
        }
    };

    const handleAnswer = async (val: number) => {
        playSound('pop');
        const newScores = { ...scores, [currentQ.id]: val };
        setScores(newScores);

        if (qIndex < QUESTIONS.length - 1) {
            setTimeout(() => {
                playSound('whoosh');
                setQIndex(prev => prev + 1);
            }, 250);
        } else {
            // FINISH
            setIsSaving(true);
            setLoadingState('fluid'); // Start Fluid Loading
            playSound('success');

            // Save
            console.log('[CheckIn] Saving scores:', newScores);
            const { error } = await createCheckIn({
                mood: newScores.mood,
                energy: newScores.energy,
                stress: newScores.stress,
                sleep: newScores.sleep,
                connection: newScores.connection,
                shared_with_partner: shareWithPartner,
            });

            if (error) console.error('[CheckIn] Failed to save:', error);
            else console.log('[CheckIn] Save successful');

            // Trigger AI
            try {
                const checkInSummary = [{
                    mood: newScores.mood,
                    energy: newScores.energy,
                    stress: newScores.stress,
                    sleep: newScores.sleep,
                    connection: newScores.connection
                }];
                const rawResponse = await analyzeMood(checkInSummary, 'ar');

                // Parse JSON
                try {
                    // Clean code blocks if present
                    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                    const parsed = JSON.parse(cleanJson);
                    setAiData(parsed);
                } catch (e) {
                    // Fallback if not valid JSON
                    setAiData({
                        insight: 'يومك يبدو متفاوتاً، حافظ على توازنك.',
                        action: 'خذ قسطاً من الراحة.',
                        quote: 'لنفسك عليك حق.'
                    });
                }

            } catch (err) {
                console.error('AI Error', err);
            }

            setIsSaving(false);

            // Fetch weekly history for graphs
            const { data: history } = await getHistory(7);
            console.log('[CheckIn] Weekly history fetched:', history);
            setWeeklyData(history || []);

            // Allow animation to play for a bit
            setTimeout(() => {
                setLoadingState('ready');
                setTimeout(() => {
                    setLoadingState('done');
                    setShowConfetti(true);
                    setIsComplete(true);
                }, 600);
            }, 3500);
        }
    };

    return <main className="min-h-screen p-4 pb-44 relative overflow-hidden font-sans bg-surface-900">
        <Confetti isActive={showConfetti && isComplete} onComplete={() => setShowConfetti(false)} />

        {/* Back Link - Only in Survey Mode */}
        {!isComplete && loadingState === 'idle' && (
            <div className="max-w-md mx-auto pt-6 mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5 transform rotate-180" />
                    إلغاء
                </Link>
            </div>
        )}

        <div className="max-w-md mx-auto relative z-10">

            {/* SURVEY MODE */}
            {!isComplete && loadingState === 'idle' && (
                <div className="min-h-[60vh] flex flex-col justify-center">
                    <div className="w-full h-1 bg-surface-800 rounded-full mb-12 relative overflow-hidden">
                        <motion.div
                            className="absolute top-0 right-0 h-full bg-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((qIndex) / QUESTIONS.length) * 100}%` }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQ.id}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className="text-center"
                        >
                            <div className={`inline-flex p-4 rounded-2xl ${currentQ.bgColor}/20 mb-6`}>
                                <currentQ.icon className={`w-12 h-12 ${currentQ.color}`} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-8">{currentQ.label}</h2>

                            <div className="grid gap-3">
                                {currentQ.options.map((opt) => (
                                    <button
                                        key={opt.val}
                                        onClick={() => handleAnswer(opt.val)}
                                        className="w-full p-4 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/5 hover:border-primary-500/50 transition-all flex items-center justify-between group"
                                    >
                                        <span className="text-xl group-hover:scale-125 transition-transform">{opt.emoji}</span>
                                        <span className="font-bold text-surface-200">{opt.label}</span>
                                        <div className="w-6 h-6 rounded-full border-2 border-surface-600 group-hover:border-primary-500 group-hover:bg-primary-500/20" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* FLUID LOADING SCREEN */}
            {loadingState === 'fluid' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-gradient-to-b from-surface-900 to-black flex flex-col items-center justify-center p-8 text-center"
                >
                    {/* Fluid Orb */}
                    <div className="relative w-64 h-64 mb-8">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 90, 180, 270, 360],
                                borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 50% 40% 50%"]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-tr from-primary-500/30 via-indigo-500/30 to-rose-500/30 blur-3xl"
                        />
                        <motion.div
                            animate={{ scale: [0.9, 1.1, 0.9] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <Sparkles className="w-16 h-16 text-white/50 animate-pulse" />
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
                        جاري استشعار الحالة...
                    </h2>
                    <p className="text-surface-400">تواصل مع ذاتك بينما نحلل البيانات</p>
                </motion.div>
            )}

            {/* RESULT DASHBOARD */}
            {isComplete && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 pb-12"
                >
                    {/* Header */}
                    <div className="text-center pt-8">
                        <div className="inline-block p-1 rounded-full border border-surface-700 bg-surface-800/50 backdrop-blur-sm mb-4">
                            <span className="px-3 py-1 text-xs font-semibold text-primary-300">تم الحفظ بنجاح</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">ملخص يومك</h2>
                    </div>

                    {/* 1. TOP SECTION: STATS GRID */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        <div className="glass-card p-3 flex-1 min-w-[100px] flex flex-col items-center justify-center bg-amber-500/5 border-amber-500/20">
                            <Sun className="w-5 h-5 text-amber-400 mb-1" />
                            <span className="text-xl font-bold text-white">{scores.mood}/5</span>
                            <span className="text-[10px] text-surface-400">المزاج</span>
                        </div>
                        <div className="glass-card p-3 flex-1 min-w-[100px] flex flex-col items-center justify-center bg-blue-500/5 border-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-400 mb-1" />
                            <span className="text-xl font-bold text-white">{scores.energy}/5</span>
                            <span className="text-[10px] text-surface-400">الطاقة</span>
                        </div>
                        <div className="glass-card p-3 flex-1 min-w-[100px] flex flex-col items-center justify-center bg-rose-500/5 border-rose-500/20">
                            <Brain className="w-5 h-5 text-rose-400 mb-1" />
                            <span className="text-xl font-bold text-white">{scores.stress}/5</span>
                            <span className="text-[10px] text-surface-400">الراحة</span>
                        </div>
                        <div className="w-full flex gap-2">
                            <div className="glass-card p-3 flex-1 flex flex-col items-center justify-center bg-indigo-500/5 border-indigo-500/20">
                                <Moon className="w-5 h-5 text-indigo-400 mb-1" />
                                <span className="text-xl font-bold text-white">{scores.sleep}/5</span>
                                <span className="text-[10px] text-surface-400">النوم</span>
                            </div>
                            <div className="glass-card p-3 flex-1 flex flex-col items-center justify-center bg-pink-500/5 border-pink-500/20">
                                <Heart className="w-5 h-5 text-pink-400 mb-1" />
                                <span className="text-xl font-bold text-white">{scores.connection}/5</span>
                                <span className="text-[10px] text-surface-400">التواصل</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. MIDDLE SECTION: TODAY'S BARS */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-4 h-4 text-surface-400" />
                            <h3 className="text-sm font-bold text-surface-300">مؤشرات اليوم</h3>
                        </div>
                        <div className="space-y-3">
                            {QUESTIONS.map((q) => {
                                const val = scores[q.id] || 0;
                                const pct = (val / 5) * 100;
                                // Extract short label from question
                                const getShortLabel = (label: string) => {
                                    const labels: Record<string, string> = {
                                        'mood': 'المود',
                                        'energy': 'طاقتك',
                                        'stress': 'الضغط',
                                        'sleep': 'نومك',
                                        'connection': 'تجاه'
                                    };
                                    return labels[q.id] || label.replace('؟', '').split(' ').pop() || '';
                                };
                                return (
                                    <div key={q.id} className="flex items-center gap-3">
                                        <span className="text-xs text-surface-400 w-16 whitespace-nowrap">{getShortLabel(q.label)}</span>
                                        <div className="h-2 flex-1 bg-surface-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className={`h-full rounded-full ${q.bgColor}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* WEEKLY TREND GRAPH */}
                    {weeklyData.length > 1 && (
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-primary-400" />
                                <h3 className="text-sm font-bold text-white">تطور الأسبوع</h3>
                            </div>
                            <div className="space-y-3">
                                {['mood', 'energy', 'stress', 'sleep', 'connection'].map((metric) => {
                                    const question = QUESTIONS.find(q => q.id === metric);
                                    if (!question) return null;

                                    return (
                                        <div key={metric} className="flex items-center gap-4">
                                            {/* Label Section */}
                                            <div className="flex items-center gap-2 w-28 shrink-0">
                                                <div className={`p-1.5 rounded-lg ${question.bgColor}/10`}>
                                                    <question.icon className={`w-3.5 h-3.5 ${question.color}`} />
                                                </div>
                                                <span className="text-xs font-medium text-surface-200">{question.label.split(' ').slice(1).join(' ')}</span>
                                            </div>

                                            {/* Sparkline Bars */}
                                            <div className="h-12 flex-1 flex items-end gap-1.5 pt-2">
                                                {weeklyData.slice(0, 7).reverse().map((checkIn, idx) => {
                                                    const value = checkIn[metric as keyof CheckIn] as number || 0;
                                                    const height = (value / 5) * 100;
                                                    return (
                                                        <div key={idx} className="flex-1 h-full flex items-end relative group bg-surface-800/30 rounded-sm overflow-hidden">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${height}%` }}
                                                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                                                className={`w-full ${question.bgColor} opacity-60 group-hover:opacity-100 transition-opacity`}
                                                            />
                                                            {/* Tooltip on Hover */}
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                                <span className="text-[10px] font-bold text-white bg-surface-900 border border-white/10 px-2 py-1 rounded shadow-xl">
                                                                    {value}/5
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-3 px-1">
                                <span className="text-xs text-surface-500">قبل 7 أيام</span>
                                <span className="text-xs text-surface-500">اليوم</span>
                            </div>
                        </div>
                    )}

                    {/* 3. BOTTOM SECTION: "ROYA" INSIGHTS (3 Cards) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Sparkles className="w-5 h-5 text-primary-400" />
                            <h3 className="text-lg font-bold text-white">رؤية (Roya)</h3>
                        </div>

                        {/* Card 1: The Insight (Jawhar) */}
                        <div className="glass-card p-5 border-l-4 border-l-primary-500 bg-gradient-to-r from-surface-800 to-surface-800/50">
                            <h4 className="text-sm font-bold text-primary-300 mb-2">الرؤية</h4>
                            <p className="text-white leading-relaxed">
                                {aiData?.insight || <Loader2 className="w-4 h-4 animate-spin inline" />}
                            </p>
                        </div>

                        {/* Card 2: The Action (Khutwa) */}
                        <div className="glass-card p-5 border-l-4 border-l-blue-500 bg-gradient-to-r from-surface-800 to-surface-800/50">
                            <h4 className="text-sm font-bold text-blue-300 mb-2">خطوة اليوم</h4>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                <p className="text-white">
                                    {aiData?.action || "..."}
                                </p>
                            </div>
                        </div>

                        {/* Card 3: The Quote (Hamsa) */}
                        <div className="glass-card p-5 border-l-4 border-l-rose-500 bg-gradient-to-r from-surface-800 to-surface-800/50 italic">
                            <h4 className="text-sm font-bold text-rose-300 mb-2">همسة</h4>
                            <div className="flex gap-2">
                                <Quote className="w-4 h-4 text-rose-400 transform rotate-180" />
                                <p className="text-surface-200">
                                    {aiData?.quote || "..."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <Link href="/dashboard" className="flex-1 py-4 bg-surface-800 hover:bg-surface-700 rounded-xl font-bold text-white text-center transition-colors">
                            الرئيسية
                        </Link>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2 transition-colors"
                        >
                            {isSharing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Share2 className="w-5 h-5" />
                            )}
                            مشاركة
                        </button>
                    </div>

                </motion.div>
            )}
        </div>
    </main>

}
