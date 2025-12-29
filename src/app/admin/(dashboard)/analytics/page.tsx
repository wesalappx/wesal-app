'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    Users,
    Heart,
    MessageSquare,
    Gamepad2,
    Calendar
} from 'lucide-react';

interface Stats {
    users: { total: number; newToday: number; newThisWeek: number; newThisMonth: number };
    couples: { total: number; active: number; pairedToday: number; pairedThisWeek: number };
    checkins: { total: number; today: number; avgMood: number };
    games: { total: number; todayCount: number; byType: Record<string, number> };
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // Calculate growth rates
    const userGrowthWeekly = stats?.users.newThisWeek || 0;
    const coupleGrowthWeekly = stats?.couples.pairedThisWeek || 0;
    const engagementRate = stats?.users.total
        ? ((stats.checkins.today / stats.users.total) * 100).toFixed(1)
        : '0';
    const pairingRate = stats?.users.total
        ? ((stats.couples.active * 2 / stats.users.total) * 100).toFixed(1)
        : '0';

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-slate-400 mt-1">Insights and trends for your app</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{userGrowthWeekly}</p>
                                <p className="text-blue-300 text-sm">New Users This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{coupleGrowthWeekly}</p>
                                <p className="text-pink-300 text-sm">New Couples This Week</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{engagementRate}%</p>
                                <p className="text-green-300 text-sm">Daily Engagement</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">{pairingRate}%</p>
                                <p className="text-purple-300 text-sm">Pairing Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Distribution */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            User Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Paired Users</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"
                                            style={{ width: `${pairingRate}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-medium">{(stats?.couples.active || 0) * 2}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">Single Users</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full"
                                            style={{ width: `${100 - Number(pairingRate)}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-medium">
                                        {(stats?.users.total || 0) - (stats?.couples.active || 0) * 2}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Check-in Mood Average */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-400" />
                            Check-in Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                    <div className="text-center">
                                        <p className="text-4xl font-bold text-white">{stats?.checkins.avgMood || 0}</p>
                                        <p className="text-xs text-green-300">/ 5</p>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm">Average Mood Score</p>
                                <Badge className="mt-2" variant="success">
                                    {Number(stats?.checkins.avgMood || 0) >= 4 ? 'Excellent' :
                                        Number(stats?.checkins.avgMood || 0) >= 3 ? 'Good' : 'Needs Attention'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Game Analytics */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-purple-400" />
                        Game Popularity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats?.games.byType && Object.keys(stats.games.byType).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(stats.games.byType)
                                .sort(([, a], [, b]) => b - a)
                                .map(([game, count]) => {
                                    const percentage = (count / stats.games.total) * 100;
                                    return (
                                        <div key={game} className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-white font-medium capitalize text-sm">
                                                    {game.replace(/-/g, ' ')}
                                                </h4>
                                                <span className="text-purple-400 font-bold">{count}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of plays</p>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-8">No game data available yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
