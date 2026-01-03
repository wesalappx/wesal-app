'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Eye, Database, Clock, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ToggleSwitch } from '@/components/SettingsCard';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { useSettingsStore } from '@/stores/settings-store';

export default function PrivacyPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const { theme } = useSettingsStore();

    const [shareAnalytics, setShareAnalytics] = useState(false);
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [saveHistory, setSaveHistory] = useState(true);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Load settings from database
    useEffect(() => {
        async function loadSettings() {
            if (!user?.id) return;

            const { data } = await supabase
                .from('profiles')
                .select('privacy_settings')
                .eq('id', user.id)
                .single();

            if (data?.privacy_settings) {
                const settings = data.privacy_settings;
                setShareAnalytics(settings.shareAnalytics ?? false);
                setShowOnlineStatus(settings.showOnlineStatus ?? true);
                setSaveHistory(settings.saveHistory ?? true);
            }
            setIsFetching(false);
        }
        loadSettings();
    }, [user?.id]);

    const handleSave = async () => {
        if (!user?.id) return;

        setIsLoading(true);

        const privacySettings = {
            shareAnalytics,
            showOnlineStatus,
            saveHistory,
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('profiles')
            .update({ privacy_settings: privacySettings })
            .eq('id', user.id);

        setIsLoading(false);

        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                        <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>الخصوصية</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Privacy Icon */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-primary-400" />
                        </div>
                        <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>تحكم في كيفية استخدام بياناتك</p>
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-4">
                        {/* Online Status */}
                        <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <ToggleSwitch
                                    enabled={showOnlineStatus}
                                    onChange={setShowOnlineStatus}
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1 text-right">
                                        <h3 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>إظهار حالة الاتصال</h3>
                                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            يساعد شريكك على معرفة أفضل وقت للتواصل معك
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save History */}
                        <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <ToggleSwitch
                                    enabled={saveHistory}
                                    onChange={setSaveHistory}
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1 text-right">
                                        <h3 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>حفظ سجل الألعاب</h3>
                                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            تتبع تقدمكم وذكرياتكم الجميلة معاً
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics */}
                        <div className={`p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <ToggleSwitch
                                    enabled={shareAnalytics}
                                    onChange={setShareAnalytics}
                                />
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1 text-right">
                                        <h3 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>المساهمة في التطوير</h3>
                                        <p className={`text-sm mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            ساعدنا على تحسين التجربة (بيانات مجهولة)
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Database className="w-5 h-5 text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDPL Notice */}
                    <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                        <h4 className="font-bold text-primary-400 mb-2 text-right">نظام حماية البيانات الشخصية</h4>
                        <p className="text-sm text-primary-200/80 text-right">
                            نحن ملتزمون بنظام حماية البيانات الشخصية في المملكة العربية السعودية. يتم حذف جميع البيانات غير الضرورية تلقائياً بعد 7 أيام.
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3"
                        >
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">تم حفظ الإعدادات</span>
                        </motion.div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            'حفظ الإعدادات'
                        )}
                    </button>

                    {/* Links */}
                    <div className="pt-4 space-y-3 text-center">
                        <Link href="/privacy-policy" className="block text-primary-400 hover:text-primary-300 transition-colors">
                            سياسة الخصوصية
                        </Link>
                        <Link href="/terms" className={`block transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-surface-400 hover:text-white'}`}>
                            شروط الاستخدام
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
