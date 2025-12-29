'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    Calendar,
    Users,
    Download,
    RefreshCw,
    Wallet,
    FileText
} from 'lucide-react';

import { motion } from 'framer-motion';

interface FinanceStats {
    summary: {
        total_revenue: number;
        transactions_last_30d: number;
        total_premium_couples: number;
        active_trials: number;
    };
    transactions: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
        user?: {
            display_name: string;
            email: string;
        };
    }[];
    monthlyRevenue: {
        month: string;
        amount: number;
    }[];
}

const StatCard = ({ title, value, subtext, icon: Icon, color, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-colors group">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="p-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-white`} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-0.5">{value}</h3>
                        <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
                    </div>
                </div>
                {subtext && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{subtext}</span>
                        <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-400">
                            Analytics
                        </Badge>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default function AdminFinancePage() {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState('50');
    const [updatingPrice, setUpdatingPrice] = useState(false);

    useEffect(() => {
        fetchStats();
        fetchPricing();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/finance');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Error fetching finance stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPricing = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.settings && data.settings.premium_price) {
                    setPrice(String(data.settings.premium_price));
                }
            }
        } catch (err) {
            console.error('Error fetching pricing:', err);
        }
    };

    const handleUpdatePrice = async () => {
        setUpdatingPrice(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: [{ key: 'premium_price', value: Number(price) }]
                }),
            });

            if (!res.ok) throw new Error('Failed to update price');
            alert('Price updated successfully');
        } catch (err) {
            console.error('Error updating price:', err);
            alert('Failed to update price');
        } finally {
            setUpdatingPrice(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="absolute w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Finance & Revenue</h1>
                    <p className="text-slate-400 mt-1">Track earnings, transactions and manage pricing</p>
                </div>
                <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 backdrop-blur-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`SAR ${stats?.summary.total_revenue.toLocaleString()}`}
                    subtext="Lifetime earnings"
                    icon={DollarSign}
                    color="from-indigo-500 to-violet-500"
                    delay={0}
                />
                <StatCard
                    title="Sales (30d)"
                    value={stats?.summary.transactions_last_30d}
                    subtext="Transactions in last 30 days"
                    icon={CreditCard}
                    color="from-emerald-500 to-teal-500"
                    delay={0.1}
                />
                <StatCard
                    title="Premium Couples"
                    value={stats?.summary.total_premium_couples}
                    subtext="Active subscriptions"
                    icon={Users}
                    color="from-amber-500 to-orange-500"
                    delay={0.2}
                />
                <StatCard
                    title="Active Trials"
                    value={stats?.summary.active_trials}
                    subtext="Potential conversions"
                    icon={Wallet}
                    color="from-blue-500 to-cyan-500"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pricing Control */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-1"
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm h-full">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-400" />
                                Pricing Configuration
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Set the one-time payment amount for Premium access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-800/50">
                                <label className="text-sm font-medium text-slate-300 mb-3 block">Premium Price (SAR)</label>
                                <div className="flex gap-4">
                                    <div className="relative flex-1">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold pointer-events-none">
                                            SAR
                                        </div>
                                        <Input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="pl-14 h-12 bg-slate-900/50 border-slate-700 text-white font-mono text-xl focus:border-green-500/50 focus:ring-green-500/20"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdatePrice}
                                        disabled={updatingPrice}
                                        className="h-12 w-12 p-0 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg shadow-green-900/20"
                                    >
                                        {updatingPrice ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                                    <span className="text-amber-400">Note:</span> Changing the price affects future purchases only. Users must refresh their app to see the new price.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Revenue Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-end">
                            <div className="h-[240px] w-full flex items-end justify-between gap-3 px-2">
                                {stats?.monthlyRevenue.length === 0 ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 border-2 border-dashed border-slate-800 rounded-xl">
                                        <Calendar className="w-8 h-8 opacity-20" />
                                        <p>No transaction data available yet</p>
                                    </div>
                                ) : (
                                    stats?.monthlyRevenue.map((item, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group">
                                            <div className="w-full relative flex-1 flex items-end">
                                                <div
                                                    className="w-full bg-indigo-500/20 border border-indigo-500/30 rounded-t-lg group-hover:bg-indigo-500/40 group-hover:border-indigo-400/50 transition-all duration-300 relative overflow-hidden"
                                                    style={{ height: `${Math.max((item.amount / 1000) * 100, 10)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent" />
                                                </div>

                                                {/* Tooltip */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-xl pointer-events-none z-20 whitespace-nowrap">
                                                    SAR {item.amount.toLocaleString()}
                                                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-slate-700 transform rotate-45" />
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium text-slate-500 rotate-0 group-hover:text-slate-300 transition-colors">
                                                {item.month}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-400" />
                            Recent Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/50 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats?.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No recent transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        stats?.transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                    <span className="text-slate-500 ml-2 text-xs">
                                                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                                            {(tx.user?.display_name || tx.user?.email || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{tx.user?.display_name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500">{tx.user?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-white font-mono">
                                                    {tx.currency} {tx.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant={tx.status === 'completed' ? 'success' : 'secondary'}
                                                        className={tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-0' : ''}
                                                    >
                                                        {tx.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full">
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

