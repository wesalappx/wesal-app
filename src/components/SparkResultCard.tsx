"use client";

import { motion } from 'framer-motion';
import { Sparkles, Heart, HeartCrack, Clock, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

interface SparkResultCardProps {
    status: 'NEW' | 'AI_PROPOSING' | 'PARTNER_REPLIED' | 'REVEALED' | 'SOFT_REJECTED';
    content: string;
    category: string;
    partnerResponse?: string;
    finalVerdict?: {
        receptiveness?: string;
        reasoning?: string;
        summary_for_partner_a?: string;
    };
    createdAt: string;
}

const statusConfig = {
    NEW: {
        icon: Clock,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        labelAr: 'في انتظار المعالجة',
        labelEn: 'Processing...'
    },
    AI_PROPOSING: {
        icon: Eye,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        labelAr: 'AI يسأل شريكك',
        labelEn: 'AI is probing partner'
    },
    PARTNER_REPLIED: {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        labelAr: 'الشريك رد، AI يحلل',
        labelEn: 'Partner replied, AI analyzing'
    },
    REVEALED: {
        icon: Heart,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        labelAr: '🎉 تم الكشف! شريكك متقبل',
        labelEn: '🎉 Revealed! Partner is receptive'
    },
    SOFT_REJECTED: {
        icon: EyeOff,
        color: 'text-surface-400',
        bg: 'bg-surface-500/10',
        border: 'border-surface-500/30',
        labelAr: 'ليس الآن - السر آمن',
        labelEn: 'Not now - Secret is safe'
    }
};

export default function SparkResultCard({
    status,
    content,
    category,
    partnerResponse,
    finalVerdict,
    createdAt
}: SparkResultCardProps) {
    const { theme, language } = useSettingsStore();
    const isRTL = language === 'ar';
    const config = statusConfig[status] || statusConfig.NEW;
    const Icon = config.icon;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-4 ${theme === 'light'
                ? `bg-white ${config.border} shadow-sm`
                : `bg-surface-800/50 ${config.border}`
                }`}
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                            {isRTL ? config.labelAr : config.labelEn}
                        </span>
                        <span className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-surface-500'}`}>
                            {formatDate(createdAt)}
                        </span>
                    </div>
                    <span className={`text-xs mt-1 block ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        {category}
                    </span>
                </div>
            </div>

            {/* Your Secret */}
            <div className={`p-3 rounded-xl mb-3 ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900/50'}`}>
                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                    <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                        {isRTL ? 'رغبتك: ' : 'Your spark: '}
                    </span>
                    "{content}"
                </p>
            </div>

            {/* Result for REVEALED */}
            {status === 'REVEALED' && finalVerdict && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-500">
                            {isRTL ? 'نجاح!' : 'Success!'}
                        </span>
                    </div>
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                        {finalVerdict.summary_for_partner_a ||
                            (isRTL ? 'شريكك أبدى اهتماماً! يمكنك الآن مناقشة الموضوع معه.' : 'Your partner showed interest! You can now discuss this together.')}
                    </p>
                </motion.div>
            )}

            {/* Result for SOFT_REJECTED */}
            {status === 'SOFT_REJECTED' && finalVerdict && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-900/50'}`}
                >
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                        {finalVerdict.summary_for_partner_a ||
                            (isRTL ? 'يبدو أن الوقت ليس مناسباً الآن. سرك آمن ويمكنك المحاولة لاحقاً.' : "Timing doesn't seem right. Your secret is safe - try again later.")}
                    </p>
                </motion.div>
            )}

            {/* Waiting states */}
            {(status === 'AI_PROPOSING' || status === 'PARTNER_REPLIED') && (
                <div className={`flex items-center gap-2 text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    {isRTL ? 'انتظر الرد...' : 'Waiting for response...'}
                </div>
            )}
        </motion.div>
    );
}
