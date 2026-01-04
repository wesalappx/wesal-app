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
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-right">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.email ? 'text-red-400' : 'text-surface-400'}`} />
                                <input
                                    type="email"
                                    className={`input pr-12 text-right ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={(e) => handleFieldChange('email', e.target.value)}
                                    dir="ltr"
                                    disabled={isLocked}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1 text-xs text-red-400 text-right">{fieldErrors.email}</p>
                            )}
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
                                <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.password ? 'text-red-400' : 'text-surface-400'}`} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input pr-12 pl-12 text-right ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="أدخل كلمة المرور"
                                    value={formData.password}
                                    onChange={(e) => handleFieldChange('password', e.target.value)}
                                    dir="ltr"
                                    disabled={isLocked}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                                    disabled={isLocked}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1 text-xs text-red-400 text-right">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || isLocked}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
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
