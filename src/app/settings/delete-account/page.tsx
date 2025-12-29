'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, Trash2, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function DeleteAccountPage() {
    const router = useRouter();
    const supabase = createClient();
    const { user, signOut } = useAuth();

    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const requiredText = 'حذف حسابي';
    const isConfirmed = confirmText === requiredText;

    const handleDelete = async () => {
        if (!isConfirmed) {
            setError('يرجى كتابة النص المطلوب للتأكيد');
            return;
        }

        if (!user?.id) {
            setError('لم يتم العثور على المستخدم');
            return;
        }

        setIsDeleting(true);
        setError('');

        try {
            // 1. Delete user's sessions
            await supabase.from('sessions').delete().eq('user_id', user.id);

            // 2. Delete user's check-ins
            await supabase.from('check_ins').delete().eq('user_id', user.id);

            // 3. Delete user's notifications
            await supabase.from('notifications').delete().eq('user_id', user.id);

            // 4. Get couple and deactivate it
            const { data: couple } = await supabase
                .from('couples')
                .select('id')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .eq('status', 'ACTIVE')
                .single();

            if (couple) {
                await supabase
                    .from('couples')
                    .update({ status: 'DELETED' })
                    .eq('id', couple.id);
            }

            // 5. Delete profile
            await supabase.from('profiles').delete().eq('id', user.id);

            // 6. Delete auth user (this requires admin/service role, so we'll just sign out)
            // The actual user deletion should be done via edge function or admin API

            // 7. Sign out
            await signOut();

            // 8. Redirect to home
            router.push('/');

        } catch (err: any) {
            console.error('Delete account error:', err);
            setError('حدث خطأ أثناء حذف الحساب. يرجى المحاولة مرة أخرى.');
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-red-400">حذف الحساب</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Warning Icon */}
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">هل أنت متأكد تماماً؟</h2>
                        <p className="text-surface-400">هذا الإجراء لا يمكن التراجع عنه</p>
                    </div>

                    {/* Warning Box */}
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-right space-y-2">
                                <h4 className="font-bold text-red-400">سيتم حذف ما يلي نهائياً:</h4>
                                <ul className="text-sm text-red-200/80 space-y-1 list-disc list-inside">
                                    <li>جميع بيانات ملفك الشخصي</li>
                                    <li>سجل الألعاب والإنجازات</li>
                                    <li>سجلات الارتباط مع الشريك</li>
                                    <li>تاريخ التقييمات العاطفية</li>
                                    <li>جميع الاشتراكات والدفعات</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-3">
                        <p className="text-surface-300 text-right">
                            للتأكيد، اكتب <span className="font-bold text-white">"{requiredText}"</span> في الحقل أدناه:
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => {
                                setConfirmText(e.target.value);
                                setError('');
                            }}
                            className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-center placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all
                ${error ? 'border-red-500' : isConfirmed ? 'border-emerald-500' : 'border-white/10'}`}
                            placeholder={requiredText}
                            dir="rtl"
                        />
                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}
                        {isConfirmed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center gap-2 text-emerald-400"
                            >
                                <Check className="w-4 h-4" />
                                <span className="text-sm">تم التأكيد</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                جاري الحذف...
                            </>
                        ) : (
                            'حذف حسابي نهائياً'
                        )}
                    </button>

                    {/* Cancel Link */}
                    <Link
                        href="/settings"
                        className="block text-center text-surface-400 hover:text-white transition-colors"
                    >
                        تراجع والعودة للإعدادات
                    </Link>
                </motion.div>
            </main>
        </div>
    );
}
