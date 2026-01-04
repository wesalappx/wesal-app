'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, ArrowRight, CheckCircle, Loader2, KeyRound } from 'lucide-react';

// Allowed admin emails - must match the list in verify-otp route
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
];

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [resendCooldown, setResendCooldown] = useState(0);
    const router = useRouter();

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    // Auto-focus first OTP input when step changes
    useEffect(() => {
        if (step === 'otp') {
            const firstInput = document.querySelector('input[data-otp-index="0"]') as HTMLInputElement;
            firstInput?.focus();
        }
    }, [step]);

    // Handle OTP input
    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newOtp[index + i] = digit;
                }
            });
            setOtp(newOtp);
            const nextIndex = Math.min(index + digits.length, 5);
            const nextInput = document.querySelector(`input[data-otp-index="${nextIndex}"]`) as HTMLInputElement;
            nextInput?.focus();
        } else {
            const newOtp = [...otp];
            newOtp[index] = value.replace(/\D/g, '');
            setOtp(newOtp);
            if (value && index < 5) {
                const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement;
                nextInput?.focus();
            }
        }
        setError('');
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement;
            prevInput?.focus();
        }
    };

    // Auto-submit OTP when all 6 digits entered
    useEffect(() => {
        const fullOtp = otp.join('');
        if (fullOtp.length === 6 && !otp.includes('') && step === 'otp') {
            handleVerifyOtp();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp, step]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check if email is in allowed list
            if (!ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
                throw new Error('This email is not authorized for admin access');
            }

            // Send OTP via API
            const response = await fetch('/api/admin/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setStep('otp');
            setResendCooldown(60);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setLoading(true);

        try {
            const otpCode = otp.join('');

            const response = await fetch('/api/admin/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            // Success - redirect to admin dashboard
            router.push('/admin');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Verification failed';
            setError(errorMessage);
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            const firstInput = document.querySelector('input[data-otp-index="0"]') as HTMLInputElement;
            firstInput?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend OTP');
            }

            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resend OTP';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // OTP Entry Step
    if (step === 'otp') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20 mb-4">
                            <KeyRound className="w-8 h-8 text-primary-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Enter OTP</h1>
                        <p className="text-slate-400">
                            We sent a 6-digit code to <strong className="text-white">{email}</strong>
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </div>
                        )}

                        {/* OTP Input */}
                        <div className="flex justify-center gap-3 mb-6" dir="ltr">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    data-otp-index={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    disabled={loading}
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50"
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Verify & Login
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
                            <button
                                onClick={handleResendOtp}
                                disabled={resendCooldown > 0 || loading}
                                className="text-primary-400 hover:underline disabled:opacity-50 disabled:no-underline text-sm"
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setStep('email');
                                setOtp(['', '', '', '', '', '']);
                                setError('');
                            }}
                            className="w-full mt-4 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            ← Use different email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Email Entry Step
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Wesal Admin</h1>
                    <p className="text-slate-400">Secure admin panel access</p>
                </div>

                {/* Login Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Send OTP
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-sm mt-6">
                    OTP expires in 10 minutes
                </p>
            </div>
        </div>
    );
}
