'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { validationMessages, getPasswordStrength } from '@/lib/validation-messages';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settings-store';

export default function PasswordChangePage() {
    const { updatePassword } = useAuth();
    const { theme } = useSettingsStore();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const passwordStrength = getPasswordStrength(newPassword);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!newPassword) {
            newErrors.newPassword = validationMessages.newPasswordRequired;
        } else if (newPassword.length < 8) {
            newErrors.newPassword = validationMessages.passwordMin;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = validationMessages.confirmPasswordRequired;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = validationMessages.passwordMatch;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        const { error } = await updatePassword(newPassword);

        if (error) {
            setErrors({ submit: 'حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.' });
            setIsLoading(false);
            return;
        }

        setIsLoading(false);
        setSuccess(true);

        // Reset form
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                        <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>تغيير كلمة المرور</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                    >
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-emerald-100' : 'bg-emerald-500/20'}`}>
                            <Check className={`w-10 h-10 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>تم بنجاح!</h2>
                        <p className={`mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>تم تغيير كلمة المرور بنجاح</p>
                        <Link
                            href="/settings"
                            className="inline-block px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                        >
                            العودة للإعدادات
                        </Link>
                    </motion.div>
                ) : (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        {/* Security Icon */}
                        <div className="text-center mb-8">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-primary-100' : 'bg-primary-500/20'}`}>
                                <Lock className={`w-8 h-8 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`} />
                            </div>
                            <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>أدخل كلمة المرور الجديدة</p>
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm text-center mb-4">
                                {errors.submit}
                            </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-2">
                            <label className={`block text-sm font-medium text-right ${theme === 'light' ? 'text-slate-700' : 'text-surface-300'}`}>
                                كلمة المرور الجديدة
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-right focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all
                      ${errors.newPassword ? 'border-red-500' : theme === 'light' ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-surface-500'}`}
                                    placeholder="أدخل كلمة المرور الجديدة"
                                    dir="rtl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-surface-400 hover:text-white'}`}
                                >
                                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-red-400 text-sm text-right">{errors.newPassword}</p>
                            )}

                            {/* Password Strength Indicator */}
                            {newPassword && (
                                <div className="space-y-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score
                                                    ? passwordStrength.score <= 2
                                                        ? 'bg-red-500'
                                                        : passwordStrength.score <= 4
                                                            ? 'bg-yellow-500'
                                                            : 'bg-emerald-500'
                                                    : theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-sm text-right ${passwordStrength.color}`}>
                                        {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className={`block text-sm font-medium text-right ${theme === 'light' ? 'text-slate-700' : 'text-surface-300'}`}>
                                تأكيد كلمة المرور
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-right focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all
                      ${errors.confirmPassword ? 'border-red-500' : confirmPassword && passwordsMatch ? 'border-emerald-500' : theme === 'light' ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-white/5 border-white/10 text-white placeholder-surface-500'}`}
                                    placeholder="أعد إدخال كلمة المرور الجديدة"
                                    dir="rtl"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-surface-400 hover:text-white'}`}
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                                {confirmPassword && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <Check className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-400 text-sm text-right">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 mt-8 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري التحديث...
                                </>
                            ) : (
                                'تحديث كلمة المرور'
                            )}
                        </button>
                    </motion.form>
                )}
            </main>
        </div>
    );
}
