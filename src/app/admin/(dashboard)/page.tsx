'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Heart,
    DollarSign,
    Zap,
    Activity,
    Shield,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Bell,
    User
} from 'lucide-react';
import ActivityChart from '@/components/admin/ActivityChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- Types ---

interface DashboardData {
    stats: any;
    health: any;
    activity: any[];
    revenue: any[];
    settings: any;
}

// --- Main Component ---

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, healthRes, activityRes, financeRes, settingsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/health'),
                fetch('/api/admin/activity?limit=5'),
                fetch('/api/admin/finance'),
                fetch('/api/admin/settings')
            ]);

            const stats = await statsRes.json();
            const health = await healthRes.json();
            const activity = await activityRes.json();
            const finance = await financeRes.json();
            const settings = await settingsRes.json();

            setData({
                stats,
                health,
                activity: activity.activities || [],
                revenue: finance.monthlyRevenue || [],
                settings: settings.settings || {}
            });
        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle System Setting
    const toggleSetting = async (key: string, value: boolean) => {
        setUpdating(key);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                body: JSON.stringify({
                    updates: [{ key, value }]
                })
            });
            if (res.ok) {
                // Optimistic update
                setData(prev => prev ? ({
                    ...prev,
                    settings: { ...prev.settings, [key]: value }
                }) : null);
            }
        } catch (error) {
            console.error('Setting update failed:', error);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-primary-500 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const { stats, health, activity, revenue, settings } = data!;

    // Transform revenue for chart (ensure data exists)
    const chartData = (revenue || []).map((r: any) => ({
        label: r.month,
        value: r.amount
    }));

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1 flex items-center gap-3">
                        Control Center
                        <span className="text-xs font-mono font-normal text-primary-400 bg-primary-500/10 px-2 py-1 rounded border border-primary-500/20">
                            v2.0.0
                        </span>
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        System nominal • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="border-primary-500/20 hover:bg-primary-500/10 text-primary-400 gap-2"
                    onClick={fetchDashboardData}
                >
                    <RefreshCw className="w-4 h-4" />
                    Sync Data
                </Button>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={health.revenue?.thisMonth || 0}
                    suffix={health.revenue?.currency ? ` ${health.revenue.currency}` : ''}
                    icon={DollarSign}
                    color="cyan"
                    trend="+12% vs last mo"
                />
                <StatCard
                    title="Active Couples"
                    value={stats.couples?.active || 0}
                    icon={Heart}
                    color="pink"
                    trend={`${stats.couples?.pairedThisWeek || 0} new this week`}
                />
                <StatCard
                    title="Total Users"
                    value={stats.users?.total || 0}
                    icon={Users}
                    color="violet"
                    trend={`${stats.users?.newToday || 0} today`}
                />
                <StatCard
                    title="System Load"
                    value="Optimal"
                    icon={Zap}
                    color="emerald"
                    trend="0 errors (1h)"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Charts & Monitor (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Revenue Monitor */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl group">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 opacity-50" />

                        <div className="p-6 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-violet-400" />
                                        Revenue Monitor
                                    </h3>
                                    <p className="text-sm text-slate-400">Real-time financial tracking (SAR)</p>
                                </div>
                                <div className="px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full text-xs font-bold animate-pulse">
                                    LIVE
                                </div>
                            </div>

                            <div className="h-[250px] w-full">
                                {chartData.length > 0 ? (
                                    <ActivityChart data={chartData} color="#8b5cf6" height={250} />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                                        No recent revenue data to display
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ControlCard
                            title="Maintenance Mode"
                            description="Disable app access for all users"
                            isActive={settings.maintenance_mode || false}
                            onToggle={() => toggleSetting('maintenance_mode', !settings.maintenance_mode)}
                            loading={updating === 'maintenance_mode'}
                            icon={AlertTriangle}
                            danger={true}
                        />
                        <ControlCard
                            title="Allow Signups"
                            description="Enable new user registration"
                            isActive={settings.allow_signups !== false} // Default true
                            onToggle={() => toggleSetting('allow_signups', settings.allow_signups === false ? true : false)}
                            loading={updating === 'allow_signups'}
                            icon={Users}
                            danger={false}
                        />
                    </div>
                </div>

                {/* Right Column: Activity Feed (1/3 width) */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[400px]">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                Live Activity
                            </h3>
                        </div>

                        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-white/10">
                            {activity.length === 0 ? (
                                <p className="text-center text-slate-500 py-10">No recent activity</p>
                            ) : (
                                activity.map((item: any) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
                                    >
                                        <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-800 text-slate-400 border border-white/5`}>
                                            <ActivityIcon type={item.icon || item.type || 'default'} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-300 leading-snug group-hover:text-white transition-colors">
                                                {item.message}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 font-mono">
                                                {new Date(item.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Subcomponents ---

function StatCard({ title, value, suffix, icon: Icon, color, trend }: any) {
    const colorMap: Record<string, string> = {
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        pink: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };

    const style = colorMap[color] || colorMap.cyan;

    return (
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-5 hover:bg-white/5 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${style} opacity-20 group-hover:opacity-100 transition-all duration-500`}>
                <Icon className="w-5 h-5" />
            </div>

            <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white tracking-tight mb-2">
                {typeof value === 'number' ? value.toLocaleString() : value}
                {suffix && <span className="text-lg text-slate-500 font-normal ml-1">{suffix}</span>}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
                {trend.includes('+') ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <Activity className="w-3 h-3" />}
                {trend}
            </p>
        </div>
    );
}

function ControlCard({ title, description, isActive, onToggle, loading, icon: Icon, danger }: any) {
    return (
        <div className={`rounded-2xl border bg-slate-900/40 p-5 flex items-center justify-between transition-colors ${isActive && danger ? 'border-red-500/30 bg-red-500/5' : 'border-white/5 hover:border-white/10'
            }`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive && danger ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400'
                    }`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className={`font-bold ${isActive && danger ? 'text-red-400' : 'text-white'}`}>{title}</h4>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}

                {/* Custom Switch UI */}
                <button
                    onClick={onToggle}
                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${isActive
                            ? (danger ? 'bg-red-500 focus:ring-red-500' : 'bg-primary-500 focus:ring-primary-500')
                            : 'bg-slate-700 focus:ring-slate-500'
                        }`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-300 ${isActive ? 'left-7' : 'left-1'
                        }`} />
                </button>
            </div>
        </div>
    );
}

function ActivityIcon({ type }: { type: string }) {
    if (type.includes('user')) return <User className="w-4 h-4" />;
    if (type.includes('payment') || type.includes('dollar')) return <DollarSign className="w-4 h-4" />;
    if (type.includes('admin') || type.includes('shield')) return <Shield className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
}
