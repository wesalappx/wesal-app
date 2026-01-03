'use client';

import { motion } from 'framer-motion';
import {
    Bell,
    Heart,
    Star,
    MessageCircle,
    Calendar,
    ArrowRight,
    Check,
    Loader2,
    Trash2,
    Scale
} from 'lucide-react';
import Link from 'next/link';
import { useSound } from '@/hooks/useSound';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useSettingsStore } from '@/stores/settings-store';

const iconMap: Record<string, any> = {
    message: MessageCircle,
    play: Star,
    'check-in': Heart,
    CHECK_IN_SHARED: Heart,
    game_invite: Star,
    conflict_invite: Scale,
    system: Calendar,
    default: Bell,
};

const colorMap: Record<string, string> = {
    message: 'bg-purple-500',
    play: 'bg-amber-500',
    'check-in': 'bg-rose-500',
    CHECK_IN_SHARED: 'bg-rose-500',
    game_invite: 'bg-amber-500',
    conflict_invite: 'bg-purple-600',
    system: 'bg-blue-500',
    default: 'bg-surface-500',
};

// Format relative time
const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    return `منذ ${diffDays} أيام`;
};

// ... imports
import { useTranslation } from '@/hooks/useTranslation';

// ... helpers

export default function NotificationsPage() {
    const { playSound } = useSound();
    const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
    const { theme } = useSettingsStore();
    const { t } = useTranslation();

    const router = useRouter(); // Import useRouter

    const handleNotificationClick = (notification: Notification) => {
        playSound('click');

        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Deep linking
        if (notification.data?.url) {
            router.push(notification.data.url);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className={`min-h-screen pb-44 p-4 ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
                <Link href="/dashboard" className={`p-2 -ml-2 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-surface-400 hover:text-white'}`}>
                    <ArrowRight className="w-6 h-6 transform rotate-180" />
                </Link>
                <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t('notifications.title')}</h1>
                {unreadCount > 0 && (
                    <button
                        onClick={() => {
                            playSound('click');
                            markAllAsRead();
                        }}
                        className="text-sm text-primary-400 hover:text-primary-300"
                    >
                        {t('notifications.readAll')}
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-800'}`}>
                        <Bell className={`w-10 h-10 ${theme === 'light' ? 'text-slate-400' : 'text-surface-600'}`} />
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>{t('notifications.empty')}</h3>
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>{t('notifications.emptyDesc')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification, index) => {
                        const Icon = iconMap[notification.type] || iconMap.default;
                        const bgColor = colorMap[notification.type] || colorMap.default;

                        return (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 flex gap-4 cursor-pointer transition-colors ${theme === 'light'
                                    ? 'bg-white border border-slate-200 shadow-sm rounded-2xl hover:bg-slate-50'
                                    : 'glass-card hover:bg-white/5'
                                    } ${notification.is_read ? 'opacity-60' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`}>
                                            {formatTime(notification.created_at)}
                                        </span>
                                        <h3 className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{notification.title_ar}</h3>
                                    </div>
                                    <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{notification.body_ar}</p>
                                </div>
                                {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
