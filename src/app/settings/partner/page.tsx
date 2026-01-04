'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, HeartCrack, AlertTriangle, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePairing } from '@/hooks/usePairing';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';

export default function PartnerPage() {
    const router = useRouter();
    const supabase = createClient();
    const { getStatus } = usePairing();
    const { theme } = useSettingsStore();

    const [showUnpairModal, setShowUnpairModal] = useState(false);
    const [isUnpairing, setIsUnpairing] = useState(false);
    const [unpairSuccess, setUnpairSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Partner data from Supabase
    const [partner, setPartner] = useState<{
        name: string;
        email: string;
        pairedDate: string;
        daysTogetherRelative: number;
        coupleId: string | null;
    } | null>(null);

    useEffect(() => {
        async function fetchPartner() {
            const { isPaired, partner: p, coupleId } = await getStatus();
            if (isPaired && p) {
                // Calculate days together
                const { data: couple } = await supabase
                    .from('couples')
                    .select('created_at')
                    .eq('id', coupleId)
                    .single();

                const pairedDate = couple?.created_at || new Date().toISOString();
                const daysTogether = Math.floor((Date.now() - new Date(pairedDate).getTime()) / (1000 * 60 * 60 * 24));

                setPartner({
                    name: p.display_name || 'الشريك',
                    email: '***', // Privacy
                    pairedDate,
                    daysTogetherRelative: daysTogether,
                    coupleId,
                });
            }
            setIsLoading(false);
        }
        fetchPartner();
    }, [getStatus]);

    const handleUnpair = async () => {
        if (!partner?.coupleId) return;
        setIsUnpairing(true);

        // Deactivate couple
        await supabase
            .from('couples')
            .update({ status: 'INACTIVE' })
            .eq('id', partner.coupleId);

        setIsUnpairing(false);
        setUnpairSuccess(true);

        setTimeout(() => {
            router.push('/onboarding');
        }, 2000);
    };

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                        <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>إدارة الربط</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                {unpairSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-700 flex items-center justify-center">
                            <HeartCrack className="w-10 h-10 text-surface-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">تم فك الربط</h2>
                        <p className="text-surface-400 mb-8">سيتم تحويلك للبحث عن شريك جديد...</p>
                    </motion.div>
                ) : isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                    </div>
                ) : !partner ? (
                    <div className="text-center py-12 text-surface-400">
                        لا يوجد شريك مرتبط حالياً.
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Partner Card */}
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                                    {partner.name.charAt(0)}
                                </div>
                                <div className="flex-1 text-right">
                                    <h3 className="text-xl font-bold text-white">{partner.name}</h3>
                                    <p className="text-surface-300 text-sm">{partner.email}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">{partner.daysTogetherRelative}</p>
                                    <p className="text-sm text-surface-400">يوم معاً</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 text-center">
                                    <p className="text-lg font-bold text-white mb-1">
                                        {new Date(partner.pairedDate).toLocaleDateString('ar-SA', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-sm text-surface-400">تاريخ الربط</p>
                                </div>
                            </div>
                        </div>

                        {/* Warning Section */}
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-right">
                                    <h4 className="font-bold text-amber-400 mb-1">تنبيه مهم</h4>
                                    <p className="text-sm text-amber-200/80">
                                        فك الربط سيؤدي إلى حذف جميع البيانات المشتركة بينكما بما في ذلك سجل الألعاب والإنجازات المشتركة.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Unpair Button */}
                        <button
                            onClick={() => setShowUnpairModal(true)}
                            className="w-full py-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 font-bold text-lg transition-all flex items-center justify-center gap-3"
                        >
                            <HeartCrack className="w-6 h-6" />
                            فك الربط مع الشريك
                        </button>
                    </motion.div>
                )}
            </main>

            {/* Unpair Confirmation Modal */}
            <AnimatePresence>
                {showUnpairModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isUnpairing && setShowUnpairModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-surface-800 rounded-3xl p-6 border border-white/10 shadow-2xl"
                        >
                            {/* Close Button */}
                            {!isUnpairing && (
                                <button
                                    onClick={() => setShowUnpairModal(false)}
                                    className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-surface-400" />
                                </button>
                            )}

                            {/* Content */}
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <HeartCrack className="w-8 h-8 text-red-400" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">هل أنت متأكد؟</h3>
                                <p className="text-surface-400 mb-6">
                                    سيتم فك الربط مع <span className="text-white font-medium">{partner?.name || 'الشريك'}</span> وحذف جميع البيانات المشتركة. هذا الإجراء لا يمكن التراجع عنه.
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowUnpairModal(false)}
                                        disabled={isUnpairing}
                                        className="flex-1 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl text-white font-medium transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={handleUnpair}
                                        disabled={isUnpairing}
                                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl text-white font-bold transition-colors"
                                    >
                                        {isUnpairing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                جاري...
                                            </span>
                                        ) : (
                                            'تأكيد فك الربط'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
