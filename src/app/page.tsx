'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, lazy, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Star, ChevronDown, Heart } from 'lucide-react';
import SaudiIntro from '@/components/landing/SaudiIntro';
import FeaturesGallery from '@/components/landing/FeaturesGallery';

// Lazy load 3D to not block initial render
const ThreeHero = lazy(() => import('@/components/landing/ThreeHero'));

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    return (
        <main ref={containerRef} className="relative bg-[#FDFCF8] font-sans overflow-x-hidden selection:bg-violet-100 selection:text-violet-900" dir="rtl">

            {/* Vibrant Mesh Gradient Background - Mobile Optimized */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-rose-50/80 animate-gradient-xy" />
                {/* 3D Scene Layer */}
                <div className="absolute inset-0 z-0 opacity-60 md:opacity-100">
                    <Suspense fallback={null}>
                        <ThreeHero />
                    </Suspense>
                </div>
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-4 md:px-6 py-4 md:py-6 transition-all duration-300 backdrop-blur-sm bg-white/10 sticky-nav">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Logo */}
                        <img src="/wesal-logo.svg" alt="Wesal Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
                        <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 hidden md:block">
                            وصال
                        </span>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 text-sm md:text-base md:px-6 md:py-2.5 rounded-xl text-slate-600 font-medium hover:text-violet-600 hover:bg-white/50 transition-all duration-300"
                        >
                            دخول
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 text-sm md:text-base md:px-6 md:py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            ابدأ مجاناً
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Mobile First Layout */}
            <motion.section
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center pt-20 pb-10"
            >
                <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative z-10 grid md:grid-cols-2 gap-12 items-center">

                    {/* Text Content - Left on Desktop, Top on Mobile */}
                    <div className="text-center md:text-right order-2 md:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full bg-white/40 border border-white/60 text-slate-800 text-xs md:text-sm font-bold mb-6 md:mb-8 backdrop-blur-xl shadow-lg ring-1 ring-white/50"
                        >
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
                            الرفيق الذكي لعلاقة أعمق ✨
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1] md:leading-[1] drop-shadow-sm"
                        >
                            حب <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600">
                                يتجدد
                            </span>
                            <br />
                            كل يوم.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg md:text-2xl text-slate-700 max-w-lg mx-auto md:mx-0 leading-relaxed mb-8 md:mb-10 font-medium opacity-90"
                        >
                            ذكاء عاطفي.. يخلي أيامكم كلها
                            <span className="text-violet-700 font-bold mx-2 relative inline-block">
                                وصال
                                <span className="absolute bottom-0 left-0 w-full h-1 bg-violet-400/30 -rotate-2 rounded-full"></span>
                            </span>
                            وشغف.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4"
                        >
                            <Link
                                href="/auth/register"
                                className="w-full sm:w-auto px-8 py-4 md:px-10 md:py-5 rounded-2xl bg-slate-900 text-white font-bold text-lg md:text-xl hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 group hover:scale-105"
                            >
                                ابدأ رحلتك مجاناً
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Empty Right Column for 3D Elements visibility on Desktop */}
                    <div className="hidden md:block order-2 min-h-[400px]">
                        {/* 3D elements float here */}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2"
                >
                    <span className="text-xs md:text-sm font-medium tracking-widest uppercase">اكتشف أكثر</span>
                    <ChevronDown className="w-5 h-5 md:w-6 md:h-6 animate-bounce" />
                </motion.div>
            </motion.section>

            {/* Content Sections - Stacked with clean spacing */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-t-[2.5rem] md:rounded-t-[4rem] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] z-20 border-t border-white/50">
                <SaudiIntro />
                <FeaturesGallery />

                {/* CTA Section */}
                <div className="flex flex-col items-center justify-center gap-6 py-16 md:py-24 px-6 text-center">
                    <Heart className="w-8 h-8 md:w-12 md:h-12 fill-violet-100 text-violet-500 animate-pulse" />
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900">جاهزين لفرصة جديدة؟</h2>
                    <Link
                        href="/auth/register"
                        className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300"
                    >
                        اشتركوا الآن مجاناً
                    </Link>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">
                        تجربة مجانية • إلغاء في أي وقت • خصوصية تامة
                    </p>
                </div>
            </div>

            {/* Ultra Minimal Footer */}
            <footer className="py-12 border-t border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <span className="font-bold text-white text-sm">W</span>
                        </div>
                        <span className="font-bold tracking-tight text-slate-900 text-xl">WESAL</span>
                    </div>

                    <div className="flex items-center gap-6 text-2xl text-slate-300 tracking-widest">
                        . . .
                    </div>

                    <p className="text-[10px] md:text-xs text-slate-400 font-medium tracking-widest uppercase">
                        Made with ❤️ in Saudi Arabia
                    </p>
                </div>
            </footer>
        </main>
    );
}
