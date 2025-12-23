'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setStep('otp');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid OTP');
            }

            // Redirect to admin dashboard
            router.push('/admin');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
                    {step === 'email' ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
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
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Send OTP
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Enter OTP Code
                                </label>
                                <p className="text-sm text-slate-400 mb-4">
                                    We sent a 6-digit code to <strong className="text-white">{email}</strong>
                                </p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-center text-2xl tracking-widest font-mono focus:outline-none focus:border-primary-500 transition-colors"
                                    required
                                    disabled={loading}
                                    maxLength={6}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Verify & Login
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('email');
                                        setOtp('');
                                        setError('');
                                    }}
                                    className="w-full text-slate-400 hover:text-white transition-colors text-sm"
                                >
                                    ← Use different email
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Protected by OTP authentication
                </p>
            </div>
        </div>
    );
}
