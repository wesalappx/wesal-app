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
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function AdminSubscriptionsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State
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
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch tier limits
            const limitsRes = await fetch('/api/admin/subscriptions/limits');
            if (limitsRes.ok) {
                const data = await limitsRes.json();
                setFreeLimits(data.limits.filter((l: TierLimit) => l.tier === 'free'));
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
                        Subscription Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage tiers, pricing, limits and special offers</p>
                </div>
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

            {/* Premium Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20 backdrop-blur-sm">
                    <CardContent className="py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Crown className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-amber-300 font-medium">Quick Tip</p>
                                    <p className="text-amber-400/70 text-sm">
                                        Offers with promo codes have 2x higher conversion rates
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                View Subscribers
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
