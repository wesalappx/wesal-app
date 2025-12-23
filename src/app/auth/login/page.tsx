'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
    const { signIn, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: signInError } = await signIn(formData.email, formData.password);

        if (signInError) {
            setError(getArabicError(signInError.message));
        }

        setIsLoading(false);
    };

    const getArabicError = (message: string): string => {
        if (message.includes('Invalid login credentials')) {
            return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        }
        if (message.includes('Email not confirmed')) {
            return 'يرجى تأكيد البريد الإلكتروني أولاً';
        }
        return 'حدث خطأ أثناء تسجيل الدخول';
    };

    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <img src="/wesal-logo.svg" alt="وصال" className="w-12 h-12" />
                        <span className="text-2xl font-bold">وصال</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">أهلاً بعودتك</h1>
                    <p className="text-surface-400 text-center mb-8">
                        استمر في رحلتك مع شريك حياتك
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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-primary-400 hover:underline"
                                >
                                    نسيت كلمة المرور؟
                                </Link>
                                <label className="block text-sm font-medium">كلمة المرور</label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12 pl-12 text-right"
                                    placeholder="أدخل كلمة المرور"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
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
                                    جاري الدخول...
                                </>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-surface-400">
                        ليس لديك حساب؟{' '}
                        <Link href="/auth/register" className="text-primary-400 hover:underline font-bold">
                            أنشئ حساب جديد
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
