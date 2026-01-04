'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, MessageCircle, Gamepad2, Calendar, Route, Lock, Heart } from 'lucide-react';

const features = [
    {
        icon: MessageCircle,
        title: 'مستشار ذكي',
        description: 'وسيط محايد يحل خلافاتكم بذكاء',
        color: 'from-purple-500 to-purple-600',
    },
    {
        icon: Gamepad2,
        title: 'ألعاب تفاعلية',
        description: 'تحديات يومية تجدد العلاقة',
        color: 'from-pink-500 to-pink-600',
    },
    {
        icon: Calendar,
        title: 'تقويم مشترك',
        description: 'نسقوا خططكم ومواعيدكم معاً',
        color: 'from-blue-500 to-blue-600',
    },
    {
        icon: Route,
        title: 'رحلات زوجية',
        description: 'مسارات نمو خطوة بخطوة',
        color: 'from-emerald-500 to-emerald-600',
    },
    {
        icon: Heart,
        title: 'شرارات',
        description: 'أفكار رومانسية لإشعال الحب',
        color: 'from-rose-500 to-rose-600',
    },
    {
        icon: Lock,
        title: 'مساحة آمنة',
        description: 'خصوصية تامة وبيانات مشفرة',
        color: 'from-slate-500 to-slate-600',
    },
];

export default function HomePage() {
    return (
        <main className="min-h-screen w-full overflow-y-auto relative">
            {/* Background - Fixed */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-20">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Grid overlay */}
            <div
                className="fixed inset-0 opacity-[0.03] -z-10"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center px-6 py-20">
                <div className="text-center max-w-lg">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <img
                            src="/wesal-logo.svg"
                            alt="Wesal Logo"
                            className="w-28 h-28 mx-auto mb-6 drop-shadow-2xl"
                        />
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            وصال
                        </h1>
                        <p className="text-lg text-primary-300 font-medium mt-2">Wesal</p>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed"
                    >
                        رحلة الحب تبدأ من هنا
                        <br />
                        <span className="text-slate-500">Journey together. Grow stronger.</span>
                    </motion.p>

                    {/* Auth Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="space-y-4"
                    >
                        <Link
                            href="/auth/register"
                            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 text-lg"
                        >
                            <Sparkles className="w-5 h-5" />
                            ابدأ رحلتك
                        </Link>

                        <Link
                            href="/auth/login"
                            className="w-full flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-2xl transition-all duration-300 text-lg backdrop-blur-sm"
                        >
                            تسجيل الدخول
                        </Link>
                    </motion.div>

                    {/* Trust Badge */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-12 flex items-center justify-center gap-2 text-slate-500 text-sm"
                    >
                        <Shield className="w-4 h-4" />
                        <span>خصوصية كاملة · للمتزوجين فقط</span>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-16"
                    >
                        <div className="animate-bounce text-slate-600 text-sm flex flex-col items-center gap-2">
                            <span>اكتشف المميزات</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section - Bento Grid Style */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-200 to-primary-100">
                            اكتشف مميزات <span className="text-primary-400">وِصال</span>
                        </h2>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            تجربة متكاملة تجمع بين العلم والتكنولوجيا لمساعدة الأزواج على بناء علاقة أعمق ومستدامة
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/60 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/5 ${[0, 3, 4].includes(index) ? 'md:col-span-2' : 'md:col-span-1'
                                    }`}
                            >
                                {/* Gradient Blob Background */}
                                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-700`} />

                                <div className="p-8 relative z-10 h-full flex flex-col items-start">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-primary-200 transition-colors">
                                        {feature.title}
                                    </h3>

                                    <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                                        {feature.description}
                                    </p>

                                    {/* Decoration for large cards */}
                                    {[0, 3, 4].includes(index) && (
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-xl mx-auto text-center glass-card p-10 rounded-3xl border border-primary-500/20"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        جاهزين تبدأون الرحلة؟
                    </h2>
                    <p className="text-slate-400 mb-8">
                        انضموا لآلاف الأزواج الذين يبنون علاقات أقوى مع وِصال
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 text-lg"
                    >
                        <Sparkles className="w-5 h-5" />
                        ابدأ مجاناً
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center border-t border-white/5">
                <p className="text-slate-600 text-sm">
                    © {new Date().getFullYear()} Wesal · Made with ❤️ in Saudi Arabia
                </p>
            </footer>
        </main>
    );
}
