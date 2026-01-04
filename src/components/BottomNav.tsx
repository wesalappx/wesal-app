'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Gamepad2, Scale, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings-store';

export default function BottomNav() {
    const pathname = usePathname();
    const { playSound } = useSound();
    const { theme } = useSettingsStore();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const navItems = [
        { name: 'الرئيسية', href: '/dashboard', icon: Home },
        { name: 'رحلات', href: '/journeys', icon: Map },
        { name: 'لعب', href: '/play', icon: Gamepad2 },
        { name: 'همسة', href: '/whisper', icon: Moon },
        { name: 'المستشار', href: '/conflict', icon: Scale },
    ];

    // Don't show nav on immersive pages or auth pages
    const hiddenRoutes = ['/', '/game-session', '/onboarding', '/pairing', '/auth', '/conflict', '/whisper'];

    // Check if current route should hide the nav
    const shouldHide = hiddenRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show on top or scrolling up, hide on scrolling down
            if (currentScrollY < 10) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    if (shouldHide) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <motion.nav
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className={`backdrop-blur-2xl border rounded-full px-8 py-3 flex items-center gap-4 pointer-events-auto max-w-[90vw] ${theme === 'light'
                                ? 'bg-white/90 border-slate-200 shadow-xl shadow-slate-200/50'
                                : 'bg-surface-900/80 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ring-1 ring-white/5'
                            }`}
                    >
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => playSound(isActive ? 'click' : 'pop')}
                                    className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all group"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 rounded-full blur-md"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}

                                    <div className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${isActive
                                            ? theme === 'light'
                                                ? 'bg-slate-100 text-slate-900 shadow-inner'
                                                : 'bg-surface-800 text-white shadow-inner'
                                            : theme === 'light'
                                                ? 'text-slate-400 group-hover:text-slate-600'
                                                : 'text-surface-400 group-hover:text-surface-200'
                                        }`}>
                                        <item.icon
                                            className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-primary-500 scale-110' : ''
                                                }`}
                                        />
                                    </div>

                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-1.5 h-1.5 bg-primary-500 rounded-full absolute -bottom-1 shadow-[0_0_8px_rgba(244,114,182,0.8)]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </motion.nav>
                </div>
            )}
        </AnimatePresence>
    );
}
