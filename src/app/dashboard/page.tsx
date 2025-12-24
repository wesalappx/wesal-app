'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Heart,
    Gamepad2,
    Sparkles,
    Flame,
    ArrowRight,
    ArrowLeft,
    Shield,
    Smile,
    Lightbulb,
    Snowflake,
    Trophy,
    Calendar,
    Brain,
    Settings,
    Bell
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from '@/hooks/useTranslation';
import { useProgress } from '@/hooks/useProgress';
import { useNotifications } from '@/hooks/useNotifications';
import MarriageAdviceModal from '@/components/MarriageAdviceModal';
import CoolDownModal from '@/components/CoolDownModal';

export default function Dashboard() {
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const { theme } = useSettingsStore();
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';

    // User data from auth (with fallback)
    const userName = user?.user_metadata?.display_name || (language === 'ar' ? 'مستخدم' : 'User');

    const [partnerName, setPartnerName] = useState(language === 'ar' ? 'الشريك' : 'Partner');
    const [isPaired, setIsPaired] = useState(false);
    const [partnerStatus, setPartnerStatus] = useState<'online' | 'offline'>('offline');
    const [dailyWhisper, setDailyWhisper] = useState<string>('');
    const { progress } = useProgress(); // Real Streak
    const { unreadCount } = useNotifications(); // Real Notifications
    const [mounted, setMounted] = useState(false);
    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [showCoolDown, setShowCoolDown] = useState(false);
    const { playSound } = useSound();

    // Fallback if progress isn't loaded yet
    const currentStreak = progress?.streak || 0;

    useEffect(() => {
        setMounted(true);

        // Fetch partner info
        const fetchPartner = async () => {
            const { isPaired: paired, partner } = await getStatus();
            setIsPaired(paired);
            if (partner?.display_name) {
                setPartnerName(partner.display_name);
            }
        };
        fetchPartner();

        // Fetch Daily Whisper
        import('@/lib/ai').then(async (mod) => {
            const whisper = await mod.generateDailyWhisper(language === 'ar' ? 'ar' : 'en');
            setDailyWhisper(whisper);
        });

    }, [language]); // Re-fetch when language changes

    // Safe - White Saudi - Partner Neutral
    const actions = [
        {
            id: 'connect',
            title: language === 'ar' ? 'تقارب' : 'Connect',
            desc: language === 'ar' ? 'جلسة تقربنا أكثر' : 'Closer together',
            icon: Heart,
            color: 'bg-rose-500',
            href: '/journeys'
        },
        {
            id: 'resolve',
            title: language === 'ar' ? 'المستشار' : 'Counselor',
            desc: language === 'ar' ? 'حل الخلافات بهدوء' : 'Resolve conflicts',
            icon: Shield,
            color: 'bg-purple-500',
            href: '/conflict'
        },
        {
            id: 'play',
            title: language === 'ar' ? 'لعب وتحدي' : 'Play & Challenge',
            desc: language === 'ar' ? 'نغير جو وننبسط' : 'Have some fun',
            icon: Gamepad2,
            color: 'bg-amber-500',
            href: '/play'
        },
        {
            id: 'advice',
            title: language === 'ar' ? 'نصائح زوجية' : 'Marriage Advice',
            desc: language === 'ar' ? 'حكمة اليوم لك ولها' : 'Wisdom for today',
            icon: Lightbulb,
            color: 'bg-blue-500',
            action: () => setShowAdviceModal(true) // Special Action
        }
    ];

    const [partnerMood, setPartnerMood] = useState<any>(null);
    const supabase = createClient();

    function getGreeting(): string {
        const hour = new Date().getHours();
        if (language === 'ar') {
            if (hour < 12) return 'صباح الخير ☀️';
            if (hour < 17) return 'مساك الله بالخير 👋';
            return 'مساء الخير والرضا 🌙';
        } else {
            if (hour < 12) return 'Good Morning ☀️';
            if (hour < 17) return 'Good Afternoon 👋';
            return 'Good Evening 🌙';
        }
    }

    const greeting = getGreeting();

    // Store couple and partner IDs for presence
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);

        // Fetch partner info & Mood
        const fetchPartnerData = async () => {
            const { isPaired: paired, partner, coupleId: cId } = await getStatus();
            setIsPaired(paired);
            setCoupleId(cId || null);

            if (partner?.display_name) {
                setPartnerName(partner.display_name);
                setPartnerId(partner.id);
            }

            if (paired && partner?.id) {
                // Fetch Partner's last check-in
                const { data: checkIn } = await supabase
                    .from('check_ins')
                    .select('*')
                    .eq('user_id', partner.id)
                    .eq('shared_with_partner', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (checkIn) setPartnerMood(checkIn);
            }
        };
        fetchPartnerData();

        // Fetch Daily Whisper
        import('@/lib/ai').then(async (mod) => {
            const whisper = await mod.generateDailyWhisper(language === 'ar' ? 'ar' : 'en');
            setDailyWhisper(whisper);
        });

    }, [language]); // Re-fetch when language changes

    // Real-time Presence for partner online status
    useEffect(() => {
        if (!coupleId || !user || !partnerId) return;

        const presenceChannel = supabase.channel(`presence-couple-${coupleId}`);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                // Check if partner is present
                const partnerPresent = Object.values(state).some((presences: any) =>
                    presences.some((p: any) => p.user_id === partnerId)
                );
                setPartnerStatus(partnerPresent ? 'online' : 'offline');
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user) {
                    // Broadcast our presence
                    await presenceChannel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString()
                    });
                }
            });

        // Cleanup on unmount
        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [coupleId, user, partnerId]);

    if (!mounted) return null;

    return (
        <main className="min-h-screen p-4 pb-44 relative overflow-hidden font-sans bg-surface-900">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <div className="flex flex-col gap-6 mb-8 pt-4">
                {/* Top Bar: Brand & Actions */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-12 h-12 relative animate-fade-in">
                            <img src="/wesal-logo.svg" alt="Ws" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <span className={`text-2xl font-bold tracking-wide pb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {language === 'ar' ? 'وصال' : 'Wesal'}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCoolDown(true)}
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all ${theme === 'light' ? 'border-white' : 'border-white/20'} group`}
                            aria-label="Calm Down"
                        >
                            <Snowflake className="w-5 h-5 text-white animate-pulse" />
                        </button>
                        <Link href="/notifications" className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative border group ${theme === 'light' ? 'bg-white shadow border-slate-200 hover:bg-slate-50' : 'bg-surface-800/50 backdrop-blur-md border-surface-700/50 hover:bg-surface-700'}`}>
                            {unreadCount > 0 && (
                                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface-800" />
                            )}
                            <Bell className={`w-5 h-5 ${theme === 'light' ? 'text-slate-600' : 'text-surface-400 group-hover:text-white'}`} />
                        </Link>
                        <Link href="/settings" className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 p-[2px] hover:shadow-lg hover:shadow-primary-500/20 transition-all">
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold ${theme === 'light' ? 'bg-white text-primary-600' : 'bg-surface-900 text-white'}`}>
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Sub-Header: Greeting */}
                <div>
                    <h1 className={`text-3xl font-bold mb-2 leading-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        {greeting} ✨<br />
                        <span className={`text-2xl ${theme === 'light' ? 'text-primary-600' : 'text-primary-300'}`}>{userName}</span>
                    </h1>
                    <div className={`flex items-center gap-2 text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${partnerStatus === 'online' ? 'bg-green-400 animate-pulse' : (theme === 'light' ? 'bg-slate-400' : 'bg-surface-600')}`} />
                        {partnerStatus === 'online'
                            ? (language === 'ar' ? `${partnerName} متصل` : `${partnerName} is online`)
                            : (language === 'ar' ? `${partnerName} غير متصل` : `${partnerName} is offline`)}
                    </div>
                </div>
            </div>

            {/* Streak Banner */}
            <div className={`glass-card p-4 mb-8 flex items-center justify-between backdrop-blur-md relative overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200' : 'border-surface-700/30 bg-surface-800/40'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <p className={`text-xs mb-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {language === 'ar' ? 'أيام التواصل' : 'Streak Days'}
                        </p>
                        <p className={`font-bold text-lg ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {currentStreak} {language === 'ar' ? 'يوم متواصل' : 'Days Streak'}
                        </p>
                    </div>
                </div>
                <div className={`text-[10px] sm:text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${theme === 'light' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-surface-800/80 text-orange-300 border border-surface-700'}`}>
                    {language === 'ar' ? 'استمروا يا أبطال 🔥' : 'Keep it up! 🔥'}
                </div>
            </div>

            {/* PARTNER MOOD (TELEPATHY) */}
            {partnerMood && (
                <div className={`glass-card p-5 mb-6 relative overflow-hidden ${theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-surface-800/60 border-surface-700'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl">
                                {partnerMood.mood === 5 ? '🤩' : partnerMood.mood === 4 ? '🙂' : partnerMood.mood === 3 ? '😐' : partnerMood.mood === 2 ? '😞' : '😢'}
                            </span>
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm mb-1 ${theme === 'light' ? 'text-indigo-900' : 'text-indigo-200'}`}>
                                {language === 'ar' ? `مزاج ${partnerName} اليوم` : `${partnerName}'s Mood`}
                            </h3>
                            <p className={`text-xs ${theme === 'light' ? 'text-indigo-700' : 'text-surface-400'}`}>
                                {partnerMood.mood >= 4 ? (language === 'ar' ? 'مبسوط، فرصة تطلب اللي تبي! 😉' : 'Happy! Good time to ask for favors 😉') :
                                    partnerMood.mood <= 2 ? (language === 'ar' ? 'يحتاج شوية اهتمام ودلع ❤️' : 'Needs some extra love today ❤️') :
                                        (language === 'ar' ? 'الوضع مستقر وطبيعي 👍' : 'Stable and normal 👍')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Check-in CTA */}
            <Link href="/check-in">
                <div className={`glass-card p-6 mb-8 relative overflow-hidden group transition-all ${theme === 'light' ? 'bg-white border-slate-200 hover:border-primary-500/30 shadow-sm' : 'border-surface-700/30 hover:border-primary-500/30'}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-accent-600/20 opacity-0 group-hover:opacity-100 transition-duration-500" />
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all" />

                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className={`text-xl font-bold mb-2 group-hover:translate-x-1 transition-transform ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {t('dashboard.checkIn')}
                            </h3>
                            <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-surface-300 group-hover:text-surface-200'}`}>
                                {language === 'ar' ? `شارك ${partnerName} مشاعرك وحالتك اليوم` : `Share your feelings with ${partnerName}`}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30 group-hover:scale-110 group-hover:bg-primary-500 transition-all duration-300">
                            {isRTL ? <ArrowLeft className="w-6 h-6 text-white" /> : <ArrowRight className="w-6 h-6 text-white" />}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Quick Actions Grid */}
            <h2 className={`text-lg font-bold mb-4 px-1 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                {language === 'ar' ? 'نشاطات مقترحة' : 'Suggestions'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
                {actions.map((action, idx) => {
                    const CardContent = (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`glass-card p-5 h-full flex flex-col items-center text-center gap-3 group transition-all cursor-pointer ${theme === 'light' ? 'bg-white border-slate-200 hover:border-primary-500/30 shadow-sm' : 'border-surface-700/50 hover:border-primary-500/30'}`}
                            onClick={() => {
                                playSound('pop');
                                if (action.action) action.action();
                            }}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center shadow-lg mb-1 group-hover:scale-110 transition-transform`}>
                                <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {action.title}
                                </h3>
                                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {action.desc}
                                </p>
                            </div>
                        </motion.div>
                    );

                    return action.href ? (
                        <Link href={action.href} key={action.id}>
                            {CardContent}
                        </Link>
                    ) : (
                        <div key={action.id}>{CardContent}</div>
                    );
                })}
            </div>

            {/* New Features Section */}
            <h2 className={`text-lg font-bold mt-8 mb-4 px-1 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                {language === 'ar' ? 'اكتشف المزيد' : 'Discover More'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                <Link href="/calendar">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`glass-card p-4 flex items-center gap-3 transition-all ${theme === 'light' ? 'bg-white border-slate-200 hover:border-blue-500/30' : 'border-surface-700/50 hover:border-blue-500/30'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {language === 'ar' ? 'التقويم' : 'Calendar'}
                            </h3>
                            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {language === 'ar' ? 'جدولة مواعيد' : 'Plan dates'}
                            </p>
                        </div>
                    </motion.div>
                </Link>

                <Link href="/insights">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`glass-card p-4 flex items-center gap-3 transition-all ${theme === 'light' ? 'bg-white border-slate-200 hover:border-purple-500/30' : 'border-surface-700/50 hover:border-purple-500/30'}`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center shadow-lg">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                {t('nav.insights')}
                            </h3>
                            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {language === 'ar' ? 'تحليل علاقتكم' : 'Analyze connection'}
                            </p>
                        </div>
                    </motion.div>
                </Link>
            </div>

            {/* Daily Quote/Tip with AI */}
            <div className={`mt-8 glass-card p-6 border-surface-700/50 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-gradient-to-br from-surface-800 to-surface-900 '}`}>
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-1 animate-pulse" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-400 mb-2">
                            {language === 'ar' ? 'همسة اليوم (من الذكاء الاصطناعي)' : 'Daily Whisper (AI)'}
                        </h4>
                        <p className={`text-sm italic leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                            {dailyWhisper || (language === 'ar' ? 'جارٍ جلب الحكمة...' : 'Fetching wisdom...')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Marriage Advice Modal */}
            <MarriageAdviceModal
                isOpen={showAdviceModal}
                onClose={() => setShowAdviceModal(false)}
            />

            {/* Cool Down Modal */}
            <CoolDownModal
                isOpen={showCoolDown}
                onClose={() => setShowCoolDown(false)}
            />
        </main>
    );
}
