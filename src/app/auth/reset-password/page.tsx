'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ResetPasswordPage() {
    const { updatePassword, isLoading: authLoading, session } = useAuth();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Check if user has a valid session (from reset link)
    useEffect(() => {
        if (!authLoading && !session) {
            // No session means the reset link is invalid or expired
            router.push('/auth/forgot-password');
        }
    }, [authLoading, session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setIsLoading(true);

        const { error: updateError } = await updatePassword(password);

        if (updateError) {
            setError('حدث خطأ أثناء تحديث كلمة المرور');
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
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
                        <h1 className="text-2xl font-bold mb-2">تم التحديث!</h1>
                        <p className="text-surface-400 mb-4">
                            تم تحديث كلمة المرور بنجاح. جاري التوجيه...
                        </p>
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
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
                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">تعيين كلمة مرور جديدة</h1>
                    <p className="text-surface-400 text-center mb-8">
                        أدخل كلمة المرور الجديدة لحسابك
                    </p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">كلمة المرور الجديدة</label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12 pl-12 text-right"
                                    placeholder="أدخل كلمة المرور الجديدة"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12 text-right"
                                    placeholder="أعد إدخال كلمة المرور"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                                    جاري التحديث...
                                </>
                            ) : (
                                'تحديث كلمة المرور'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
