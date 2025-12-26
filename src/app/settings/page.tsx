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
    Users
} from 'lucide-react';
import Link from 'next/link';
import SettingsCard, { ToggleSwitch } from '@/components/SettingsCard';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { usePairing } from '@/hooks/usePairing';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const { t, language } = useTranslation();
    const {
        theme,
        language: currentLanguage,
        notificationsEnabled, setNotificationsEnabled
    } = useSettingsStore();

    const { user: authUser, signOut } = useAuth();
    const { getStatus, unpair, isLoading: unpairLoading } = usePairing();

    const [partnerInfo, setPartnerInfo] = useState<{ name: string; isPaired: boolean } | null>(null);
    const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);

    // Fetch partner info
    useEffect(() => {
        const fetchPartner = async () => {
            const { isPaired, partner } = await getStatus();
            setPartnerInfo({
                name: partner?.display_name || '',
                isPaired
            });
        };
        fetchPartner();
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

    const isRTL = language === 'ar';

    return (
        <div className="min-h-screen font-sans bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 text-white">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-surface-700/30">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Link>
                    <h1 className="text-xl font-bold">{t('settings.title')}</h1>
                    <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-lg`}>
                        <Settings className="w-5 h-5 text-white" />
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
                    <h2 className="text-sm font-bold text-surface-400 px-1">
                        {t('common.profile')}
                    </h2>

                    <div className="p-6 rounded-3xl glass-card border-surface-700/50">
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
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                                <p className="text-surface-300 text-sm">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Link
                                href="/settings/profile"
                                className="block w-full py-3 text-center rounded-xl bg-surface-800/50 hover:bg-surface-700/50 border border-white/5 hover:border-white/10 text-white transition-colors font-medium"
                            >
                                {t('settings.editProfile')}
                            </Link>
                            {partnerInfo?.isPaired ? (
                                <div className="block w-full py-3 text-center rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 font-medium cursor-default">
                                    {isRTL
                                        ? `مرتبط مع ${partnerInfo.name || 'شريكك'}`
                                        : `Paired: ${partnerInfo.name || 'Partner'}`}
                                </div>
                            ) : (
                                <Link
                                    href="/pairing"
                                    className="block w-full py-3 text-center rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/30 transition-colors font-medium"
                                >
                                    {isRTL ? 'ربط الشريك' : 'Link Partner'}
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.section>

                <button
                    onClick={() => setShowUnpairConfirm(true)}
                    className="w-full p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    <UserMinus className="w-4 h-4" />
                    {isRTL ? 'إلغاء الربط' : 'Unpair'}
                </button>

                {/* Partner Section */}
                {partnerInfo?.isPaired && (
                    <motion.section variants={itemVariants} className="space-y-3">
                        <h2 className="text-sm font-bold text-surface-400 px-1">
                            {isRTL ? 'الشريك' : 'Partner'}
                        </h2>

                        <div className="p-5 rounded-2xl glass-card border-surface-700/50">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <p className="text-surface-400 text-sm">
                                        {isRTL ? 'مرتبط مع' : 'Paired with'}
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {partnerInfo.name || (isRTL ? 'الشريك' : 'Partner')}
                                    </p>
                                </div>
                            </div>

                            ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-center text-surface-300">
                                    {isRTL ? 'هل أنت متأكد؟ سيتم إلغاء الربط بينكما.' : 'Are you sure? This will unpair you both.'}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowUnpairConfirm(false)}
                                        className="flex-1 p-3 rounded-xl bg-surface-800 text-surface-300 hover:bg-surface-700 transition-colors font-medium"
                                    >
                                        {isRTL ? 'إلغاء' : 'Cancel'}
                                    </button>
                                    <button
                                        onClick={handleUnpair}
                                        disabled={unpairLoading}
                                        className="flex-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-500 transition-colors font-medium"
                                    >
                                        {unpairLoading ? '...' : (isRTL ? 'نعم، ألغِ الربط' : 'Yes, Unpair')}
                                    </button>
                                </div>
                            </div>
                            )}
                        </div>
                    </motion.section>
                )}

                {/* Preferences Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className="text-sm font-bold text-surface-400 px-1">
                        {t('settings.preferences')}
                    </h2>

                    <div className="space-y-2">
                        {/* Notifications */}
                        <div className="p-4 rounded-2xl flex items-center justify-between glass-card">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className={isRTL ? 'text-right' : 'text-left'}>
                                    <p className="font-medium">{t('settings.notifications')}</p>
                                    <p className="text-sm text-surface-400">
                                        {notificationsEnabled ? t('common.enabled') : t('common.disabled')}
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch
                                enabled={notificationsEnabled}
                                onChange={setNotificationsEnabled}
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Security Section */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <h2 className="text-sm font-bold text-surface-400 px-1">
                        {t('settings.security')}
                    </h2>

                    <div className="space-y-2">
                        <Link href="/settings/password" className="p-4 rounded-2xl flex items-center justify-between glass-card hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                    <Key className="w-5 h-5 text-amber-400" />
                                </div>
                                <p className="font-medium">{t('settings.password')}</p>
                            </div>
                            {isRTL ? <ArrowLeft className="w-5 h-5 opacity-50" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
                        </Link>

                        <Link href="/settings/privacy" className="p-4 rounded-2xl flex items-center justify-between glass-card hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-teal-400" />
                                </div>
                                <p className="font-medium">{t('settings.privacy')}</p>
                            </div>
                            {isRTL ? <ArrowLeft className="w-5 h-5 opacity-50" /> : <ArrowRight className="w-5 h-5 opacity-50" />}
                        </Link>
                    </div>
                </motion.section>

                {/* Danger Zone */}
                <motion.section variants={itemVariants} className="space-y-3">
                    <div className="space-y-2">
                        <button
                            onClick={() => signOut()}
                            className="w-full p-4 rounded-2xl flex items-center justify-between glass-card hover:bg-red-500/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                </div>
                                <p className="font-medium text-red-400">{t('settings.logout')}</p>
                            </div>
                        </button>
                    </div>
                </motion.section>
            </motion.main>
        </div>
    );
}
