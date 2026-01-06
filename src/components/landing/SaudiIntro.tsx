'use client';

import { motion } from 'framer-motion';
import { Sprout, Zap, HeartHandshake } from 'lucide-react';
import { Heart, Stars } from 'lucide-react';

export default function SaudiIntro() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-100/30 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-sm font-medium mb-8"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-100/50 to-fuchsia-100/50 blur-3xl -z-10" />
                    <Stars className="w-5 h-5 text-violet-600" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold">القصة باختصار</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 mb-12 leading-tight"
                >
                    ليه <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">وصال</span>؟
                </motion.h2>

                <div className="grid md:grid-cols-3 gap-8 text-center mt-12">
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="relative p-8 rounded-3xl bg-white/40 border border-white/60 shadow-xl backdrop-blur-md overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <Sprout className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">العلاقة زي النبتة</h3>
                        <p className="text-slate-600 text-sm leading-relaxed relative z-10">تحتاج اهتمام يومي ("سقاية") عشان تكبر وتزهر. الإهمال يخليها تذبل ببطء.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="relative p-8 rounded-3xl bg-white/40 border border-white/60 shadow-xl backdrop-blur-md overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">كسر الروتين</h3>
                        <p className="text-slate-600 text-sm leading-relaxed relative z-10">الملل هو العدو الأول. تحدياتنا وألعابنا مصممة عشان تجدد الشغف وتخلق ضحك.</p>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -10 }}
                        className="relative p-8 rounded-3xl bg-white/40 border border-white/60 shadow-xl backdrop-blur-md overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <HeartHandshake className="w-8 h-8 text-violet-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">شريك ثالث محايد</h3>
                        <p className="text-slate-600 text-sm leading-relaxed relative z-10">بدل ما تتصادمون، "وصال" يكون الحكم والرفيق اللي يساعدكم تفهمون وجهة نظر بعض.</p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="mt-16"
                >
                    <p className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                        خلي الحب <span className="text-violet-600 bg-violet-100 px-2 rounded-lg rotate-2 inline-block">حي</span> كل يوم. ❤️
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
