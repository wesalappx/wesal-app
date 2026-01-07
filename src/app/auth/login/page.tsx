'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const { signIn, isLoading: authLoading, user, session } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);

    // If user is already logged in, redirect to dashboard
    useEffect(() => {
        if (!authLoading && user && session) {
            router.push('/dashboard');
        }
    }, [authLoading, user, session, router]);

    // Handle lockout countdown
    useEffect(() => {
        if (lockoutTime > 0) {
            const timer = setInterval(() => {
                setLockoutTime((prev) => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutTime]);

    // Validate form fields
    const validateForm = (): boolean => {
        const errors: { email?: string; password?: string } = {};

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'البريد الإلكتروني مطلوب';
        } else if (!EMAIL_REGEX.test(formData.email)) {
            errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'كلمة المرور مطلوبة';
        } else if (formData.password.length < 6) {
            errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if account is locked
        if (isLocked) {
            setError(`الحساب مقفل مؤقتاً. انتظر ${lockoutTime} ثانية`);
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        const { error: signInError } = await signIn(formData.email, formData.password);

        if (signInError) {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            // Lock account after 5 failed attempts
            if (newAttempts >= 5) {
                setIsLocked(true);
                setLockoutTime(60); // 60 seconds lockout
                setError('تم تجاوز عدد المحاولات المسموحة. الحساب مقفل لمدة دقيقة');
            } else {
                setError(getArabicError(signInError.message, 5 - newAttempts));
            }
        } else {
            // Reset attempts on successful login
            setLoginAttempts(0);
        }

        setIsLoading(false);
    };

    const getArabicError = (message: string, remainingAttempts: number): string => {
        let errorMsg = '';
        if (message.includes('Invalid login credentials')) {
            errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (message.includes('Email not confirmed')) {
            return 'يرجى تأكيد البريد الإلكتروني أولاً';
        } else {
            errorMsg = 'حدث خطأ أثناء تسجيل الدخول';
        }

        if (remainingAttempts > 0 && remainingAttempts < 4) {
            errorMsg += ` (${remainingAttempts} محاولات متبقية)`;
        }
        return errorMsg;
    };

    // Handle field change and clear errors
    const handleFieldChange = (field: 'email' | 'password', value: string) => {
        setFormData({ ...formData, [field]: value });
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: undefined });
        }
        if (error) setError('');
    };

    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className="min-h-[100dvh] w-full flex flex-col items-center justify-center py-10 px-4 sm:px-6 font-sans relative">
            {/* Vibrant Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-rose-50/80 animate-gradient-xy" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
            </div>

            <div className="w-full max-w-md relative z-10 flex flex-col gap-6 text-center">
                {/* Logo */}
                <div className="mb-8 inline-block animate-float">
                    <Link href="/" className="inline-flex flex-col items-center gap-2 group">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                            <img src="/wesal-logo.svg" alt="وصال" className="w-10 h-10 invert brightness-0 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors">وصال</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.05)] text-right">
                    <h1 className="text-2xl font-bold text-center mb-2">أهلاً بعودتك</h1>
                    <p className="text-surface-400 text-center mb-8">
                        استمر في رحلتك مع شريك حياتك
                    </p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-right text-slate-700">البريد الإلكتروني</label>
                            <div className="relative group">
                                <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.email ? 'text-rose-400' : 'text-slate-500 group-hover:text-violet-600'}`} />
                                <input
                                    type="email"
                                    className={`w-full bg-slate-50 border ${fieldErrors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-violet-500 focus:ring-violet-200'} rounded-xl px-4 py-3 pr-12 text-right outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white text-slate-900`}
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    dir="ltr"
                                    disabled={isLocked}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-rose-500 text-right font-medium">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm text-violet-600 hover:text-violet-700 hover:underline font-medium"
                                >
                                    نسيت كلمة المرور؟
                                </Link>
                                <label className="block text-sm font-bold text-slate-700">كلمة المرور</label>
                            </div>
                            <div className="relative group">
                                <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${fieldErrors.password ? 'text-rose-400' : 'text-slate-500 group-hover:text-violet-600'}`} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`w-full bg-slate-50 border ${fieldErrors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-violet-500 focus:ring-violet-200'} rounded-xl px-4 py-3 pr-12 pl-12 text-right outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white text-slate-900`}
                                    placeholder="أدخل كلمة المرور"
                                    value={formData.password}
                                    onChange={(e) => handleFieldChange('password', e.target.value)}
                                    dir="ltr"
                                    disabled={isLocked}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-600 transition-colors"
                                    disabled={isLocked}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1 text-xs text-rose-500 text-right font-medium">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || isLocked}
                            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري الدخول...
                                </>
                            ) : isLocked ? (
                                `مقفل (${lockoutTime}ث)`
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 text-sm">
                        ليس لديك حساب؟{' '}
                        <Link href="/auth/register" className="text-violet-600 hover:text-violet-700 font-bold hover:underline transition-all">
                            أنشئ حساب جديد
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
