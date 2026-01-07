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

        try {
            // Step 1: Create account with Supabase
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        display_name: formData.displayName,
                        date_of_birth: formData.dateOfBirth,
                        gender: formData.gender,
                    },
                    // Don't use emailRedirectTo - we'll verify with OTP
                },
            });

            if (signUpError) {
                console.error('Signup error:', signUpError);
                setError(getArabicError(signUpError.message));
                setIsLoading(false);
                return;
            }

            // Step 2: Send OTP verification email
            const otpRes = await fetch('/api/auth/signup-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    displayName: formData.displayName,
                }),
            });

            if (!otpRes.ok) {
                // Account created but OTP failed - still redirect to verify
                console.error('OTP send failed, but account created');
            }

            // Redirect to verify page with email param
            router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}&type=signup`);

        } catch (err: unknown) {
            console.error('Registration error:', err);
            setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
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
            return 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)';
        }
        if (message.includes('rate limit') || message.includes('too many')) {
            return 'محاولات كثيرة جداً. انتظر قليلاً وحاول مرة أخرى';
        }
        if (message.includes('Database error')) {
            return 'خطأ في قاعدة البيانات. حاول مرة أخرى';
        }
        // Show actual error for debugging
        return `خطأ: ${message}`;
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
        <main className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 font-sans supports-[min-height:100dvh]:min-h-[100dvh] relative overflow-hidden">
            {/* Vibrant Mesh Gradient Background */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-rose-50/80 animate-gradient-xy" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-blob animation-delay-2000" />
            </div>

            <div className="w-full max-w-md w-full relative z-10">
                {/* Logo */}
                <div className="mb-6 text-center animate-float">
                    <Link href="/" className="inline-flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300">
                            <img src="/wesal-logo.svg" alt="وصال" className="w-8 h-8 invert brightness-0 text-white" />
                        </div>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white/80 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
                    <h1 className="text-2xl font-black text-center mb-2 text-slate-900">إنشاء حساب جديد</h1>
                    <p className="text-slate-500 text-center mb-6 font-medium">
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
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">الاسم المعروض</label>
                            <div className="relative group">
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                <input
                                    type="text"
                                    className="w-full bg-white/50 border border-slate-200 focus:border-violet-500 focus:ring-violet-200 rounded-xl px-4 py-3 pr-10 text-right outline-none transition-all duration-300 placeholder:text-slate-300 focus:bg-white"
                                    placeholder="كيف تحب نناديك؟"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">البريد الإلكتروني</label>
                            <div className="relative group">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                <input
                                    type="email"
                                    className="w-full bg-white/50 border border-slate-200 focus:border-violet-500 focus:ring-violet-200 rounded-xl px-4 py-3 pr-10 text-right outline-none transition-all duration-300 placeholder:text-slate-300 focus:bg-white"
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
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">تاريخ الميلاد</label>
                            <div className="relative group">
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                <input
                                    type="date"
                                    className="w-full bg-white/50 border border-slate-200 focus:border-violet-500 focus:ring-violet-200 rounded-xl px-4 py-3 pr-10 text-right outline-none transition-all duration-300 placeholder:text-slate-300 focus:bg-white text-slate-600"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">الجنس</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: 'MALE' })}
                                    className={`p-3 rounded-xl border transition-all duration-300 text-center font-medium ${formData.gender === 'MALE'
                                        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-md shadow-violet-500/10'
                                        : 'border-slate-200 bg-white/50 text-slate-500 hover:border-violet-300 hover:bg-white'
                                        }`}
                                >
                                    👨 ذكر
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, gender: 'FEMALE' })}
                                    className={`p-3 rounded-xl border transition-all duration-300 text-center font-medium ${formData.gender === 'FEMALE'
                                        ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 shadow-md shadow-fuchsia-500/10'
                                        : 'border-slate-200 bg-white/50 text-slate-500 hover:border-fuchsia-300 hover:bg-white'
                                        }`}
                                >
                                    👩 أنثى
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">كلمة المرور</label>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-white/50 border border-slate-200 focus:border-violet-500 focus:ring-violet-200 rounded-xl px-4 py-3 pr-10 pl-10 text-left outline-none transition-all duration-300 placeholder:text-slate-300 focus:bg-white"
                                    placeholder="6 أحرف على الأقل"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-right text-slate-700">تأكيد كلمة المرور</label>
                            <div className="relative group">
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-white/50 border border-slate-200 focus:border-violet-500 focus:ring-violet-200 rounded-xl px-4 py-3 pr-10 text-left outline-none transition-all duration-300 placeholder:text-slate-300 focus:bg-white"
                                    placeholder="أعد كتابة كلمة المرور"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <p className="text-xs text-slate-400 text-center font-medium">
                            بالتسجيل، أنت تؤكد أن عمرك 18+ وتوافق على{' '}
                            <Link href="/terms" className="text-violet-600 hover:underline">
                                الشروط والأحكام
                            </Link>{' '}
                            و{' '}
                            <Link href="/privacy" className="text-violet-600 hover:underline">
                                سياسة الخصوصية
                            </Link>
                        </p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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

                    <p className="mt-6 text-center text-slate-500 text-sm">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-bold hover:underline transition-all">
                            سجل دخول
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
