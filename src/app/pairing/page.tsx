'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Copy, Check, QrCode, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { usePairing } from '@/hooks/usePairing';
import { useTranslation } from '@/hooks/useTranslation';

export default function PairingPage() {
    const { t, language } = useTranslation();
    const router = useRouter();
    const { generateCode, acceptCode, getStatus, getMyCode, isLoading: hookLoading } = usePairing();

    const [mode, setMode] = useState<'choose' | 'generate' | 'enter'>('choose');
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check if already paired on mount
    useEffect(() => {
        const checkPairing = async () => {
            const { isPaired } = await getStatus();
            if (isPaired) {
                router.push('/dashboard');
            }
            setCheckingStatus(false);
        };
        checkPairing();
    }, []);

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setError('');
        const result = await generateCode();

        if (result.error) {
            setError(result.error);
        } else if (result.code) {
            setPairingCode(result.code);
            setExpiresAt(result.expiresAt || null);
            setMode('generate');
        }
        setIsLoading(false);
    };

    const copyCode = () => {
        if (pairingCode) {
            navigator.clipboard.writeText(pairingCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAcceptCode = async () => {
        if (inputCode.length !== 6) {
            setError('يرجى إدخال رمز مكون من 6 أرقام');
            return;
        }

        setIsLoading(true);
        setError('');

        const { success: accepted, error: acceptError } = await acceptCode(inputCode);

        if (acceptError) {
            setError(acceptError);
        } else if (accepted) {
            setSuccess(true);
        }
        setIsLoading(false);
    };

    if (checkingStatus) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    const [partnerInfo, setPartnerInfo] = useState<{ name: string; id: string } | null>(null);

    // Fetch partner info when pairing succeeds
    useEffect(() => {
        if (success) {
            const fetchPartner = async () => {
                const { partner } = await getStatus();
                if (partner) {
                    setPartnerInfo({
                        name: partner.display_name || 'شريكك',
                        id: partner.id
                    });
                }
            };
            fetchPartner();
        }
    }, [success]);

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Confetti-like particles */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                backgroundColor: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399'][i % 4],
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 2}s`,
                                opacity: 0.6
                            }}
                        />
                    ))}
                </div>

                <div className="text-center glass-card p-12 max-w-md relative z-10">
                    {/* Success Icon */}
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/30 animate-pulse">
                        <span className="text-6xl">💕</span>
                    </div>

                    <h1 className="text-3xl font-bold mb-3 text-white">{t('pairing.success')}</h1>

                    {/* Partner Name Display */}
                    <div className="my-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30">
                        <p className="text-surface-400 text-sm mb-1">
                            {language === 'ar' ? 'أنتما الآن مرتبطان' : 'You are now paired with'}
                        </p>
                        <p className="text-2xl font-bold text-white">
                            {partnerInfo?.name || '...'}
                        </p>
                    </div>

                    <p className="text-surface-400 mb-8">
                        {t('pairing.successMsg')}
                    </p>

                    <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg">
                        {t('pairing.startJourney')}
                        <Heart className="w-5 h-5" />
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-44">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md mx-auto pt-8">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-8"
                >
                    <ArrowLeft className="w-5 h-5 transform rotate-180" />
                    {t('common.back')}
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                        <Users className="w-10 h-10 text-primary-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{t('pairing.title')}</h1>
                    <p className="text-surface-400">
                        {t('pairing.desc')}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center" dir="rtl">
                        {error}
                    </div>
                )}

                {mode === 'choose' && (
                    <div className="space-y-4">
                        <button
                            onClick={handleGenerateCode}
                            disabled={isLoading}
                            className="glass-card p-6 w-full text-right hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-4 flex-row-reverse">
                                <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    {isLoading ? (
                                        <Loader2 className="w-7 h-7 text-primary-500 animate-spin" />
                                    ) : (
                                        <QrCode className="w-7 h-7 text-primary-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{t('pairing.generate')}</h3>
                                    <p className="text-sm text-surface-400">
                                        {t('pairing.generateDesc')}
                                    </p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('enter')}
                            className="glass-card p-6 w-full text-right hover:bg-white/5 transition-colors group"
                        >
                            <div className="flex items-center gap-4 flex-row-reverse">
                                <div className="w-14 h-14 rounded-xl bg-accent-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Heart className="w-7 h-7 text-accent-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{t('pairing.enter')}</h3>
                                    <p className="text-sm text-surface-400">
                                        {t('pairing.enterDesc')}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {mode === 'generate' && pairingCode && (
                    <div className="glass-card p-8 text-center">
                        <p className="text-surface-400 mb-4">{t('pairing.shareCode')}</p>

                        <div className="relative mb-6">
                            <div className="text-4xl font-mono font-bold tracking-widest py-4">
                                {pairingCode}
                            </div>
                            <button
                                onClick={copyCode}
                                className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5 text-surface-400" />
                                )}
                            </button>
                        </div>

                        <p className="text-sm text-surface-400 mb-6">
                            {t('pairing.expires')}
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setMode('choose')}
                                className="btn-secondary flex-1"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                onClick={copyCode}
                                className="btn-primary flex-1"
                            >
                                {copied ? t('pairing.copied') : t('pairing.copy')}
                            </button>
                        </div>

                        <p className="mt-6 text-sm text-surface-400">
                            {t('pairing.waiting')}
                        </p>
                    </div>
                )}

                {mode === 'enter' && (
                    <div className="glass-card p-8">
                        <p className="text-center text-surface-400 mb-6">
                            {t('pairing.inputPlaceholder')}
                        </p>

                        <input
                            type="text"
                            maxLength={6}
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="input text-center text-3xl font-mono tracking-widest mb-6"
                            dir="ltr"
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setMode('choose')}
                                className="btn-secondary flex-1"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                onClick={handleAcceptCode}
                                disabled={isLoading || inputCode.length !== 6}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('pairing.connecting')}
                                    </>
                                ) : (
                                    t('pairing.connect')
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
