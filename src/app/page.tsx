'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
    return (
        <main className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[200px]" />
            </div>

            {/* Subtle grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 text-center px-6 max-w-lg">
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
            </div>

            {/* Footer - Minimal */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-slate-600 text-xs">
                    © {new Date().getFullYear()} Wesal · Made with ❤️ in Saudi Arabia
                </p>
            </div>
        </main>
    );
}
