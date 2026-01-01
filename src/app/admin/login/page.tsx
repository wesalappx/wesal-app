'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Force dynamic rendering to avoid build errors with useSearchParams
export const dynamic = 'force-dynamic';

// Allowed admin emails - must match the list in verify-otp route
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
];

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Check for error in URL params
    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError) {
            const errorMessages: Record<string, string> = {
                'no_code': 'No authentication code provided',
                'auth_failed': 'Authentication failed. Please try again.',
                'unauthorized': 'This email is not authorized for admin access',
                'server_error': 'Server error. Please try again later.',
            };
            setError(errorMessages[urlError] || 'An error occurred');
        }
    }, [searchParams]);

    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check if email is in allowed list
            if (!ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
                throw new Error('This email is not authorized for admin access');
            }

            // Send magic link via Supabase
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/admin/auth-callback`,
                },
            });

            if (authError) {
                throw new Error(authError.message);
            }

            setSent(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send login link';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
                        <p className="text-slate-400">
                            We sent a login link to <strong className="text-white">{email}</strong>
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                        <p className="text-slate-300 mb-6">
                            Click the link in your email to access the admin dashboard.
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            The link will expire in 1 hour.
                        </p>
                        <button
                            onClick={() => {
                                setSent(false);
                                setEmail('');
                            }}
                            className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            ← Use different email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <form onSubmit={handleSendMagicLink} className="space-y-6">
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
                                    Send Login Link
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Protected by Supabase Authentication
                </p>
            </div>
        </div>
    );
}
