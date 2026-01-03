'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
    Bell,
    Shield,
    Key,
    LogOut,
    Settings,
    UserMinus,
    Users,
    Heart,
    Trash2,
    CreditCard,
    Crown,
    Flame,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { ToggleSwitch } from '@/components/SettingsCard';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { usePairing } from '@/hooks/usePairing';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useProgress } from '@/hooks/useProgress';
import { soundManager } from '@/lib/sounds';

export default function SettingsPage() {
    const { t, language } = useTranslation();
    const {
        notificationsEnabled, setNotificationsEnabled
    } = useSettingsStore();

    const supabase = createClient();
    const { user: authUser, signOut } = useAuth();
    const { getStatus, unpair, isLoading: unpairLoading } = usePairing();
    const { progress } = useProgress();

    const [partnerInfo, setPartnerInfo] = useState<{ name: string; isPaired: boolean } | null>(null);
    const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
    const [soundVolume, setSoundVolume] = useState(soundManager.getVolume());
    const [subscription, setSubscription] = useState<{
        isPremium: boolean;
        expiresAt: string | null;
        plan: string;
    } | null>(null);

    // Fetch partner info and subscription
    useEffect(() => {
        const fetchData = async () => {
            // Partner info
            const { isPaired, partner, coupleId } = await getStatus();
            setPartnerInfo({
                name: partner?.display_name || '',
                isPaired
            });

            // Subscription info
            if (coupleId) {
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('couple_id', coupleId)
                    .eq('status', 'active')
                    .single();

                if (sub) {
                    setSubscription({
                        isPremium: true,
                        expiresAt: sub.expires_at,
                        plan: sub.plan_type || 'premium'
                    });
                } else {
                    setSubscription({
                        isPremium: false,
                        expiresAt: null,
                        plan: 'free'
                    });
                }
            }
        };
        fetchData();
    }, []);

    const handleUnpair = async () => {
        const { success } = await unpair();
        if (success) {
            setPartnerInfo({ name: '', isPaired: false });
            setShowUnpairConfirm(false);
        }
    };

    const user = {
        name: authUser?.user_metadata?.display_name || (language === 'ar' ? 'مستخدم' : 'User'),
        email: authUser?.email || '',
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const { theme } = useSettingsStore();

    const isRTL = language === 'ar';

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${theme === 'light'
            ? 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900'
            : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 text-white'
            }`}>
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] animate-pulse ${theme === 'light' ? 'bg-indigo-300/20' : 'bg-primary-500/10'
                    }`} />
                <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] animate-pulse delay-1000 ${theme === 'light' ? 'bg-rose-300/20' : 'bg-accent-500/10'
                    }`} />
            </div>

            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${theme === 'light'
                ? 'bg-white/70 border-slate-200/60'
                : 'bg-surface-900/80 border-surface-700/30'
                }`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/10 text-white'
                        }`}>
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Link>
                    <h1 className="text-xl font-bold">{t('settings.title')}</h1>
                    <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${theme === 'light'
                        ? 'bg-white border border-slate-100 shadow-slate-200'
                        : 'bg-gradient-to-br from-gray-500 to-gray-700'
                        }`}>
                        <Settings className={`w-5 h-5 ${theme === 'light' ? 'text-slate-600' : 'text-white'}`} />
                    </div>
                </div>
            </header>

            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-8 relative z-10"
            >
                {/* Profile Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {t('common.profile')}
                    </h2>

                    <div className={`p-6 rounded-3xl border transition-all ${theme === 'light'
                        ? 'bg-white/80 border-white/50 shadow-xl shadow-indigo-100/50'
                        : 'glass-card border-surface-700/50'
                        }`}>
                        <div className="flex items-center gap-5">
                            {authUser?.user_metadata?.avatar_url ? (
                                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl">
                                    <img
                                        src={authUser.user_metadata.avatar_url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl ${theme === 'light'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/30'
                                    : 'bg-gradient-to-br from-primary-400 to-accent-500'
                                    }`}>
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <h3 className={`text-xl font-bold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user.name}</h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>{user.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Link
                                href="/settings/profile"
                                className={`block w-full py-3 text-center rounded-xl font-medium border transition-colors ${theme === 'light'
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                    : 'bg-surface-800/50 border-white/5 text-white hover:bg-surface-700/50 hover:border-white/10'
                                    }`}
                            >
                                {t('settings.editProfile')}
                            </Link>
                            {partnerInfo?.isPaired ? (
                                <Link
                                    href="/settings/partner"
                                    className="block w-full py-3 text-center rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 font-medium hover:bg-green-500/20 transition-colors"
                                >
                                    {isRTL
                                        ? `مع ${partnerInfo.name || 'شريكك'}`
                                        : `With ${partnerInfo.name || 'Partner'}`}
                                </Link>
                            ) : (
                                <Link
                                    href="/pairing"
                                    className="block w-full py-3 text-center rounded-xl bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 border border-primary-500/30 transition-colors font-medium"
                                >
                                    {isRTL ? 'ربط الشريك' : 'Link Partner'}
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Streak Counter Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {isRTL ? 'سلسلة التواصل' : 'Connection Streak'}
                    </h2>
                    <div className={`p-5 rounded-2xl border transition-all ${theme === 'light'
                        ? 'bg-white/80 border-white/50 shadow-lg shadow-orange-500/5'
                        : 'glass-card border-surface-700/50'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Flame className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <h3 className={`font-bold text-2xl ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                    {progress?.streak || 0} <span className={`text-sm font-normal ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{isRTL ? 'أيام' : 'days'}</span>
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {isRTL ? 'استمروا في التواصل!' : 'Keep connecting!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {isRTL ? 'الاشتراك' : 'Subscription'}
                    </h2>

                    <div className={`p-5 rounded-2xl border transition-all ${subscription?.isPremium
                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                        : theme === 'light'
                            ? 'bg-white/80 border-white/50 shadow-sm'
                            : 'glass-card border-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${subscription?.isPremium
                                ? 'bg-amber-500/20'
                                : theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'
                                }`}>
                                {subscription?.isPremium ? (
                                    <Crown className="w-6 h-6 text-amber-500" />
                                ) : (
                                    <CreditCard className={`w-6 h-6 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                )}
                            </div>
                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                    {subscription?.isPremium
                                        ? (isRTL ? 'اشتراك مميز' : 'Premium')
                                        : (isRTL ? 'اشتراك مجاني' : 'Free Plan')}
                                </h3>
                                {subscription?.isPremium && subscription.expiresAt ? (
                                    <p className="text-sm text-amber-500/80">
                                        {isRTL ? 'صالح حتى: ' : 'Valid until: '}
                                        {new Date(subscription.expiresAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                    </p>
                                ) : (
                                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                        {isRTL ? 'ترقية للحصول على ميزات إضافية' : 'Upgrade for more features'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!subscription?.isPremium && (
                            <Link
                                href="/settings/upgrade"
                                className="mt-4 block w-full py-3 text-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/20"
                            >
                                {isRTL ? 'ترقية الآن ✨' : 'Upgrade Now ✨'}
                            </Link>
                        )}
                    </div>
                </motion.section>

                {/* Preferences Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {t('settings.preferences')}
                    </h2>

                    <div className="space-y-2">

                        {/* Appearance / Theme */}
                        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === 'light'
                            ? 'bg-white border-slate-100 shadow-sm'
                            : 'glass-card border-surface-700/50'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-orange-50' : 'bg-orange-500/20'
                                    }`}>
                                    {theme === 'dark' ? (
                                        <div className="w-5 h-5 text-orange-400">🌙</div>
                                    ) : (
                                        <div className="w-5 h-5 text-yellow-500">☀️</div>
                                    )}
                                </div>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                        {t('settings.appearance') === 'settings.appearance' ? (isRTL ? 'المظهر' : 'Appearance') : t('settings.appearance')}
                                    </p>
                                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                        {theme === 'dark'
                                            ? (isRTL ? 'الوضع الليلي' : 'Dark Mode')
                                            : (isRTL ? 'الوضع النهاري' : 'Light Mode')}
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={theme === 'dark'}
                                onChange={(isDark) => useSettingsStore.getState().setTheme(isDark ? 'dark' : 'light')}
                            />
                        </div>

                        {/* Notifications */}
                        <div className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === 'light'
                            ? 'bg-white border-slate-100 shadow-sm'
                            : 'glass-card border-surface-700/50'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-500/20'
                                    }`}>
                                    <Bell className={`w-5 h-5 ${theme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
                                </div>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('settings.notifications')}</p>
                                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                        {notificationsEnabled ? t('common.enabled') : t('common.disabled')}
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={notificationsEnabled}
                                onChange={setNotificationsEnabled}
                            />
                        </div>

                        {/* Sound Effects */}
                        <div className={`p-4 rounded-2xl border transition-all ${theme === 'light'
                            ? 'bg-white border-slate-100 shadow-sm'
                            : 'glass-card border-surface-700/50'
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-purple-50' : 'bg-purple-500/20'
                                        }`}>
                                        <Sparkles className={`w-5 h-5 ${theme === 'light' ? 'text-purple-500' : 'text-purple-400'}`} />
                                    </div>
                                    <div className={isRTL ? 'text-right' : 'text-left'}>
                                        <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'الأصوات' : 'Sound Effects'}</p>
                                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            {soundEnabled ? (isRTL ? 'مفعل' : 'Enabled') : (isRTL ? 'معطل' : 'Disabled')}
                                        </p>
                                    </div>
                                </div>
                                <ToggleSwitch
                                    enabled={soundEnabled}
                                    onChange={(enabled) => {
                                        setSoundEnabled(enabled);
                                        soundManager.setEnabled(enabled);
                                        if (enabled) soundManager.play('click');
                                    }}
                                />
                            </div>

                            {soundEnabled && (
                                <div className={`mt-3 pt-3 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            {isRTL ? 'مستوى الصوت' : 'Volume'}
                                        </span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={soundVolume * 100}
                                            onChange={(e) => {
                                                const vol = parseInt(e.target.value) / 100;
                                                setSoundVolume(vol);
                                                soundManager.setVolume(vol);
                                            }}
                                            className={`flex-1 h-2 rounded-full outline-none appearance-none cursor-pointer
                                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500
                                                [&::-webkit-slider-thumb]:cursor-pointer
                                                ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'}`}
                                        />
                                        <span className={`text-sm min-w-[3rem] text-right ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>
                                            {Math.round(soundVolume * 100)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* Security Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {t('settings.security')}
                    </h2>

                    <div className="space-y-2">
                        <Link href="/settings/password" className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === 'light'
                            ? 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                            : 'glass-card border-surface-700/50 hover:bg-white/5'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-amber-50' : 'bg-amber-500/20'
                                    }`}>
                                    <Key className="w-5 h-5 text-amber-400" />
                                </div>
                                <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('settings.password')}</p>
                            </div>
                            {isRTL ? <ArrowLeft className="w-5 h-5 opacity-50" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
                        </Link>

                        <Link href="/settings/privacy" className={`p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === 'light'
                            ? 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                            : 'glass-card border-surface-700/50 hover:bg-white/5'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-teal-50' : 'bg-teal-500/20'
                                    }`}>
                                    <Shield className="w-5 h-5 text-teal-400" />
                                </div>
                                <p className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('settings.privacy')}</p>
                            </div>
                            {isRTL ? <ArrowLeft className="w-5 h-5 opacity-50" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
                        </Link>
                    </div>
                </motion.section>

                {/* Danger Zone */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className={`text-sm font-bold px-1 ${theme === 'light' ? 'text-rose-600/80' : 'text-red-400/70'}`}>
                        {isRTL ? 'منطقة الخطر' : 'Danger Zone'}
                    </h2>

                    <div className="space-y-2">
                        {partnerInfo?.isPaired && (
                            !showUnpairConfirm ? (
                                <button
                                    onClick={() => setShowUnpairConfirm(true)}
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all group ${theme === 'light'
                                        ? 'bg-white border-slate-100 shadow-sm hover:bg-rose-50'
                                        : 'glass-card border-surface-700/50 hover:bg-red-500/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-rose-50 text-rose-500' : 'bg-red-500/10 group-hover:bg-red-500/20'
                                            }`}>
                                            <UserMinus className={`w-5 h-5 ${theme === 'light' ? 'text-rose-500' : 'text-red-400'}`} />
                                        </div>
                                        <p className={`font-medium ${theme === 'light' ? 'text-rose-600' : 'text-red-400'}`}>{isRTL ? 'إلغاء الربط' : 'Unpair Partner'}</p>
                                    </div>
                                </button>
                            ) : (
                                <div className={`p-4 rounded-2xl space-y-3 border ${theme === 'light'
                                    ? 'bg-rose-50 border-rose-200'
                                    : 'glass-card border-red-500/30 bg-red-500/5'
                                    }`}>
                                    <p className={`text-sm text-center ${theme === 'light' ? 'text-rose-700' : 'text-red-200'}`}>
                                        {isRTL ? 'هل أنت متأكد؟ سيتم فصل الحسابين عن بعضهما.' : 'Are you sure? This will disconnect your accounts.'}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowUnpairConfirm(false)}
                                            className={`flex-1 p-2 rounded-lg text-sm font-bold transition-colors ${theme === 'light'
                                                ? 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
                                                : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                                                }`}
                                        >
                                            {isRTL ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleUnpair}
                                            disabled={unpairLoading}
                                            className="flex-1 p-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-sm font-bold"
                                        >
                                            {unpairLoading ? '...' : (isRTL ? 'نعم، ألغِ الربط' : 'Yes, Unpair')}
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        <Link
                            href="/settings/delete-account"
                            className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all group ${theme === 'light'
                                ? 'bg-white border-slate-100 shadow-sm hover:bg-rose-50'
                                : 'glass-card border-surface-700/50 hover:bg-red-500/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-rose-50 text-rose-500' : 'bg-red-500/10 group-hover:bg-red-500/20'
                                    }`}>
                                    <Trash2 className={`w-5 h-5 ${theme === 'light' ? 'text-rose-500' : 'text-red-400'}`} />
                                </div>
                                <p className={`font-medium ${theme === 'light' ? 'text-rose-600' : 'text-red-400'}`}>{isRTL ? 'حذف الحساب' : 'Delete Account'}</p>
                            </div>
                            {isRTL ? <ArrowLeft className="w-5 h-5 opacity-50 text-rose-400" /> : <ArrowRight className="w-5 h-5 opacity-50 text-rose-400" />}
                        </Link>

                        <button
                            onClick={() => signOut()}
                            className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${theme === 'light'
                                ? 'bg-white border-slate-100 shadow-sm hover:bg-slate-50'
                                : 'glass-card border-surface-700/50 hover:bg-surface-700/50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'
                                    }`}>
                                    <LogOut className={`w-5 h-5 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`} />
                                </div>
                                <p className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>{t('settings.logout')}</p>
                            </div>
                        </button>
                    </div>
                </motion.section>
            </motion.main>
        </div>
    );
}
