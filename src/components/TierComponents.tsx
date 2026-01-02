'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Crown } from 'lucide-react';

interface UpgradePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: { ar: string; en: string };
    message: { ar: string; en: string };
    language: 'ar' | 'en';
}

export function UpgradePromptModal({
    isOpen,
    onClose,
    title,
    message,
    language
}: UpgradePromptModalProps) {
    const isRTL = language === 'ar';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface-800 rounded-3xl p-6 max-w-sm w-full text-center border border-white/10"
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {title[language]}
                        </h3>
                        <p className="text-surface-400 mb-6">
                            {message[language]}
                        </p>
                        <Link
                            href="/settings/upgrade"
                            className="block w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold mb-3"
                        >
                            {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
                        </Link>
                        <button
                            onClick={onClose}
                            className="text-surface-500 text-sm"
                        >
                            {isRTL ? 'لاحقاً' : 'Maybe Later'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Tier badge component for headers
interface TierBadgeProps {
    isPremium: boolean;
    language: 'ar' | 'en';
}

export function TierBadge({ isPremium, language }: TierBadgeProps) {
    const isRTL = language === 'ar';

    if (isPremium) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                <Crown className="w-3.5 h-3.5" />
                <span>Premium</span>
            </div>
        );
    }

    return (
        <Link
            href="/settings/upgrade"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-700/50 text-surface-400 text-xs font-medium hover:bg-primary-500/20 hover:text-primary-400 transition-colors"
        >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRTL ? 'ترقية' : 'Upgrade'}</span>
        </Link>
    );
}

// Usage counter badge
interface UsageCounterProps {
    remaining: number;
    limit: number;
    label?: { ar: string; en: string };
    language: 'ar' | 'en';
}

export function UsageCounter({ remaining, limit, label, language }: UsageCounterProps) {
    const isLow = remaining <= 1;

    return (
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${isLow
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-surface-700/50 text-surface-300'
            }`}>
            {remaining}/{limit}
            {label && <span className="mr-1 ml-1">{label[language]}</span>}
        </div>
    );
}
