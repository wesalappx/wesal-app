'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Crown, Check, Loader2, Sparkles, Heart, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSettingsStore } from '@/stores/settings-store';

export default function UpgradePage() {
    const { language } = useSettingsStore();
    const isRTL = language === 'ar';

    const {
        isPremium,
        isLoading,
        availablePlans,
        startUpgrade,
        formatPrice,
        currentPlan
    } = useSubscription();

    const [isUpgrading, setIsUpgrading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setError(null);
        setIsUpgrading(true);

        const result = await startUpgrade('premium_lifetime');

        if (!result.success) {
            setError(result.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
            setIsUpgrading(false);
        }
        // If successful, user is redirected to payment page
    };

    const features = [
        {
            icon: '💬',
            title: { ar: 'محادثات AI غير محدودة', en: 'Unlimited AI Chats' },
            desc: { ar: 'استشر المستشار في أي وقت', en: 'Get advice anytime' }
        },
        {
            icon: '🎮',
            title: { ar: 'جميع الألعاب', en: 'All Games' },
            desc: { ar: 'الوصول لكل الألعاب المميزة', en: 'Access all premium games' }
        },
        {
            icon: '🚀',
            title: { ar: 'جميع الرحلات', en: 'All Journeys' },
            desc: { ar: 'اكتشفوا رحلات جديدة معاً', en: 'Discover new journeys together' }
        },
        {
            icon: '📊',
            title: { ar: 'إحصائيات متقدمة', en: 'Advanced Insights' },
            desc: { ar: 'تحليل عميق لعلاقتكم', en: 'Deep relationship analytics' }
        },
        {
            icon: '⚡',
            title: { ar: 'دعم أولوية', en: 'Priority Support' },
            desc: { ar: 'رد سريع على استفساراتك', en: 'Fast response to questions' }
        },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
        );
    }

    // Already premium
    if (isPremium) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                        <Link href="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </Link>
                        <h1 className="text-xl font-bold text-white">{isRTL ? 'الاشتراك' : 'Subscription'}</h1>
                    </div>
                </header>

                <main className="max-w-lg mx-auto px-4 py-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                        <Crown className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">
                        {isRTL ? 'أنت مشترك Premium! 🎉' : 'You\'re Premium! 🎉'}
                    </h2>

                    <p className="text-surface-300 mb-8">
                        {isRTL
                            ? 'لديك وصول كامل لجميع المميزات. شكراً لدعمك!'
                            : 'You have full access to all features. Thank you for your support!'}
                    </p>

                    <div className="glass-card p-6 text-right">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-surface-400">{isRTL ? 'الخطة' : 'Plan'}</span>
                            <span className="text-white font-bold">{currentPlan?.name[language] || 'Premium'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-surface-400">{isRTL ? 'الحالة' : 'Status'}</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                {isRTL ? 'نشط' : 'Active'}
                            </span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Not premium - show upgrade UI
    const plan = availablePlans[0]; // Lifetime plan

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">{isRTL ? 'ترقية للـ Premium' : 'Upgrade to Premium'}</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8 pb-32">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                        <Crown className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">
                        {isRTL ? 'وصال Premium' : 'Wesal Premium'}
                    </h2>

                    <p className="text-surface-300">
                        {isRTL
                            ? 'احصلوا على كل المميزات لتعزيز علاقتكم'
                            : 'Get all features to strengthen your relationship'}
                    </p>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3 mb-8"
                >
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="glass-card p-4 flex items-center gap-4"
                        >
                            <span className="text-2xl">{feature.icon}</span>
                            <div className="flex-1 text-right">
                                <h4 className="font-bold text-white">{feature.title[language]}</h4>
                                <p className="text-sm text-surface-400">{feature.desc[language]}</p>
                            </div>
                            <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                    ))}
                </motion.div>

                {/* Price Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 text-center border-2 border-primary-500/50 mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-sm font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        {isRTL ? 'دفعة واحدة' : 'One-time payment'}
                    </div>

                    <div className="text-5xl font-black text-white mb-2">
                        {formatPrice(plan.price)}
                    </div>

                    <p className="text-surface-400 mb-6">
                        {isRTL ? 'اشتراك مدى الحياة - لا رسوم شهرية!' : 'Lifetime access - no monthly fees!'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUpgrade}
                        disabled={isUpgrading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-50"
                    >
                        {isUpgrading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Heart className="w-6 h-6" />
                                {isRTL ? 'اشترك الآن' : 'Subscribe Now'}
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Trust badges */}
                <div className="text-center text-surface-500 text-sm space-y-2">
                    <p>🔒 {isRTL ? 'دفع آمن عبر Moyasar' : 'Secure payment via Moyasar'}</p>
                    <p>💳 {isRTL ? 'نقبل مدى، فيزا، ماستركارد' : 'We accept Mada, Visa, Mastercard'}</p>
                </div>
            </main>
        </div>
    );
}
