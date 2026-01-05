'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const { language, theme } = useSettingsStore();
    const isRTL = language === 'ar';
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Trigger confetti on mount
        if (!showConfetti) {
            setShowConfetti(true);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d']
            });
        }
    }, [showConfetti]);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'light'
                ? 'bg-gradient-to-br from-amber-50 via-white to-yellow-50'
                : 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900'
            }`}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-center max-w-md"
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-2xl shadow-amber-500/30"
                >
                    <Crown className="w-12 h-12 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-3xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}
                >
                    {isRTL ? 'مرحباً بك في Premium! 🎉' : 'Welcome to Premium! 🎉'}
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`text-lg mb-8 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'
                        }`}
                >
                    {isRTL
                        ? 'تم تفعيل اشتراكك بنجاح. استمتع بجميع المميزات!'
                        : 'Your subscription is now active. Enjoy all premium features!'}
                </motion.p>

                {/* Features Unlocked */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`p-6 rounded-2xl mb-8 ${theme === 'light'
                            ? 'bg-white/80 border border-amber-100 shadow-lg'
                            : 'bg-white/5 border border-white/10'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <span className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {isRTL ? 'المميزات المفتوحة:' : 'Unlocked Features:'}
                        </span>
                    </div>
                    <ul className={`space-y-2 text-right ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {isRTL ? 'AI Coach غير محدود' : 'Unlimited AI Coach'}
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {isRTL ? 'جميع الألعاب (8+)' : 'All Games (8+)'}
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {isRTL ? 'جميع الرحلات' : 'All Journeys'}
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {isRTL ? 'همسات غير محدودة' : 'Unlimited Whispers'}
                        </li>
                    </ul>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all"
                    >
                        {isRTL ? 'ابدأ الآن' : 'Get Started'}
                        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
