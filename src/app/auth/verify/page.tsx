'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setTokens, setUser } = useAuthStore();

    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'EMAIL_VERIFICATION';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // Auto-focus and handle input
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
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement;
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            // Redirect to onboarding (pairing) after a short delay
            setTimeout(() => {
                router.push('/onboarding');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerified) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verified!</h1>
                    <p className="text-surface-400">Redirecting to dashboard...</p>
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
                        <Heart className="w-8 h-8 text-primary-500" fill="currentColor" />
                        <span className="text-xl font-bold">Couples Game</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">Verify Your Email</h1>
                    <p className="text-surface-400 text-center mb-8">
                        We've sent a 6-digit code to your email
                    </p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input */}
                        <div className="flex justify-center gap-3">
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
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-surface-800/50 border border-surface-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                                />
                            ))}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-surface-400 text-sm">
                        Didn't receive the code?{' '}
                        <button className="text-primary-400 hover:underline">
                            Resend
                        </button>
                    </p>
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
