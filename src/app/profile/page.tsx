'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    User,
    Settings,
    Bell,
    Moon,
    Sun,
    LogOut,
    ChevronLeft,
    Camera,
    Heart,
    Shield,
    Award,
    Edit3
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { ToggleSwitch } from '@/components/SettingsCard';
import { useSettingsStore } from '@/stores/settings-store';
import { useAuth } from '@/hooks/useAuth';

// ... imports
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePage() {
    const { playSound } = useSound();
    const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useSettingsStore();
    const { user, signOut } = useAuth();
    const { t } = useTranslation();

    const toggleNotifications = (enabled: boolean) => {
        playSound('click');
        setNotificationsEnabled(enabled);
    };

    const toggleDarkMode = (enabled: boolean) => {
        playSound('click');
        setTheme(enabled ? 'dark' : 'light');
    };

    return (
        <main className="min-h-screen p-4 pb-44 relative overflow-hidden font-sans">
            {/* Background - Safe Abstract Only */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md mx-auto pt-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 -mr-2 text-surface-400 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6 rotate-180" />
                    </Link>
                    <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 mb-6 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-500/20 to-accent-500/20" />

                    <div className="relative mb-4">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-accent-400 p-1">
                            <div className="w-full h-full rounded-full bg-surface-800 flex items-center justify-center text-3xl font-bold">
                                {user?.user_metadata?.display_name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <button className="absolute bottom-0 right-1/2 translate-x-10 bg-surface-700 p-2 rounded-full hover:bg-surface-600 transition-colors shadow-lg">
                            <Camera className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    <div className="relative inline-block mb-1">
                        <h2 className="text-2xl font-bold">{user?.user_metadata?.display_name || 'User'}</h2>
                        <button className="absolute -left-6 top-1.5 text-surface-400 hover:text-white">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-surface-400 text-sm mb-6">{t('profile.premiumMember')}</p>

                    <div className="grid grid-cols-3 gap-4 border-t border-surface-700 pt-6">
                        <div>
                            <div className="text-xl font-bold text-primary-400">12</div>
                            <div className="text-xs text-surface-400">{t('profile.connectionDays')}</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-accent-400">150</div>
                            <div className="text-xs text-surface-400">{t('profile.points')}</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-green-400">Lv.3</div>
                            <div className="text-xs text-surface-400">{t('profile.level')}</div>
                        </div>
                    </div>
                </motion.div>

                {/* Partner Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-4 mb-8 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-lg font-bold text-pink-400">
                            {t('dashboard.partner').charAt(0)}
                        </div>
                        <div>
                            <div className="text-xs text-surface-400 mb-1">{t('profile.journeyPartner')}</div>
                            <div className="font-bold">{t('dashboard.partner')}</div>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {t('dashboard.online')}
                    </div>
                </motion.div>

                {/* Settings Section */}
                <h3 className="text-sm font-bold text-surface-400 mb-3 px-2">{t('settings.title')}</h3>
                <div className="space-y-3 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-surface-300" />
                            </div>
                            <span>{t('settings.notifications')}</span>
                        </div>
                        <ToggleSwitch
                            enabled={notificationsEnabled}
                            onChange={toggleNotifications}
                            label={t('settings.notificationsDesc')}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center">
                                {theme === 'dark' ? <Moon className="w-4 h-4 text-surface-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
                            </div>
                            <span>{t('settings.darkMode')}</span>
                        </div>
                        <ToggleSwitch
                            enabled={theme === 'dark'}
                            onChange={toggleDarkMode}
                            label={t('settings.darkModeDesc')}
                        />
                    </motion.div>
                </div>

                {/* Account Actions */}
                <h3 className="text-sm font-bold text-surface-400 mb-3 px-2">{t('profile.account')}</h3>
                <div className="space-y-3 mb-8">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            playSound('click');
                            signOut();
                        }}
                        className="w-full glass-card p-4 flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <span>{t('profile.logOut')}</span>
                    </motion.button>
                </div>

                <div className="text-center text-xs text-surface-500" dir="ltr">
                    Version 1.0.0 (Beta)
                </div>
            </div>
        </main>
    );
}
