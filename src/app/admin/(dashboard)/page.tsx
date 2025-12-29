'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Heart,
    MessageSquare,
    Gamepad2,
    TrendingUp,
    TrendingDown,
    Activity,
    Clock,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
    users: {
        total: number;
        newToday: number;
        newThisWeek: number;
        newThisMonth: number;
        activeNow?: number;
    };
    couples: {
        total: number;
        active: number;
        pairedToday: number;
        pairedThisWeek: number;
    };
    checkins: {
        total: number;
        today: number;
        avgMood: number;
    };
    games: {
        total: number;
        todayCount: number;
        byType: Record<string, number>;
    };
    lastUpdated: string;
}

const StatCard = ({ title, value, subtext, icon: Icon, color, trend, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-colors group">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-white`} />
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-1">{value.toLocaleString()}</h3>
                        <div className="flex items-center text-xs font-medium">
                            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400 mr-1" />}
                            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400 mr-1" />}
                            <span className={trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}>
                                {subtext}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch stats');
            }
            const data = await res.json();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="absolute w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <p className="text-red-400 mb-2 font-medium">Error loading stats</p>
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.users.total || 0,
            subtext: `+${stats?.users.newToday || 0} today`,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            trend: (stats?.users.newToday || 0) > 0 ? 'up' : 'neutral',
        },
        {
            title: 'Active Couples',
            value: stats?.couples.active || 0,
            subtext: `${stats?.couples.pairedThisWeek || 0} this week`,
            icon: Heart,
            color: 'from-pink-500 to-rose-500',
            trend: (stats?.couples.pairedThisWeek || 0) > 0 ? 'up' : 'neutral',
        },
        {
            title: 'Check-ins',
            value: stats?.checkins.today || 0,
            subtext: `Avg mood: ${stats?.checkins.avgMood || 0}`,
            icon: MessageSquare,
            color: 'from-green-500 to-emerald-500',
            trend: 'neutral',
        },
        {
            title: 'Games Played',
            value: stats?.games.total || 0,
            subtext: `${stats?.games.todayCount || 0} today`,
            icon: Gamepad2,
            color: 'from-purple-500 to-violet-500',
            trend: (stats?.games.todayCount || 0) > 0 ? 'up' : 'neutral',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-400 mt-1">Real-time insights and activity monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-400">Live Updates</span>
                    </div>
                    <Badge variant="outline" className="bg-slate-900 border-slate-700 text-slate-400 py-1.5 px-3">
                        <Clock className="w-3 h-3 mr-2" />
                        {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}
                    </Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <StatCard key={idx} {...stat} delay={idx * 0.1} />
                ))}
            </div>

            {/* Activity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2 text-lg">
                                <Activity className="w-5 h-5 text-primary-400" />
                                User Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                    <div>
                                        <p className="text-slate-400 text-sm">Today</p>
                                        <p className="text-2xl font-bold text-white">{stats?.users.newToday || 0}</p>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-400 border-0">New Users</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                    <div>
                                        <p className="text-slate-400 text-sm">This Week</p>
                                        <p className="text-2xl font-bold text-white">{stats?.users.newThisWeek || 0}</p>
                                    </div>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-0">Growth</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                    <div>
                                        <p className="text-slate-400 text-sm">This Month</p>
                                        <p className="text-2xl font-bold text-white">{stats?.users.newThisMonth || 0}</p>
                                    </div>
                                    <Badge variant="outline" className="border-slate-600 text-slate-400">Total Added</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Game Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2 text-lg">
                                <Gamepad2 className="w-5 h-5 text-purple-400" />
                                Popular Games
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats?.games.byType && Object.entries(stats.games.byType).length > 0 ? (
                                    Object.entries(stats.games.byType)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([game, count], idx) => (
                                            <div key={game} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors group">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center text-purple-400 font-bold text-sm group-hover:from-purple-500/30 group-hover:to-violet-500/30 transition-all">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-medium capitalize">{game.replace(/-/g, ' ')}</p>
                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500/50 rounded-full"
                                                            style={{ width: `${Math.min((count / (stats.games.total || 1)) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-800 text-purple-300">{count} plays</Badge>
                                            </div>
                                        ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                        <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No game data available yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quick Stats Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
            >
                <div className="rounded-2xl bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-accent-500/10 border border-primary-500/20 p-8 backdrop-blur-md">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {stats?.users.total || 0}
                            </div>
                            <p className="text-primary-300 text-sm font-medium mt-1">Total Users</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {stats?.couples.total || 0}
                            </div>
                            <p className="text-primary-300 text-sm font-medium mt-1">Total Couples</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {stats?.checkins.total || 0}
                            </div>
                            <p className="text-primary-300 text-sm font-medium mt-1">Total Check-ins</p>
                        </div>
                        <div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {stats?.games.total || 0}
                            </div>
                            <p className="text-primary-300 text-sm font-medium mt-1">Games Played</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

