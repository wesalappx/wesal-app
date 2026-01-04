'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight, Crown, Check, Loader2, Sparkles, Heart, X,
    MessageCircle, Gamepad2, Map, BarChart3, Zap, Shield,
    Gift, Star
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSettingsStore } from '@/stores/settings-store';
import { SUBSCRIPTION_PLANS, FREE_TIER_LIMITS } from '@/lib/payments';

interface DynamicPricing {
    monthly: number;
    annual: number;
    currency: string;
    savings: number;
}

interface ActiveOffer {
    id: string;
    name: string;
    discount_percent: number;
    valid_until: string;
    code?: string;
}

export default function UpgradePage() {
    const { language, theme } = useSettingsStore();
    const isRTL = language === 'ar';

    const {
        isPremium,
        isLoading,
        startUpgrade,
        formatPrice,
        currentPlan
    } = useSubscription();

    const [selectedPlan, setSelectedPlan] = useState<'premium_monthly' | 'premium_annual'>('premium_monthly');
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamic pricing state
    const [pricing, setPricing] = useState<DynamicPricing>({
        monthly: 29,
        annual: 249,
        currency: 'SAR',
        savings: 99
    });

    // Active offers state
    const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);

    // Fetch dynamic pricing and offers on mount
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('/api/pricing');
                if (res.ok) {
                    const data = await res.json();
                    setPricing(data);
                }
            } catch (err) {
                console.error('Failed to fetch pricing:', err);
            }
        };

        const fetchOffers = async () => {
            try {
                const res = await fetch('/api/offers');
                if (res.ok) {
                    const data = await res.json();
                    if (data.bestOffer) {
                        setActiveOffer(data.bestOffer);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch offers:', err);
            }
        };

        fetchPricing();
        fetchOffers();
    }, []);

    const handleUpgrade = async () => {
        setError(null);
        setIsUpgrading(true);

        const result = await startUpgrade(selectedPlan);

        if (!result.success) {
            setError(result.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
            setIsUpgrading(false);
        }
        // If successful, user is redirected to payment page
    };

    // Feature comparison data
    const comparisonFeatures = [
        {
            icon: MessageCircle,
            name: { ar: 'مستشار AI', en: 'AI Coach' },
            free: { ar: '5 رسائل/يوم', en: '5 messages/day' },
            premium: { ar: 'غير محدود', en: 'Unlimited' }
        },
        {
            icon: Shield,
            name: { ar: 'حل النزاعات', en: 'Conflict AI' },
            free: { ar: 'جلستين/أسبوع', en: '2 sessions/week' },
            premium: { ar: 'غير محدود', en: 'Unlimited' }
        },
        {
            icon: Gamepad2,
            name: { ar: 'الألعاب', en: 'Games' },
            free: { ar: '4 ألعاب أساسية', en: '4 basic games' },
            premium: { ar: 'جميع الألعاب (8+)', en: 'All games (8+)' }
        },
        {
            icon: Zap,
            name: { ar: 'جلسات اللعب', en: 'Game Sessions' },
            free: { ar: '3/يوم', en: '3/day' },
            premium: { ar: 'غير محدود', en: 'Unlimited' }
        },
        {
            icon: Map,
            name: { ar: 'الرحلات', en: 'Journeys' },
            free: { ar: 'رحلتين', en: '2 journeys' },
            premium: { ar: 'جميع الرحلات', en: 'All journeys' }
        },
        {
            icon: Heart,
            name: { ar: 'همسات', en: 'Whispers' },
            free: { ar: '3/أسبوع', en: '3/week' },
            premium: { ar: 'غير محدود', en: 'Unlimited' }
        },
        {
            icon: BarChart3,
            name: { ar: 'التحليلات', en: 'Insights' },
            free: { ar: 'أساسية', en: 'Basic' },
            premium: { ar: 'متقدمة', en: 'Advanced' }
        },
        {
            icon: Star,
            name: { ar: 'دعم أولوية', en: 'Priority Support' },
            free: { ar: '—', en: '—' },
            premium: { ar: '✓', en: '✓' }
        }
    ];

    // Use dynamic pricing instead of hardcoded plans
    const monthlyPrice = pricing.monthly;
    const annualPrice = pricing.annual;

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
            <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
                <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                    <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                        <Link href="/settings" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                            <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'} ${!isRTL && 'rotate-180'}`} />
                        </Link>
                        <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{isRTL ? 'الاشتراك' : 'Subscription'}</h1>
                    </div>
                </header>

                <main className="max-w-lg mx-auto px-4 py-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                        <Crown className="w-12 h-12 text-white" />
                    </div>

                    <h2 className={`text-3xl font-bold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {isRTL ? 'أنت مشترك Premium! 🎉' : 'You\'re Premium! 🎉'}
                    </h2>

                    <p className={`mb-8 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                        {isRTL
                            ? 'لديك وصول كامل لجميع المميزات. شكراً لدعمك!'
                            : 'You have full access to all features. Thank you for your support!'}
                    </p>

                    <div className={`p-6 rounded-2xl border text-right ${theme === 'light' ? 'bg-white border-slate-100 shadow-sm' : 'glass-card'}`}>
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

    // Not premium - show upgrade UI with comparison
    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className={`w-6 h-6 text-white ${!isRTL && 'rotate-180'}`} />
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
                    {/* Active Offer Banner */}
                    {activeOffer && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 backdrop-blur-sm"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <span className="text-lg font-bold text-white">{activeOffer.name}</span>
                            </div>
                            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
                                {activeOffer.discount_percent}% {isRTL ? 'خصم' : 'OFF'}
                            </div>
                            {activeOffer.code && (
                                <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-purple-300 text-sm font-mono">
                                    {isRTL ? 'الكود: ' : 'Code: '}{activeOffer.code}
                                </div>
                            )}
                            <p className="text-purple-300/70 text-xs mt-2">
                                {isRTL ? 'ينتهي: ' : 'Expires: '}{new Date(activeOffer.valid_until).toLocaleDateString()}
                            </p>
                        </motion.div>
                    )}

                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                        <Crown className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3">
                        {isRTL ? 'وصال Premium' : 'Wesal Premium'}
                    </h2>

                    <p className="text-surface-300">
                        {isRTL
                            ? 'افتحوا كل المميزات لتعزيز علاقتكم'
                            : 'Unlock all features to strengthen your relationship'}
                    </p>
                </motion.div>

                {/* Plan Selection */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-3 mb-6"
                >
                    {/* Monthly Plan */}
                    <button
                        onClick={() => setSelectedPlan('premium_monthly')}
                        className={`relative p-4 rounded-2xl border-2 transition-all text-center ${selectedPlan === 'premium_monthly'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                    >
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-bold">
                            {isRTL ? 'الأكثر طلباً' : 'Most Popular'}
                        </span>
                        <p className="text-surface-400 text-sm mb-1">
                            {isRTL ? 'شهري' : 'Monthly'}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {formatPrice(monthlyPrice)}
                        </p>
                        <p className="text-surface-500 text-xs">
                            {isRTL ? '/شهر' : '/month'}
                        </p>
                    </button>

                    {/* Annual Plan */}
                    <button
                        onClick={() => setSelectedPlan('premium_annual')}
                        className={`relative p-4 rounded-2xl border-2 transition-all text-center ${selectedPlan === 'premium_annual'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                    >
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                            {isRTL ? `وفر ${pricing.savings || 99} ريال` : `Save ${pricing.savings || 99} SAR`}
                        </span>
                        <p className="text-surface-400 text-sm mb-1">
                            {isRTL ? 'سنوي' : 'Annual'}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {formatPrice(annualPrice)}
                        </p>
                        <p className="text-surface-500 text-xs">
                            {isRTL ? '/سنة' : '/year'}
                        </p>
                    </button>
                </motion.div>

                {/* Feature Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4 mb-6 overflow-hidden"
                >
                    <h3 className="text-white font-bold text-center mb-4">
                        {isRTL ? 'مقارنة المميزات' : 'Feature Comparison'}
                    </h3>

                    {/* Table Header */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
                        <div className="text-surface-400"></div>
                        <div className="text-surface-400 font-medium">
                            {isRTL ? 'مجاني' : 'Free'}
                        </div>
                        <div className="text-primary-400 font-bold">
                            Premium
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        {comparisonFeatures.map((feature, idx) => (
                            <div key={idx} className="grid grid-cols-3 gap-2 items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <feature.icon className="w-4 h-4 text-surface-500" />
                                    <span className="text-white text-xs">{feature.name[language]}</span>
                                </div>
                                <div className="text-center text-surface-400 text-xs">
                                    {feature.free[language]}
                                </div>
                                <div className="text-center text-emerald-400 text-xs font-medium">
                                    {feature.premium[language]}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
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
                                <Sparkles className="w-6 h-6" />
                                {isRTL ? 'اشترك الآن' : 'Subscribe Now'}
                                <span className="opacity-80">
                                    - {formatPrice(selectedPlan === 'premium_monthly' ? monthlyPrice : annualPrice)}
                                </span>
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-surface-500 text-sm space-y-2 mt-6"
                >
                    <p>🔒 {isRTL ? 'دفع آمن عبر Moyasar' : 'Secure payment via Moyasar'}</p>
                    <p>💳 {isRTL ? 'نقبل مدى، فيزا، ماستركارد' : 'We accept Mada, Visa, Mastercard'}</p>
                    <p>🔄 {isRTL ? 'إلغاء في أي وقت' : 'Cancel anytime'}</p>
                </motion.div>
            </main>
        </div>
    );
}
