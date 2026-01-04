'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Crown,
    Sparkles,
    Settings2,
    RefreshCw,
    Save,
    Tag,
    Percent,
    Calendar,
    Users,
    Zap,
    MessageCircle,
    Gamepad2,
    Heart,
    BarChart3,
    Plus,
    Trash2,
    Clock,
    DollarSign,
    CreditCard,
    TrendingUp,
    Download,
    Wallet,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';

// Types
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

interface TierLimit {
    id: string;
    tier: 'free' | 'premium';
    feature: string;
    limit_value: number | null;
    period: string | null;
    description_ar: string;
    description_en: string;
}

interface SpecialOffer {
    id: string;
    name: string;
    discount_percent: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
    code?: string;
}

interface Pricing {
    monthly_price: number;
    annual_price: number;
    annual_discount_months: number;
}

// Feature icons mapping
const featureIcons: Record<string, any> = {
    ai_chat: MessageCircle,
    conflict_ai: Zap,
    game_sessions: Gamepad2,
    games_available: Gamepad2,
    journeys: Calendar,
    whisper: Heart,
    insights: BarChart3,
    health_tracking: Heart,
};

// Stat Card Component
function StatCard({ title, value, subtext, icon: Icon, color, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all group overflow-hidden relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">{title}</p>
                            <p className="text-3xl font-bold text-white mt-2 tracking-tight">{value ?? '0'}</p>
                            <p className="text-xs text-slate-500 mt-1">{subtext}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-black/20`}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function AdminSubscriptionsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Finance stats
    const [stats, setStats] = useState<FinanceStats | null>(null);

    // Subscription state
    const [freeLimits, setFreeLimits] = useState<TierLimit[]>([]);
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [pricing, setPricing] = useState<Pricing>({
        monthly_price: 29,
        annual_price: 249,
        annual_discount_months: 2
    });

    // New offer form
    const [newOffer, setNewOffer] = useState({
        name: '',
        discount_percent: 20,
        valid_days: 7,
        code: ''
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            // Fetch finance stats
            const financeRes = await fetch('/api/admin/finance');
            if (financeRes.ok) {
                const data = await financeRes.json();
                setStats(data);
            }

            // Fetch tier limits
            const limitsRes = await fetch('/api/admin/subscriptions/limits');
            if (limitsRes.ok) {
                const data = await limitsRes.json();
                setFreeLimits(data.limits?.filter((l: TierLimit) => l.tier === 'free') || []);
            }

            // Fetch offers
            const offersRes = await fetch('/api/admin/subscriptions/offers');
            if (offersRes.ok) {
                const data = await offersRes.json();
                setOffers(data.offers || []);
            }

            // Fetch pricing
            const pricingRes = await fetch('/api/admin/settings');
            if (pricingRes.ok) {
                const data = await pricingRes.json();
                if (data.settings) {
                    setPricing({
                        monthly_price: data.settings.premium_monthly_price || 29,
                        annual_price: data.settings.premium_annual_price || 249,
                        annual_discount_months: data.settings.annual_discount_months || 2
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLimit = async (feature: string, newLimit: number) => {
        try {
            const res = await fetch('/api/admin/subscriptions/limits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feature, tier: 'free', limit_value: newLimit })
            });
            if (res.ok) {
                setFreeLimits(prev => prev.map(l =>
                    l.feature === feature ? { ...l, limit_value: newLimit } : l
                ));
            }
        } catch (err) {
            console.error('Error updating limit:', err);
        }
    };

    const handleUpdatePricing = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: [
                        { key: 'premium_monthly_price', value: pricing.monthly_price },
                        { key: 'premium_annual_price', value: pricing.annual_price },
                        { key: 'annual_discount_months', value: pricing.annual_discount_months }
                    ]
                })
            });
            if (!res.ok) throw new Error('Failed to update pricing');
            alert('Pricing updated successfully!');
        } catch (err) {
            console.error('Error updating pricing:', err);
            alert('Failed to update pricing');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateOffer = async () => {
        if (!newOffer.name || newOffer.discount_percent <= 0) return;

        setSaving(true);
        try {
            const validFrom = new Date();
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + newOffer.valid_days);

            const res = await fetch('/api/admin/subscriptions/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newOffer.name,
                    discount_percent: newOffer.discount_percent,
                    valid_from: validFrom.toISOString(),
                    valid_until: validUntil.toISOString(),
                    code: newOffer.code || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setOffers(prev => [...prev, data.offer]);
                setNewOffer({ name: '', discount_percent: 20, valid_days: 7, code: '' });
            }
        } catch (err) {
            console.error('Error creating offer:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOffer = async (offerId: string) => {
        try {
            const res = await fetch(`/api/admin/subscriptions/offers?id=${offerId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setOffers(prev => prev.filter(o => o.id !== offerId));
            }
        } catch (err) {
            console.error('Error deleting offer:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Crown className="w-8 h-8 text-amber-400" />
                        Finance & Subscriptions
                    </h1>
                    <p className="text-slate-400 mt-1">Manage revenue, pricing, limits and offers</p>
                </div>
                <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Revenue Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`SAR ${stats?.summary?.total_revenue?.toLocaleString() || '0'}`}
                    subtext="Lifetime earnings"
                    icon={DollarSign}
                    color="from-indigo-500 to-violet-500"
                    delay={0}
                />
                <StatCard
                    title="Sales (30d)"
                    value={stats?.summary?.transactions_last_30d || 0}
                    subtext="Transactions in last 30 days"
                    icon={CreditCard}
                    color="from-emerald-500 to-teal-500"
                    delay={0.1}
                />
                <StatCard
                    title="Premium Couples"
                    value={stats?.summary?.total_premium_couples || 0}
                    subtext="Active subscriptions"
                    icon={Users}
                    color="from-amber-500 to-orange-500"
                    delay={0.2}
                />
                <StatCard
                    title="Active Trials"
                    value={stats?.summary?.active_trials || 0}
                    subtext="Potential conversions"
                    icon={Wallet}
                    color="from-blue-500 to-cyan-500"
                    delay={0.3}
                />
            </div>

            {/* Pricing Configuration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Tag className="w-5 h-5 text-green-400" />
                            Premium Pricing
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Set subscription prices for Monthly and Annual plans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Monthly Price */}
                            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-800/50">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Monthly Price (SAR)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={pricing.monthly_price}
                                        onChange={(e) => setPricing({ ...pricing, monthly_price: Number(e.target.value) })}
                                        className="h-12 bg-slate-900/50 border-slate-700 text-white font-mono text-xl"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Per month billing</p>
                            </div>

                            {/* Annual Price */}
                            <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-800/50">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Annual Price (SAR)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={pricing.annual_price}
                                        onChange={(e) => setPricing({ ...pricing, annual_price: Number(e.target.value) })}
                                        className="h-12 bg-slate-900/50 border-slate-700 text-white font-mono text-xl"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    {pricing.annual_discount_months} months free (saves SAR {(pricing.monthly_price * 12) - pricing.annual_price})
                                </p>
                            </div>

                            {/* Save Button */}
                            <div className="flex items-end">
                                <Button
                                    onClick={handleUpdatePricing}
                                    disabled={saving}
                                    className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-medium"
                                >
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Pricing</>}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Free Tier Limits */}
            {freeLimits.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-blue-400" />
                                Free Tier Limits
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Adjust feature limits for free users. Premium users have unlimited access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {freeLimits.map((limit) => {
                                    const Icon = featureIcons[limit.feature] || Settings2;
                                    return (
                                        <div key={limit.id} className="bg-slate-800/30 rounded-xl p-4 border border-slate-800/50">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                                                    <Icon className="w-5 h-5 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white capitalize">
                                                        {limit.feature.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{limit.period || 'Total'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={limit.limit_value || 0}
                                                    onChange={(e) => handleUpdateLimit(limit.feature, Number(e.target.value))}
                                                    className="h-10 bg-slate-900/50 border-slate-700 text-white font-mono"
                                                />
                                                <span className="text-xs text-slate-500 min-w-[50px]">
                                                    /{limit.period || 'forever'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Special Offers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Percent className="w-5 h-5 text-purple-400" />
                            Special Offers & Discounts
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Create time-limited promotional offers
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Create New Offer */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-5 border border-purple-500/20">
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Create New Offer
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Offer Name</label>
                                    <Input
                                        placeholder="e.g., Eid Sale"
                                        value={newOffer.name}
                                        onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                                        className="bg-slate-900/50 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Discount %</label>
                                    <Input
                                        type="number"
                                        value={newOffer.discount_percent}
                                        onChange={(e) => setNewOffer({ ...newOffer, discount_percent: Number(e.target.value) })}
                                        className="bg-slate-900/50 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Valid Days</label>
                                    <Input
                                        type="number"
                                        value={newOffer.valid_days}
                                        onChange={(e) => setNewOffer({ ...newOffer, valid_days: Number(e.target.value) })}
                                        className="bg-slate-900/50 border-slate-700 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Promo Code (optional)</label>
                                    <Input
                                        placeholder="e.g., EID2026"
                                        value={newOffer.code}
                                        onChange={(e) => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                                        className="bg-slate-900/50 border-slate-700 text-white uppercase"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={handleCreateOffer}
                                        disabled={saving || !newOffer.name}
                                        className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Create
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Active Offers */}
                        <div className="space-y-3">
                            {offers.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p>No active offers. Create one above!</p>
                                </div>
                            ) : (
                                offers.map((offer) => (
                                    <div key={offer.id} className="flex items-center justify-between bg-slate-800/30 rounded-xl p-4 border border-slate-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                <Percent className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <h5 className="text-white font-medium">{offer.name}</h5>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge className="bg-purple-500/20 text-purple-400 border-0">
                                                        {offer.discount_percent}% OFF
                                                    </Badge>
                                                    {offer.code && (
                                                        <Badge className="bg-slate-700 text-slate-300 border-0 font-mono">
                                                            {offer.code}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Until {new Date(offer.valid_until).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteOffer(offer.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
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
                                    {!stats?.transactions || stats.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                No recent transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        stats.transactions.map((tx) => (
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
                                                        variant={tx.status === 'completed' ? 'default' : 'secondary'}
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
