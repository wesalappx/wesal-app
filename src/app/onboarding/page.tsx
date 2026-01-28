'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Copy, Users, Check, Loader2, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';

type Mode = 'choice' | 'generate' | 'enter' | 'success';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, setPartner, setIsPaired } = useAuthStore();

    const [mode, setMode] = useState<Mode>('choice');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [enteredCode, setEnteredCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [partnerName, setPartnerName] = useState('');

    // Check if already paired on mount, and check for relationship stage
    useEffect(() => {
        const checkPairingStatus = async () => {
            try {
                // First check if user has selected a relationship stage
                const supabase = createClient();
                const { data: { user: currentUser } } = await supabase.auth.getUser();

                if (currentUser) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('relationship_stage')
                        .eq('id', currentUser.id)
                        .single();

                    // If no relationship stage is set, redirect to stage-select first
                    if (!profile?.relationship_stage) {
                        router.push('/onboarding/stage-select');
                        return;
                    }
                }

                // Then check pairing status
                const status = await api.pairing.getStatus();
                if (status.isPaired && status.partner) {
                    setPartner(status.partner);
                    setIsPaired(true);
                    router.push('/dashboard');
                }
            } catch {
                // Not paired yet, stay on onboarding
            }
        };
        checkPairingStatus();
    }, [router, setPartner, setIsPaired]);

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.pairing.generateCode();
            setGeneratedCode(result.code);
            setMode('generate');
        } catch (err: any) {
            setError(err.message || 'فشل إنشاء الكود');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCode = async () => {
        if (!generatedCode) return;
        try {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = generatedCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareCode = async () => {
        if (!generatedCode) return;
        const shareData = {
            title: 'دعوة وصال',
            text: `انضم إلي في تطبيق وصال! كود الدعوة: ${generatedCode}`,
            url: window.location.origin,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopyCode();
            }
        } catch {
            // User cancelled share
        }
    };

    const handleAcceptCode = async () => {
        if (enteredCode.length !== 6) {
            setError('الكود يجب أن يكون 6 أرقام');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const result = await api.pairing.acceptCode(enteredCode) as any;
            if (result.partner) {
                setPartnerName(result.partner.displayName || 'شريكك');
                setPartner(result.partner);
                setIsPaired(true);
            }
            setMode('success');
            // Redirect after celebration
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'كود غير صالح أو منتهي الصلاحية');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeInput = (value: string) => {
        // Only allow digits, max 6
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setEnteredCode(cleaned);
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 font-sans">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <AnimatePresence mode="wait">
                {/* Choice Screen */}
                {mode === 'choice' && (
                    <motion.div
                        key="choice"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md text-center"
                    >
                        {/* Logo */}
                        <div className="inline-flex items-center gap-2 mb-8">
                            <img src="/wesal-logo.svg" alt="وصال" className="w-12 h-12" />
                            <span className="text-2xl font-bold">وصال</span>
                        </div>

                        <h1 className="text-3xl font-bold mb-3">أهلاً {user?.displayName || ''} 👋</h1>
                        <p className="text-surface-400 mb-10">خلينا نربطك مع شريك حياتك</p>

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Generate Code Button */}
                            <button
                                onClick={handleGenerateCode}
                                disabled={isLoading}
                                className="w-full glass-card p-6 text-right hover:border-primary-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                                        <Share2 className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">أدعو شريكي</h3>
                                        <p className="text-sm text-surface-400">أنشئ كود دعوة وأرسله لشريكك</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-colors" />
                                </div>
                            </button>

                            {/* Enter Code Button */}
                            <button
                                onClick={() => setMode('enter')}
                                className="w-full glass-card p-6 text-right hover:border-accent-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-accent-500/20 flex items-center justify-center group-hover:bg-accent-500/30 transition-colors">
                                        <Users className="w-6 h-6 text-accent-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">عندي كود دعوة</h3>
                                        <p className="text-sm text-surface-400">استلمت كود من شريكك؟ أدخله هنا</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-accent-400 transition-colors" />
                                </div>
                            </button>
                        </div>

                        {isLoading && (
                            <div className="mt-6 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Generate Code Screen */}
                {mode === 'generate' && generatedCode && (
                    <motion.div
                        key="generate"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md text-center"
                    >
                        <div className="glass-card p-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <Heart className="w-10 h-10 text-primary-500" fill="currentColor" />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">كود الدعوة جاهز!</h2>
                            <p className="text-surface-400 mb-8">أرسل هذا الكود لشريك حياتك</p>

                            {/* Code Display */}
                            <div className="bg-surface-800/50 rounded-2xl p-6 mb-6">
                                <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary-400">
                                    {generatedCode}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={handleCopyCode}
                                    className={`btn-secondary flex items-center justify-center gap-2 ${copied ? 'bg-green-500/20 border-green-500/50' : ''}`}
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                    {copied ? 'تم النسخ!' : 'نسخ'}
                                </button>
                                <button
                                    onClick={handleShareCode}
                                    className="btn-primary flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-5 h-5" />
                                    مشاركة
                                </button>
                            </div>

                            <p className="text-xs text-surface-500">
                                الكود صالح لمدة 24 ساعة. بعد إدخال شريكك للكود، سيتم ربط حساباتكم.
                            </p>
                        </div>

                        <button
                            onClick={() => setMode('choice')}
                            className="mt-6 text-surface-400 hover:text-white transition-colors"
                        >
                            ← رجوع
                        </button>
                    </motion.div>
                )}

                {/* Enter Code Screen */}
                {mode === 'enter' && (
                    <motion.div
                        key="enter"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md text-center"
                    >
                        <div className="glass-card p-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-500/20 flex items-center justify-center">
                                <Users className="w-10 h-10 text-accent-500" />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">أدخل كود الدعوة</h2>
                            <p className="text-surface-400 mb-8">الكود المكون من 6 أرقام من شريكك</p>

                            {error && (
                                <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Code Input */}
                            <div className="mb-6">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={enteredCode}
                                    onChange={(e) => handleCodeInput(e.target.value)}
                                    placeholder="000000"
                                    className="w-full text-center text-4xl font-mono font-bold tracking-[0.5em] py-4 px-6 rounded-2xl bg-surface-800/50 border border-surface-600 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleAcceptCode}
                                disabled={isLoading || enteredCode.length !== 6}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        ربط الحسابات
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => { setMode('choice'); setError(''); }}
                            className="mt-6 text-surface-400 hover:text-white transition-colors"
                        >
                            ← رجوع
                        </button>
                    </motion.div>
                )}

                {/* Success Screen */}
                {mode === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                        className="w-full max-w-md text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-xl shadow-primary-500/30"
                        >
                            <Sparkles className="w-12 h-12 text-white" />
                        </motion.div>

                        <h1 className="text-3xl font-bold mb-3">تم الربط بنجاح! 🎉</h1>
                        <p className="text-xl text-surface-300 mb-2">
                            أنت و <span className="text-primary-400 font-bold">{partnerName}</span> الآن مرتبطين
                        </p>
                        <p className="text-surface-400">جاري الانتقال للوحة التحكم...</p>

                        <div className="mt-8">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary-400" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
