'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Users, Check, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { useRelationshipStage, RelationshipStage } from '@/hooks/useRelationshipStage';
import { useSettingsStore } from '@/stores/settings-store';

export default function RelationshipSettingsPage() {
    const router = useRouter();
    const { stage, updateStage, isLoading: stageLoading } = useRelationshipStage();
    const { theme } = useSettingsStore();
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStage, setSelectedStage] = useState<RelationshipStage | null>(null);

    const handleUpdateStage = async (newStage: RelationshipStage) => {
        if (newStage === stage) return;

        setSelectedStage(newStage);
        setIsUpdating(true);
        try {
            await updateStage(newStage);
            // Redirect to dashboard to see new layout
            router.push('/dashboard');
        } catch (err) {
            console.error('Failed to update stage:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const stages = [
        {
            id: 'khatba' as RelationshipStage,
            title: 'نتعرف على بعض',
            subtitle: 'Getting to Know Each Other',
            description: 'في فترة الخطوبة أو التعارف قبل الزواج',
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            id: 'married' as RelationshipStage,
            title: 'متزوجين',
            subtitle: 'Married',
            description: 'مرتبطين ونبي نقوي علاقتنا',
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
        },
    ];

    if (stageLoading) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-surface-50' : 'bg-surface-900'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className={`min-h-screen p-4 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border ${theme === 'light' ? 'bg-white/50 border-white/40' : 'bg-surface-800/60 border-surface-700/50'}`}
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">مرحلة العلاقة</h1>
                    <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        Relationship Stage
                    </p>
                </div>
            </div>

            {/* Current Stage Badge */}
            <div className={`rounded-2xl p-4 mb-6 backdrop-blur-xl border ${theme === 'light' ? 'bg-white/60 border-white/50' : 'bg-surface-800/50 border-surface-700/30'}`}>
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            المرحلة الحالية
                        </p>
                        <p className="font-bold">
                            {stage === 'khatba' ? 'فترة التعارف / الخطوبة' : 'متزوجين'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stage Selection */}
            <h2 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                تغيير المرحلة
            </h2>
            <div className="space-y-4">
                {stages.map((stageOption) => (
                    <motion.button
                        key={stageOption.id}
                        onClick={() => handleUpdateStage(stageOption.id)}
                        disabled={isUpdating || stage === stageOption.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full rounded-2xl p-5 text-right transition-all border ${stage === stageOption.id
                                ? 'border-primary-500/70 ring-2 ring-primary-500/30'
                                : theme === 'light'
                                    ? 'bg-white/60 border-white/50 hover:border-primary-500/30'
                                    : 'bg-surface-800/50 border-surface-700/30 hover:border-primary-500/30'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stageOption.gradient} flex items-center justify-center shadow-lg`}>
                                <stageOption.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-0.5">{stageOption.title}</h3>
                                <p className="text-xs text-surface-500 mb-1">{stageOption.subtitle}</p>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {stageOption.description}
                                </p>
                            </div>
                            {stage === stageOption.id ? (
                                <Check className="w-5 h-5 text-primary-500" />
                            ) : isUpdating && selectedStage === stageOption.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                            ) : (
                                <ArrowRight className="w-5 h-5 text-surface-500" />
                            )}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Note */}
            <p className={`mt-8 text-xs text-center ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>
                عند تغيير المرحلة، ستتغير واجهة التطبيق لتناسب احتياجاتكم الجديدة.
            </p>
        </main>
    );
}
