'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AIProbeCard from '@/components/AIProbeCard';
import SparkResultCard from '@/components/SparkResultCard';
import KhatbaDashboard from '@/components/KhatbaDashboard';
import { useRelationshipStage } from '@/hooks/useRelationshipStage';
import {
    Heart,
    Gamepad2,
    Sparkles,
    Flame,
    ArrowRight,
    ArrowLeft,
    Shield,
    Lightbulb,
    Snowflake,
    Calendar,
    Brain,
    Bell,
    Crown,
    MessageCircleHeart,
    StickyNote,
    Bot
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
import SecretSparkInput from '@/components/SecretSparkInput';
import DashboardChat from '@/components/DashboardChat';

export default function Dashboard() {
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const { theme } = useSettingsStore();
    const supabase = createClient();
    const { stage, isLoading: stageLoading, isKhatba } = useRelationshipStage();

    const { t, language } = useTranslation();
    const isRTL = language === 'ar';

    const userName = user?.user_metadata?.display_name || (language === 'ar' ? 'مستخدم' : 'User');

    const [partnerName, setPartnerName] = useState(language === 'ar' ? 'الشريك' : 'Partner');
    const [isPaired, setIsPaired] = useState(false);
    const [partnerStatus, setPartnerStatus] = useState<'online' | 'offline'>('offline');
    const [dailyWhisper, setDailyWhisper] = useState<string>('');
    const { progress } = useProgress();
    const { unreadCount } = useNotifications();
    const [mounted, setMounted] = useState(false);
    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [showCoolDown, setShowCoolDown] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const { playSound } = useSound();
    const [isPremium, setIsPremium] = useState(false);

    const currentStreak = progress?.streak || 0;

    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerMood, setPartnerMood] = useState<any>(null);


    // Actions grid - main activities
    const actions = [
        {
            id: 'connect',
            title: language === 'ar' ? 'تقارب' : 'Connect',
            desc: language === 'ar' ? 'جلسة تقربنا أكثر' : 'Closer together',
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
            href: '/journeys'
        },
        {
            id: 'resolve',
            title: language === 'ar' ? 'المستشار' : 'Counselor',
            desc: language === 'ar' ? 'حل الخلافات بهدوء' : 'Resolve conflicts',
            icon: Shield,
            gradient: 'from-violet-500 to-purple-600',
            href: '/conflict'
        },
        {
            id: 'play',
            title: language === 'ar' ? 'لعب وتحدي' : 'Play',
            desc: language === 'ar' ? 'نغير جو وننبسط' : 'Have fun together',
            icon: Gamepad2,
            gradient: 'from-amber-500 to-orange-600',
            href: '/play'
        },
        {
            id: 'advice',
            title: language === 'ar' ? 'نصائح' : 'Tips',
            desc: language === 'ar' ? 'حكمة اليوم' : 'Daily wisdom',
            icon: Lightbulb,
            gradient: 'from-cyan-500 to-blue-600',
            href: '#',
            action: () => setShowAdviceModal(true)
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

    const [pendingSparks, setPendingSparks] = useState<any[]>([]);
    const [mySparks, setMySparks] = useState<any[]>([]);

    const greeting = getGreeting();

    useEffect(() => {
        setMounted(true);

        const fetchData = async () => {
            const { isPaired: paired, partner, coupleId: cId } = await getStatus();

            setIsPaired(paired);
            setCoupleId(cId || null);

            if (partner?.id) {
                setPartnerId(partner.id);
                setPartnerName(partner.display_name || partner.email?.split('@')[0] || '');
            }

            // Fetch subscription status via API (bypasses RLS)
            try {
                const subRes = await fetch('/api/subscription/status');
                const subData = await subRes.json();
                setIsPremium(subData.isPremium === true);
            } catch (err) {
                console.error('Error fetching subscription:', err);
                setIsPremium(false);
            }

            // Fetch pending sparks for partner (AI_PROPOSING)
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser) {
                const { data: sparks } = await supabase
                    .from('secret_sparks')
                    .select('*')
                    .eq('partner_id', currentUser.id)
                    .eq('status', 'AI_PROPOSING');

                if (sparks) setPendingSparks(sparks);

                // Fetch my own sparks (ones I created) to see their status
                const { data: myOwnSparks } = await supabase
                    .from('secret_sparks')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .in('status', ['NEW', 'AI_PROPOSING', 'PARTNER_REPLIED', 'REVEALED', 'SOFT_REJECTED'])
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (myOwnSparks) setMySparks(myOwnSparks);
            }

            // Fetch Partner Mood (Check-in)
            if (isPaired && partner?.id) {
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

            // Fetch Daily Whisper
            try {
                const mod = await import('@/lib/ai');
                const whisper = await Promise.race([
                    mod.generateDailyWhisper(language === 'ar' ? 'ar' : 'en'),
                    new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 10000))
                ]);
                setDailyWhisper(whisper as string);
            } catch (e) {
                setDailyWhisper(language === 'ar'
                    ? '"الحب هو أن تجد في الآخر ما يكملك" 💕'
                    : '"Love is finding in another what completes you" 💕');
            }
        };

        fetchData();
    }, [supabase, language]);

    // Real-time Presence
    useEffect(() => {
        if (!coupleId || !user?.id || !partnerId) return;

        let heartbeatInterval: NodeJS.Timeout;
        const channelName = `presence-couple-${coupleId}`;
        const presenceChannel = supabase.channel(channelName);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                let partnerFound = false;
                Object.values(state).forEach((presences: any) => {
                    if (Array.isArray(presences)) {
                        presences.forEach((p: any) => {
                            if (p.user_id === partnerId) {
                                partnerFound = true;
                            }
                        });
                    }
                });
                setPartnerStatus(partnerFound ? 'online' : 'offline');
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                if (newPresences?.some((p: any) => p.user_id === partnerId)) {
                    setPartnerStatus('online');
                }
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                if (leftPresences?.some((p: any) => p.user_id === partnerId)) {
                    setPartnerStatus('offline');
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user?.id) {
                    try {
                        await presenceChannel.track({
                            user_id: user.id,
                            online_at: new Date().toISOString()
                        });
                    } catch (e) {
                        console.error('Presence track error:', e);
                    }

                    heartbeatInterval = setInterval(async () => {
                        try {
                            await presenceChannel.track({
                                user_id: user.id,
                                online_at: new Date().toISOString()
                            });
                        } catch (e) { }
                    }, 20000);
                }
            });

        return () => {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [coupleId, user?.id, partnerId]);

    if (!mounted) return null;

    // Render Khatba Dashboard for pre-marriage users
    if (isKhatba) {
        return (
            <KhatbaDashboard
                userName={userName}
                partnerName={partnerName}
                isPaired={isPaired}
                partnerStatus={partnerStatus}
                isPremium={isPremium}
                coupleId={coupleId}
                partnerId={partnerId}
                partnerMood={partnerMood}
            />
        );
    }

    // Married Dashboard (Original)
    return (
        <main className={`min-h-screen pb-8 relative overflow-hidden font-sans transition-colors duration-500 ${theme === 'light' ? 'bg-transparent text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background Gradient & Brand Blobs */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] blur-3xl opacity-60 rounded-full mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-gradient-radial from-primary-200/60 via-primary-100/20 to-transparent'
                    : 'bg-gradient-radial from-primary-500/10 via-transparent to-transparent'
                    }`} />
                <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-60 mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-accent-200/60'
                    : 'bg-accent-500/5'
                    }`} />
                <div className={`absolute top-1/3 left-0 w-72 h-72 rounded-full blur-3xl opacity-40 mix-blend-multiply filter transition-all duration-1000 ${theme === 'light'
                    ? 'bg-rose-200/50'
                    : 'bg-rose-500/5'
                    }`} />
            </div>

            {/* Header */}
            <div className="px-5 pt-8 pb-4">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative">
                            <img src="/wesal-logo.svg" alt="Wesal" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {language === 'ar' ? 'وصال' : 'Wesal'}
                            </span>
                            {isPremium && (
                                <Crown className="w-4 h-4 text-amber-500" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/notes" className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all shadow-sm ${theme === 'light' ? 'bg-white/50 border-white/40 hover:bg-white/80' : 'bg-surface-800/60 border-surface-700/50 hover:bg-surface-700/60'}`}>
                            <StickyNote className="w-5 h-5 text-amber-500" />
                        </Link>
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
                        <Link href="/settings" className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/25">
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
                {/* Partner Mood */}
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

                {/* Wesal AI Bar */}
                <Link href="/ai-coach" className="block">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`rounded-2xl p-4 backdrop-blur-xl border transition-all cursor-pointer ${theme === 'light'
                            ? 'bg-gradient-to-r from-primary-50/80 to-accent-50/80 border-primary-100 shadow-lg shadow-primary-500/5'
                            : 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/30 hover:border-primary-500/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
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
                            <ArrowLeft className={`w-5 h-5 ${theme === 'light' ? 'text-primary-500' : 'text-primary-400'} ${isRTL ? '' : 'rotate-180'}`} />
                        </div>
                    </motion.div>
                </Link>

                {/* Check-in CTA */}
                <Link href="/check-in">
                    <div className={`rounded-2xl p-4 relative overflow-hidden group backdrop-blur-xl border transition-all ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-md hover:shadow-lg' : 'bg-surface-800/50 border-surface-700/30 hover:border-primary-500/30'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className={`font-bold mb-1 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {t('dashboard.checkIn')}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {language === 'ar' ? `شارك ${partnerName} مشاعرك` : `Share your feelings with ${partnerName}`}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
                                {isRTL ? <ArrowLeft className="w-6 h-6 text-white" /> : <ArrowRight className="w-6 h-6 text-white" />}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Actions Grid - Glassmorphic Cards */}
                <h2 className={`text-lg font-bold px-1 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                    {language === 'ar' ? 'نشاطات' : 'Activities'}
                </h2>
                <div className="grid grid-cols-2 gap-6">
                    {actions.map((action, idx) => {
                        const CardContent = (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-2xl p-5 h-full backdrop-blur-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${theme === 'light' ? 'bg-white/60 border-white/50 hover:bg-white/80' : 'bg-surface-800/50 border-surface-700/30 hover:border-primary-500/30'}`}
                                onClick={() => {
                                    playSound('pop');
                                    if (action.action) action.action();
                                }}
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
                        );

                        return action.href !== '#' ? (
                            <Link href={action.href} key={action.id}>
                                {CardContent}
                            </Link>
                        ) : (
                            <div key={action.id}>{CardContent}</div>
                        );
                    })}
                </div>

                {/* Breathe & Whisper Cards */}
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

                {/* Secret Spark Button */}
                <div className="flex justify-end mb-6">
                    <SecretSparkInput />
                </div>

                {/* AI Probes (Questions from Partner) */}
                <AnimatePresence>
                    {pendingSparks.map(spark => (
                        <div key={spark.id} className="mb-6">
                            <AIProbeCard
                                sparkId={spark.id}
                                question={spark.ai_probe_question}
                                category={spark.category}
                                onRespond={() => {
                                    setPendingSparks(prev => prev.filter(p => p.id !== spark.id));
                                }}
                            />
                        </div>
                    ))}
                </AnimatePresence>

                {/* My Sparks Status (Requester's view of their own sparks) */}
                {mySparks.length > 0 && (
                    <div className="mb-6">
                        <h3 className={`text-sm font-bold mb-3 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                            {language === 'ar' ? '✨ رغباتي السرية' : '✨ My Secret Sparks'}
                        </h3>
                        <div className="space-y-3">
                            {mySparks.map(spark => (
                                <SparkResultCard
                                    key={spark.id}
                                    status={spark.status}
                                    content={spark.content}
                                    category={spark.category}
                                    partnerResponse={spark.partner_response}
                                    finalVerdict={spark.final_verdict}
                                    createdAt={spark.created_at}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Daily Whisper - Static */}
                <div className={`rounded-2xl p-5 mt-4 backdrop-blur-xl border ${theme === 'light' ? 'bg-white/60 border-amber-100 shadow-lg shadow-amber-500/5' : 'bg-surface-800/50 border-surface-700/30'}`}>
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-400 mb-2">
                                {language === 'ar' ? 'همسة اليوم' : 'Daily Whisper'}
                            </h4>
                            <p className={`text-sm italic leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                {dailyWhisper || (language === 'ar' ? 'جارٍ جلب الحكمة...' : 'Fetching wisdom...')}
                            </p>
                        </div>
                    </div>
                </div >
            </div >

            {/* Modals */}
            <DashboardChat
                coupleId={coupleId || ''}
                partnerName={partnerName}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                isPartnerOnline={partnerStatus === 'online'}
            />
            < MarriageAdviceModal isOpen={showAdviceModal} onClose={() => setShowAdviceModal(false)} />
            < CoolDownModal isOpen={showCoolDown} onClose={() => setShowCoolDown(false)} />
        </main >
    );
}
