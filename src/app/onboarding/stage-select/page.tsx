'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Users, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

type RelationshipStage = 'khatba' | 'married';

export default function StageSelectPage() {
    const router = useRouter();
    const supabase = createClient();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedStage, setSelectedStage] = useState<RelationshipStage | null>(null);

    const handleSelectStage = async (stage: RelationshipStage) => {
        setSelectedStage(stage);
        setIsLoading(true);

        try {
            // Update user's profile with selected stage
            const { error } = await supabase
                .from('profiles')
                .update({ relationship_stage: stage })
                .eq('id', user?.id);

            if (error) throw error;

            // Proceed to pairing onboarding
            router.push('/onboarding');
        } catch (err) {
            console.error('Failed to save stage:', err);
            // Still proceed - the column might not exist yet
            router.push('/onboarding');
        } finally {
            setIsLoading(false);
        }
    };

    const stages = [
        {
            id: 'khatba' as RelationshipStage,
            title: 'نتعرف على بعض',
            subtitle: 'Get to Know Each Other',
            description: 'في فترة الخطوبة أو التعارف قبل الزواج',
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
            bgGlow: 'bg-violet-500/20',
        },
        {
            id: 'married' as RelationshipStage,
            title: 'متزوجين',
            subtitle: 'Married',
            description: 'مرتبطين ونبي نقوي علاقتنا',
            icon: Heart,
            gradient: 'from-rose-500 to-pink-600',
            bgGlow: 'bg-rose-500/20',
        },
    ];

    return (
        <main className="min-h-screen flex items-center justify-center p-4 font-sans">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md text-center"
            >
                {/* Logo */}
                <div className="inline-flex items-center gap-2 mb-6">
                    <img src="/wesal-logo.svg" alt="وصال" className="w-12 h-12" />
                    <span className="text-2xl font-bold">وصال</span>
                </div>

                <h1 className="text-3xl font-bold mb-3">أهلاً بك 👋</h1>
                <p className="text-surface-400 mb-8">وين أنتم في رحلتكم؟</p>

                {/* Stage Selection Cards */}
                <div className="space-y-4">
                    {stages.map((stage, idx) => (
                        <motion.button
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => handleSelectStage(stage.id)}
                            disabled={isLoading}
                            className={`w-full glass-card p-6 text-right hover:border-primary-500/50 transition-all group relative overflow-hidden ${selectedStage === stage.id ? 'border-primary-500/70 ring-2 ring-primary-500/30' : ''
                                }`}
                        >
                            {/* Glow Effect */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 ${stage.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-lg`}>
                                    <stage.icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-0.5">{stage.title}</h3>
                                    <p className="text-xs text-surface-500 mb-1">{stage.subtitle}</p>
                                    <p className="text-sm text-surface-400">{stage.description}</p>
                                </div>
                                {isLoading && selectedStage === stage.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                                ) : (
                                    <ArrowRight className="w-5 h-5 text-surface-500 group-hover:text-primary-400 transition-colors" />
                                )}
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Subtle Note */}
                <p className="mt-8 text-xs text-surface-500">
                    <Sparkles className="w-3 h-3 inline-block ml-1" />
                    تقدر تغير هذا الاختيار لاحقًا من الإعدادات
                </p>
            </motion.div>
        </main>
    );
}
