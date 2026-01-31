'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Heart,
    Sparkles,
    Bot,
    ArrowLeft,
    ArrowRight,
    Bell,
    Calendar,
    MessageCircleHeart,
    StickyNote,
    Wallet,
    ImagePlus,
    Gamepad2,
    Snowflake,
    Shield,
    Lightbulb,
    Crown
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from '@/hooks/useTranslation';
import { useNotifications } from '@/hooks/useNotifications';
import CoolDownModal from '@/components/CoolDownModal';
import DashboardChat from '@/components/DashboardChat';

interface KhatbaDashboardProps {
    userName: string;
    partnerName: string;
    isPaired: boolean;
    partnerStatus: 'online' | 'offline';
    isPremium: boolean;
    coupleId?: string | null;
    partnerId?: string | null;
    partnerMood?: any;
}

export default function KhatbaDashboard({
    userName,
    partnerName,
    isPaired,
    partnerStatus,
    isPremium,
    coupleId,
    partnerId,
    partnerMood
}: KhatbaDashboardProps) {
    const { theme } = useSettingsStore();
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';
    const { unreadCount } = useNotifications();
    const [showCoolDown, setShowCoolDown] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Khatba-specific actions grid (matches married dashboard layout)
    const actions = [
        {
            id: 'compatibility',
            title: language === 'ar' ? 'تقارب' : 'Connect',
            desc: language === 'ar' ? 'اختبار التوافق' : 'Compatibility',
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
            href: '/compatibility'
        },
        {
            id: 'counselor',
            title: language === 'ar' ? 'المستشار' : 'Counselor',
            desc: language === 'ar' ? 'نصائح الخطوبة' : 'Engagement tips',
            icon: Shield,
            gradient: 'from-violet-500 to-purple-600',
            href: '/conflict'
        },
        {
            id: 'play',
            title: language === 'ar' ? 'لعب وتحدي' : 'Play',
            desc: language === 'ar' ? 'ألعاب التعارف' : 'Icebreakers',
            icon: Gamepad2,
            gradient: 'from-amber-500 to-orange-600',
            href: '/play?mode=khatba'
        },
        {
            id: 'questions',
            title: language === 'ar' ? 'نصائح' : 'Advice',
            desc: language === 'ar' ? 'أسئلة مهمة' : 'Key questions',
            icon: Lightbulb,
            gradient: 'from-emerald-500 to-teal-600',
            href: '/dealbreakers'
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
                <div className={`absolute top-1/3 left-0 w-72 h-72 rounded-full blur-3xl opacity-40 mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-rose-200/50'
                    : 'bg-rose-500/5'
                    }`} />
            </div>

            {/* Header - Same structure as married dashboard */}
            <div className="px-5 pt-8 pb-4">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                            <img
                                src="/wesal-logo.svg"
                                alt="Wesal"
                                className="w-full h-full object-contain drop-shadow-lg"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xl font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {language === 'ar' ? 'وصال' : 'Wesal'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-medium w-fit">
                                {language === 'ar' ? 'خطوبة' : 'Engaged'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/notes" className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            <StickyNote className="w-5 h-5 text-amber-500" />
                        </Link>
                        {/* Chat Button - Same as married dashboard */}
                        <button
                            onClick={() => setShowChat(true)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}
                        >
                            <MessageCircleHeart className="w-5 h-5 text-pink-500" />
                        </button>
                        <Link href="/calendar" className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            <Calendar className="w-5 h-5 text-blue-500" />
                        </Link>
                        <Link href="/notifications" className={`w-10 h-10 rounded-2xl flex items-center justify-center relative backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            {unreadCount > 0 && (
                                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                            )}
                            <Bell className={`w-5 h-5 ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`} />
                        </Link>
                        {/* Profile with Premium Frame */}
                        <Link href="/settings" className="relative">
                            {isPremium && (
                                <>
                                    {/* Gold Frame */}
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/30" />
                                    {/* Crown */}
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                                        <Crown className="w-4 h-4 text-amber-400 drop-shadow-lg" style={{ filter: 'drop-shadow(0 1px 2px rgba(251, 191, 36, 0.8))' }} />
                                    </div>
                                </>
                            )}
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25 relative ${isPremium ? 'ring-2 ring-amber-400/50' : ''}`}>
                                {userName.charAt(0).toUpperCase()}
                            </div>
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

            {/* Main Content - Same structure as married dashboard */}
            <div className="px-5 mt-4 space-y-6">
                {/* Partner Mood - Same as married dashboard */}
                {partnerMood && (
                    <div className={`rounded-2xl p-5 backdrop-blur-xl border transition-all ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-lg shadow-indigo-100/50' : 'bg-surface-800/50 border-surface-700/30'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-500/20 flex items-center justify-center">
                                <span className="text-3xl">
                                    {partnerMood.mood === 5 ? '🤩' : partnerMood.mood === 4 ? '🙂' : partnerMood.mood === 3 ? '😐' : partnerMood.mood === 2 ? '😞' : '😢'}
                                </span>
                            </div>
                            <div>
                                <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? `مزاج ${partnerName}` : `${partnerName}'s Mood`}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {partnerMood.mood >= 4
                                        ? (language === 'ar' ? 'مبسوط اليوم! 😉' : 'Feeling good! 😉')
                                        : partnerMood.mood <= 2
                                            ? (language === 'ar' ? 'يحتاج اهتمام ❤️' : 'Needs love ❤️')
                                            : (language === 'ar' ? 'الوضع مستقر 👍' : 'Doing okay 👍')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Wesal AI Bar - Same as married dashboard */}
                <Link href="/ai-coach" className="block">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`rounded-2xl p-4 backdrop-blur-xl border transition-all cursor-pointer ${theme === 'light'
                            ? 'bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-violet-100 shadow-lg shadow-violet-500/5'
                            : 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'رفيق وصال' : 'Wesal AI'}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'اضغط للدردشة مع رفيقك الذكي' : 'Tap to chat with your AI companion'}
                                </p>
                            </div>
                            <ArrowLeft className={`w-5 h-5 ${theme === 'light' ? 'text-violet-500' : 'text-violet-400'} ${isRTL ? '' : 'rotate-180'}`} />
                        </div>
                    </motion.div>
                </Link>

                {/* Check-in CTA - Same as married dashboard */}
                <Link href="/check-in">
                    <div className={`rounded-2xl p-4 relative overflow-hidden group backdrop-blur-xl border transition-all ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-md hover:shadow-lg' : 'bg-surface-800/50 border-surface-700/30 hover:border-violet-500/30'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'تسجيل الحالة اليومي' : 'Daily Check-in'}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? `شارك ${partnerName} مشاعرك` : `Share your feelings with ${partnerName}`}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
                                {isRTL ? <ArrowLeft className="w-6 h-6 text-white" /> : <ArrowRight className="w-6 h-6 text-white" />}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Actions Grid - Same layout as married dashboard */}
                <h2 className={`text-lg font-bold px-1 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                    {language === 'ar' ? 'نشاطات' : 'Activities'}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                    {actions.map((action, idx) => (
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
                                <h3 className={`font-bold text-lg mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {action.title}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {action.desc}
                                </p>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Breathe & Budget Cards */}
                <div className="grid grid-cols-2 gap-6 mt-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCoolDown(true)}
                        className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all cursor-pointer shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                            <Snowflake className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {language === 'ar' ? 'تنفس' : 'Breathe'}
                            </h3>
                            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {language === 'ar' ? 'استرخاء' : 'Relax'}
                            </p>
                        </div>
                    </motion.div>

                    <Link href="/budget">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'الميزانية' : 'Budget'}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'خطط الزفاف' : 'Wedding plans'}
                                </p>
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* Vision Board & Journeys Row */}
                <div className="grid grid-cols-2 gap-6 mt-4">
                    <Link href="/vision-board">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30'}`}
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
                                <ImagePlus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {language === 'ar' ? 'رؤيتنا' : 'Vision'}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'أحلامنا معاً' : 'Our dreams'}
                                </p>
                            </div>
                        </motion.div>
                    </Link>

                    <Link href="/journeys">
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
                                    {language === 'ar' ? 'رحلات' : 'Journeys'}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? 'تقارب أكثر' : 'Grow closer'}
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

            {/* Cool Down Modal */}
            <CoolDownModal isOpen={showCoolDown} onClose={() => setShowCoolDown(false)} />

            {/* Dashboard Chat - Same as married dashboard */}
            {coupleId && (
                <DashboardChat
                    coupleId={coupleId}
                    partnerName={partnerName}
                    isOpen={showChat}
                    onClose={() => setShowChat(false)}
                    isPartnerOnline={partnerStatus === 'online'}
                />
            )}
        </main>
    );
}
