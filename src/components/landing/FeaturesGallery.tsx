'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Gamepad2, Calendar, Route, Heart, Shield, Sparkles, Lock, Zap } from 'lucide-react';

const BentoCard = ({ children, className, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5, scale: 1.02 }}
        className={`relative overflow-hidden rounded-3xl p-8 border border-white/50 shadow-xl backdrop-blur-xl ${className}`}
    >
        {children}
    </motion.div>
);

export default function FeaturesGallery() {
    return (
        <section className="py-32 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                {/* Section Header */}
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100/50 border border-violet-200 text-violet-700 text-sm font-bold mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>ميزات استثنائية</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                        كل ما تحتاجه <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                            لعلاقة أعمق
                        </span>
                    </h2>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-3 gap-6 h-auto md:h-[900px]">

                    {/* Large Card 1: AI Coach */}
                    <BentoCard className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-violet-50 to-white flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-200/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-violet-300/50" />
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/20">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-3">المستشار الذكي (AI)</h3>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                                مستشارك الخاص للعلاقة، متاح 24/7. يفهم مشاعرك، يحلل سياق المحادثة، ويعطيك نصائح عملية ومحايدة تماماً لتقوية التواصل وحل الخلافات بهدوء.
                            </p>
                        </div>
                        <div className="mt-8 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm relative z-10 w-3/4 self-end transform rotate-2 group-hover:rotate-0 transition-transform duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs font-bold text-slate-400">تحليل الذكاء الاصطناعي</span>
                            </div>
                            <p className="text-sm text-slate-600">"لاحظت أن شريكك يحتاج للتقدير اليوم. جرب تقوله..."</p>
                        </div>
                    </BentoCard>

                    {/* Medium Card 2: Games */}
                    <BentoCard className="md:col-span-2 md:row-span-1 bg-gradient-to-br from-fuchsia-50 to-white/80" delay={0.1}>
                        <Gamepad2 className="w-10 h-10 text-fuchsia-600 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">ألعاب تفاعلية</h3>
                        <p className="text-slate-600 text-sm">
                            اكسروا الروتين بألعاب وتحديات ممتعة، من "أسئلة عميقة" لـ "حرب الحب".
                        </p>
                    </BentoCard>

                    {/* Medium Card 3: Journeys */}
                    <BentoCard className="md:col-span-2 md:row-span-1 bg-gradient-to-br from-emerald-50 to-white/80" delay={0.2}>
                        <Route className="w-10 h-10 text-emerald-600 mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">رحلات النمو</h3>
                        <p className="text-slate-600 text-sm">
                            مسارات مصممة من خبراء لتطوير جوانب محددة في العلاقة خطوة بخطوة.
                        </p>
                    </BentoCard>

                    {/* Large Card 4: Daily Sparks */}
                    <BentoCard className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-rose-50 to-white flex flex-col justify-end group" delay={0.3}>
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-100/50 to-transparent" />
                        <Heart className="w-12 h-12 text-rose-500 mb-6 relative z-10" />
                        <h3 className="text-3xl font-bold text-slate-900 mb-3 relative z-10">شرارات يومية</h3>
                        <p className="text-slate-600 relative z-10">
                            لمسات صغيرة تصنع فرق كبير. تذكيرات يومية بأفكار بسيطة (رسالة، عشاء، هدية) تجدد الشغف.
                        </p>
                    </BentoCard>

                    {/* Wide Card 5: Safe Space */}
                    <BentoCard className="md:col-span-4 md:row-span-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-8" delay={0.4}>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <Lock className="w-6 h-6 text-emerald-400" />
                                <h3 className="text-2xl font-bold">مساحة آمنة ومشفرة</h3>
                            </div>
                            <p className="text-slate-300">
                                خصوصيتكم هي أولويتنا. كل بياناتكم ومحادثاتكم مشفرة ومحفوظة بأمان تام.
                            </p>
                        </div>
                        <Shield className="w-32 h-32 text-white/5 -mb-16 -ml-8" />
                    </BentoCard>
                </div>
            </div>
        </section>
    );
}
