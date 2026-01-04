'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();

    const userId = searchParams.get('userId');
    const email = searchParams.get('email') || '';
    const type = searchParams.get('type') || 'EMAIL_VERIFICATION';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    // Auto-focus first input on mount
    useEffect(() => {
        const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement;
        firstInput?.focus();
    }, []);

    // Auto-submit when all 6 digits are entered
    useEffect(() => {
        const fullCode = code.join('');
        if (fullCode.length === 6 && !code.includes('')) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code]);

    // Handle code input
    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newCode = [...code];
            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newCode[index + i] = digit;
                }
            });
            setCode(newCode);

            // Focus last filled or next empty
            const nextIndex = Math.min(index + digits.length, 5);
            const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement;
            nextInput?.focus();
        } else {
            const newCode = [...code];
            newCode[index] = value.replace(/\D/g, '');
            setCode(newCode);

            // Move to next input
            if (value && index < 5) {
                const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
                nextInput?.focus();
            }
        }
        setError('');
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
            prevInput?.focus();
        }
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');

        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        if (!userId) {
            setError('Invalid verification link');
            return;
        }

        setIsLoading(true);
        try {
            const result = await api.auth.verifyOtp({
                userId,
                code: fullCode,
                type,
            }) as any;

            if (result.accessToken) {
                setTokens(result.accessToken, result.refreshToken);
                api.setAccessToken(result.accessToken);
            }

            setIsVerified(true);

            // Redirect to onboarding after a short delay
            setTimeout(() => {
                router.push('/onboarding');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
            // Clear code on error
            setCode(['', '', '', '', '', '']);
            const firstInput = document.querySelector('input[data-index="0"]') as HTMLInputElement;
            firstInput?.focus();
        } finally {
            setIsLoading(false);
        }
    }, [code, userId, type, router, setTokens]);

    // Resend OTP
    const handleResend = async () => {
        if (resendCooldown > 0 || !userId) return;

        setIsResending(true);
        setError('');

        try {
            // TODO: Implement resend OTP API endpoint
            // For now, just start the cooldown timer
            setResendCooldown(60); // 60 second cooldown
        } catch (err: any) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
                    <p className="text-surface-400">Redirecting to your dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <img src="/wesal-logo.svg" alt="Wesal" className="w-12 h-12" />
                        <span className="text-2xl font-bold">وصال</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">Verify Your Email</h1>
                    <p className="text-surface-400 text-center mb-2">
                        We've sent a 6-digit code to
                    </p>
                    {email && (
                        <p className="text-primary-400 text-center mb-6 font-medium">
                            {email}
                        </p>
                    )}

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-3" dir="ltr">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    data-index={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={isLoading}
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-surface-800/50 border border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all disabled:opacity-50"
                                />
                            ))}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || code.join('').length !== 6}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>
                    </form>

                    {/* Resend Section */}
                    <div className="mt-6 text-center">
                        <p className="text-surface-400 text-sm mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isResending}
                            className="text-primary-400 hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Resend in ${resendCooldown}s`
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Resend Code
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-surface-400">Loading...</p>
                </div>
            </main>
        }>
            <VerifyContent />
        </Suspense>
    );
}
