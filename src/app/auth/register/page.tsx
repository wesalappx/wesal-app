'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
    const router = useRouter();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        dateOfBirth: '',
        gender: 'MALE' as 'MALE' | 'FEMALE',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        if (formData.password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        if (formData.displayName.length < 2) {
            setError('الاسم يجب أن يكون حرفين على الأقل');
            return;
        }

        if (!formData.dateOfBirth) {
            setError('يرجى إدخال تاريخ الميلاد');
            return;
        }

        // Check age (18+)
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 18) {
            setError('يجب أن يكون عمرك 18 سنة على الأقل');
            return;
        }

        setIsLoading(true);

        const { error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    display_name: formData.displayName,
                    date_of_birth: formData.dateOfBirth,
                    gender: formData.gender,
                },
            },
        });

        if (signUpError) {
            setError(getArabicError(signUpError.message));
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    const getArabicError = (message: string): string => {
        if (message.includes('already registered') || message.includes('already exists')) {
            return 'هذا البريد الإلكتروني مسجل مسبقاً';
        }
        if (message.includes('invalid email')) {
            return 'البريد الإلكتروني غير صحيح';
        }
        if (message.includes('password')) {
            return 'كلمة المرور ضعيفة جداً';
        }
        return 'حدث خطأ أثناء إنشاء الحساب';
    };

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 font-sans">
                <div className="fixed inset-0 overflow-hidden -z-10">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
                </div>

                <div className="glass-card p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">تم إنشاء الحساب!</h1>
                    <p className="text-surface-400 mb-6">
                        تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى فتح الرابط لتفعيل حسابك.
                    </p>
                    <Link href="/auth/login" className="btn-primary inline-block">
                        الذهاب لتسجيل الدخول
                    </Link>
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
                {/* Logo */}
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <img src="/wesal-logo.svg" alt="وصال" className="w-12 h-12" />
                        <span className="text-2xl font-bold">وصال</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card p-6">
                    <h1 className="text-2xl font-bold text-center mb-2">إنشاء حساب جديد</h1>
                    <p className="text-surface-400 text-center mb-6">
                        ابدأ رحلتك مع شريك حياتك
                    </p>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">الاسم المعروض</label>
                            <div className="relative">
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="text"
                                    className="input pr-10 text-right"
                                    placeholder="كيف تحب نناديك؟"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">البريد الإلكتروني</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="email"
                                    className="input pr-10 text-left"
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">تاريخ الميلاد</label>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="date"
                                    className="input pr-10 text-left"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">الجنس</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: 'MALE' })}
                                    className={`p-3 rounded-xl border transition-all text-center ${formData.gender === 'MALE'
                                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                        : 'border-surface-600 hover:border-surface-500 text-surface-300'
                                        }`}
                                >
                                    👨 ذكر
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: 'FEMALE' })}
                                    className={`p-3 rounded-xl border transition-all text-center ${formData.gender === 'FEMALE'
                                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                        : 'border-surface-600 hover:border-surface-500 text-surface-300'
                                        }`}
                                >
                                    👩 أنثى
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-10 pl-10 text-left"
                                    placeholder="6 أحرف على الأقل"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-right">تأكيد كلمة المرور</label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-10 text-left"
                                    placeholder="أعد كتابة كلمة المرور"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-surface-400 text-center">
                            بالتسجيل، أنت تؤكد أن عمرك 18+ وتوافق على{' '}
                            <Link href="/terms" className="text-primary-400 hover:underline">
                                الشروط والأحكام
                            </Link>{' '}
                            و{' '}
                            <Link href="/privacy" className="text-primary-400 hover:underline">
                                سياسة الخصوصية
                            </Link>
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري إنشاء الحساب...
                                </>
                            ) : (
                                'إنشاء حساب'
                            )}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-surface-400 text-sm">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/auth/login" className="text-primary-400 hover:underline font-bold">
                            سجل دخول
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
