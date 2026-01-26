'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    Users,
    Sparkles,
    Bot,
    ArrowLeft,
    Bell,
    Calendar,
    MessageCircleHeart,
    StickyNote,
    CheckCircle2,
    Wallet,
    ImagePlus,
    HelpCircle,
    Gamepad2,
    Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from '@/hooks/useTranslation';
import { useNotifications } from '@/hooks/useNotifications';

interface KhatbaDashboardProps {
    userName: string;
    partnerName: string;
    isPaired: boolean;
    partnerStatus: 'online' | 'offline';
    isPremium: boolean;
}

export default function KhatbaDashboard({
    userName,
    partnerName,
    isPaired,
    partnerStatus,
    isPremium
}: KhatbaDashboardProps) {
    const { theme } = useSettingsStore();
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';
    const { unreadCount } = useNotifications();
    const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);

    // Khatba-specific actions grid
    const khatbaActions = [
        {
            id: 'compatibility',
            title: language === 'ar' ? 'اختبار التوافق' : 'Compatibility Test',
            desc: language === 'ar' ? 'اكتشفوا نقاط الاتفاق' : 'Discover alignment',
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-teal-600',
            href: '/compatibility'
        },
        {
            id: 'budget',
            title: language === 'ar' ? 'ميزانية الزواج' : 'Wedding Budget',
            desc: language === 'ar' ? 'خططوا معاً' : 'Plan together',
            icon: Wallet,
            gradient: 'from-amber-500 to-orange-600',
            href: '/budget'
        },
        {
            id: 'vision',
            title: language === 'ar' ? 'رؤيتنا المستقبلية' : 'Our Future',
            desc: language === 'ar' ? 'بيتنا وأحلامنا' : 'Home & Dreams',
            icon: ImagePlus,
            gradient: 'from-pink-500 to-rose-600',
            href: '/vision-board'
        },
        {
            id: 'questions',
            title: language === 'ar' ? 'أسئلة مهمة' : 'Key Questions',
            desc: language === 'ar' ? 'المواضيع الجادة' : 'Serious topics',
            icon: HelpCircle,
            gradient: 'from-violet-500 to-purple-600',
            href: '/dealbreakers'
        }
    ];

    // Shared features (also available in Khatba mode)
    const sharedFeatures = [
        {
            id: 'ai-coach',
            title: language === 'ar' ? 'رفيق وصال' : 'Wesal AI',
            desc: language === 'ar' ? 'استشارة ذكية' : 'Smart advice',
            icon: Bot,
            gradient: 'from-primary-500 to-accent-500',
            href: '/ai-coach'
        },
        {
            id: 'games',
            title: language === 'ar' ? 'ألعاب التعارف' : 'Icebreakers',
            desc: language === 'ar' ? 'كسر الجمود' : 'Break the ice',
            icon: Gamepad2,
            gradient: 'from-cyan-500 to-blue-600',
            href: '/play?mode=khatba'
        }
    ];

    function getGreeting(): string {
        const hour = new Date().getHours();
        if (language === 'ar') {
            if (hour < 12) return 'صباح الخير';
            if (hour < 17) return 'مساء الخير';
            return 'مساء النور';
        } else {
            if (hour < 12) return 'Good Morning';
            if (hour < 17) return 'Good Afternoon';
            return 'Good Evening';
        }
    }

    const greeting = getGreeting();

    return (
        <main className={`min-h-screen pb-8 relative overflow-hidden font-sans transition-colors duration-500 ${theme === 'light' ? 'bg-transparent text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background Gradient & Brand Blobs */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] blur-3xl opacity-60 rounded-full mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-gradient-radial from-violet-200/60 via-primary-100/20 to-transparent'
                    : 'bg-gradient-radial from-violet-500/10 via-transparent to-transparent'
                    }`} />
                <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-60 mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-purple-200/60'
                    : 'bg-purple-500/5'
                    }`} />
            </div>

            {/* Header */}
            <div className="px-5 pt-8 pb-4">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                            <img src="/wesal-logo.svg" alt="Wesal" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <div>
                            <span className={`text-xl font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {language === 'ar' ? 'وصال' : 'Wesal'}
                            </span>
                            <span className="mx-2 text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium">
                                {language === 'ar' ? 'خطوبة' : 'Engaged'}
                            </span>
                            {isPremium && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-medium">
                                    <Crown className="w-3 h-3" /> Premium
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/notes" className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            <StickyNote className="w-5 h-5 text-amber-500" />
                        </Link>
                        <Link href="/calendar" className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </Link>
                        <Link href="/notifications" className={`w-10 h-10 rounded-2xl flex items-center justify-center relative backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            {unreadCount > 0 && (
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            )}
                            <Bell className={`w-5 h-5 ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`} />
                        </Link>
                        <Link href="/settings" className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25">
                            {userName.charAt(0).toUpperCase()}
                        </Link>
                    </div>
                </header>

                {/* Greeting */}
                <div className="mb-6">
                    <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{greeting} 👋</p>
                    <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{userName}</h1>

                    {isPaired && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${theme === 'light' ? 'bg-white/40 border-white/40 shadow-sm' : 'bg-surface-800/60 border-surface-700/50'}`}>
                            <div className={`w-2 h-2 rounded-full ${partnerStatus === 'online' ? 'bg-green-400' : 'bg-surface-600'}`} />
                            <span className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                {partnerStatus === 'online'
                                    ? (language === 'ar' ? `${partnerName} متصل الآن` : `${partnerName} is online`)
                                    : (language === 'ar' ? `${partnerName} غير متصل` : `${partnerName} is offline`)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="px-5 mt-4 space-y-6">
                {/* Compatibility Score Card (Hero) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-6 backdrop-blur-xl border relative overflow-hidden ${theme === 'light' ? 'bg-gradient-to-br from-violet-50/80 to-purple-50/80 border-violet-100 shadow-lg' : 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {language === 'ar' ? 'نسبة التوافق' : 'Compatibility Score'}
                            </h2>
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {language === 'ar' ? 'أجيبوا على الأسئلة لتعرفوا' : 'Answer questions to discover'}
                            </p>
                        </div>
                        <div className="text-center">
                            {compatibilityScore !== null ? (
                                <div className="text-4xl font-bold text-violet-500">{compatibilityScore}%</div>
                            ) : (
                                <Link href="/compatibility" className="px-4 py-2 rounded-xl bg-violet-500 text-white font-medium text-sm hover:bg-violet-600 transition-colors">
                                    {language === 'ar' ? 'ابدأ الاختبار' : 'Start Test'}
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Khatba Actions Grid */}
                <h2 className={`text-lg font-bold px-1 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                    {language === 'ar' ? 'أدوات التعارف' : 'Getting to Know Each Other'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {khatbaActions.map((action, idx) => (
                        <Link href={action.href} key={action.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-2xl p-5 h-full backdrop-blur-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30 hover:border-violet-500/30'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg mb-4`}>
                                    <action.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className={`font-bold text-base mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {action.title}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {action.desc}
                                </p>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Shared Features */}
                <h2 className={`text-lg font-bold px-1 mt-6 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                    {language === 'ar' ? 'أدوات مشتركة' : 'Shared Features'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {sharedFeatures.map((feature, idx) => (
                        <Link href={feature.href} key={feature.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (khatbaActions.length + idx) * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                                    <feature.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                        {feature.title}
                                    </h3>
                                    <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                        {feature.desc}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Whisper / Mood Check-in */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Link href="/check-in">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'كيف حالك' : 'Check-in'}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'شارك مزاجك' : 'Share mood'}
                                </p>
                            </div>
                        </motion.div>
                    </Link>

                    <Link href="/whisper">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                                <MessageCircleHeart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'همسة' : 'Whisper'}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'رسالة حب' : 'Love note'}
                                </p>
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* Daily Tip */}
                <div className={`rounded-2xl p-5 mt-4 backdrop-blur-xl border ${theme === 'light' ? 'bg-white/60 border-violet-100 shadow-lg shadow-violet-500/5' : 'bg-surface-800/50 border-surface-700/30'}`}>
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-violet-400 mb-2">
                                {language === 'ar' ? 'نصيحة اليوم' : 'Today\'s Tip'}
                            </h4>
                            <p className={`text-sm italic leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                {language === 'ar'
                                    ? '"أهم شي في فترة الخطوبة: الصراحة والوضوح من البداية 💍"'
                                    : '"The most important thing during engagement: honesty and clarity from the start 💍"'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
