'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
    const { resetPassword, isLoading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: resetError } = await resetPassword(email);

        if (resetError) {
            setError('حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور');
        } else {
            setSuccess(true);
        }

        setIsLoading(false);
    };

    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 font-sans">
                <div className="fixed inset-0 overflow-hidden -z-10">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-md">
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">تم الإرسال!</h1>
                        <p className="text-surface-400 mb-6">
                            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
                        </p>
                        <Link
                            href="/auth/login"
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 font-sans">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                    العودة
                </Link>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">نسيت كلمة المرور؟</h1>
                    <p className="text-surface-400 text-center mb-8">
                        أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                    </p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="email"
                                    className="input pr-12 text-right"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الإرسال...
                                </>
                            ) : (
                                'إرسال رابط إعادة التعيين'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
