'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { XCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

export default function PaymentCancelPage() {
    const { language, theme } = useSettingsStore();
    const isRTL = language === 'ar';

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'light'
                ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
                : 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900'
            }`}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-md"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'
                        }`}
                >
                    <XCircle className={`w-10 h-10 ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                </motion.div>

                {/* Title */}
                <h1 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                    {isRTL ? 'تم إلغاء الدفع' : 'Payment Cancelled'}
                </h1>

                {/* Description */}
                <p className={`mb-8 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'
                    }`}>
                    {isRTL
                        ? 'لا تقلق! يمكنك المحاولة مرة أخرى في أي وقت.'
                        : "No worries! You can try again anytime."}
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                    <Link
                        href="/settings/upgrade"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold shadow-lg"
                    >
                        <RefreshCw className="w-5 h-5" />
                        {isRTL ? 'المحاولة مجدداً' : 'Try Again'}
                    </Link>

                    <Link
                        href="/dashboard"
                        className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-medium ${theme === 'light'
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isRTL ? 'العودة للرئيسية' : 'Back to Dashboard'}
                        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
