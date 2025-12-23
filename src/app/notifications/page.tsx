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
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useSound } from '@/hooks/useSound';
import { useNotifications } from '@/hooks/useNotifications';

const iconMap: Record<string, any> = {
    message: MessageCircle,
    play: Star,
    'check-in': Heart,
    system: Calendar,
    default: Bell,
};

const colorMap: Record<string, string> = {
    message: 'bg-purple-500',
    play: 'bg-amber-500',
    'check-in': 'bg-rose-500',
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
    const { t } = useTranslation();

    const handleMarkAsRead = (id: string) => {
        playSound('click');
        markAsRead(id);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-44 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
                <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white">
                    <ArrowRight className="w-6 h-6 transform rotate-180" />
                </Link>
                <h1 className="text-xl font-bold">{t('notifications.title')}</h1>
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
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-800 flex items-center justify-center">
                        <Bell className="w-10 h-10 text-surface-600" />
                    </div>
                    <h3 className="text-lg font-medium text-surface-400 mb-2">{t('notifications.empty')}</h3>
                    <p className="text-sm text-surface-500">{t('notifications.emptyDesc')}</p>
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
                                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                className={`glass-card p-4 flex gap-4 cursor-pointer transition-colors ${notification.is_read ? 'opacity-60' : 'hover:bg-white/5'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 text-right">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-surface-400">
                                            {formatTime(notification.created_at)}
                                        </span>
                                        <h3 className="font-semibold">{notification.title_ar}</h3>
                                    </div>
                                    <p className="text-sm text-surface-400 mt-1">{notification.body_ar}</p>
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
