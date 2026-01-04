'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Heart,
    BarChart3,
    FileText,
    Settings,
    Shield,
    DollarSign,
    LogOut,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Couples', href: '/admin/couples', icon: Heart },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Finance', href: '/admin/subscriptions', icon: DollarSign },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 relative z-20 flex flex-col h-screen sticky top-0">
            {/* Ultra Glass Background */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xl border-r border-white/5" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative flex flex-col h-full z-10">
                {/* Header */}
                <div className="h-24 flex items-center gap-4 px-6 border-b border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse-slow" />
                        <div className="w-10 h-10 relative rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                            <img src="/wesal-logo.svg" alt="Wesal" className="w-6 h-6 object-contain" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950" />
                    </div>

                    <div>
                        <h1 className="font-bold text-white tracking-tight flex items-center gap-1">
                            Wesal Admin
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-500/20 text-primary-400 border border-primary-500/20">
                                PRO
                            </span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Command Center</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-none">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                                    isActive
                                        ? "text-white shadow-lg shadow-primary-500/10"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-primary-500/5 border border-primary-500/20 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors relative z-10",
                                    isActive ? "text-primary-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className={cn("relative z-10", isActive && "font-bold tracking-wide")}>{item.name}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="glowConfig"
                                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_currentColor]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/5">
                    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white/10">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate group-hover:text-primary-300 transition-colors">{userEmail}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    <p className="text-xs text-slate-400">Super Admin</p>
                                </div>
                            </div>
                        </div>

                        <form action="/api/admin/auth/logout" method="POST" className="relative z-10">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium transition-all group/btn border border-transparent hover:border-red-500/20"
                            >
                                <LogOut className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </aside>
    );
}

