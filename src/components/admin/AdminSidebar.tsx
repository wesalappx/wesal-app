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
    Crown,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Couples', href: '/admin/couples', icon: Heart },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Content', href: '/admin/content', icon: FileText },
    { name: 'Finance', href: '/admin/finance', icon: DollarSign },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: Crown },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 relative z-20 flex flex-col h-screen sticky top-0">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800" />

            {/* Content */}
            <div className="relative flex flex-col h-full z-10">
                {/* Header */}
                <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800/50">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="w-10 h-10 relative rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">Wesal Admin</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">CONTROL PANEL</p>
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
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden",
                                    isActive
                                        ? "text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary-500/10 border border-primary-500/20 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors relative z-10",
                                    isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className="relative z-10">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-800/50">
                    <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{userEmail}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-xs text-green-400 font-medium">Online</p>
                                </div>
                            </div>
                        </div>

                        <form action="/api/admin/auth/logout" method="POST">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium transition-all group"
                            >
                                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </aside>
    );
}
