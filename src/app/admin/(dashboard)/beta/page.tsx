'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Crown,
    Users,
    RefreshCw,
    Gift,
    Calendar,
    Search,
    Check,
    X,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BetaUser {
    id: string;
    couple_id: string;
    couple_name: string;
    partner1_email: string;
    partner2_email: string;
    status: string;
    plan_id: string;
    starts_at: string;
    ends_at: string;
    created_at: string;
}

export default function AdminBetaPage() {
    const [betaUsers, setBetaUsers] = useState<BetaUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0
    });

    useEffect(() => {
        fetchBetaUsers();
    }, []);

    const fetchBetaUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/beta-users');
            if (res.ok) {
                const data = await res.json();
                setBetaUsers(data.users || []);
                setStats(data.stats || { total: 0, active: 0, expired: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch beta users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeBeta = async (subscriptionId: string) => {
        if (!confirm('Are you sure you want to revoke this beta access?')) return;

        try {
            const res = await fetch('/api/admin/beta-users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId })
            });
            if (res.ok) {
                fetchBetaUsers();
            }
        } catch (err) {
            console.error('Failed to revoke beta:', err);
        }
    };

    const handleExtendBeta = async (subscriptionId: string, months: number) => {
        try {
            const res = await fetch('/api/admin/beta-users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId, extendMonths: months })
            });
            if (res.ok) {
                fetchBetaUsers();
            }
        } catch (err) {
            console.error('Failed to extend beta:', err);
        }
    };

    const filteredUsers = betaUsers.filter(user =>
        user.partner1_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.partner2_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.couple_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isExpired = (endsAt: string) => {
        if (!endsAt) return false;
        return new Date(endsAt) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        Beta Access Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage early access program users</p>
                </div>
                <Button
                    onClick={fetchBetaUsers}
                    className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-amber-400" />
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total Beta Users</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">{stats.active}</p>
                        <p className="text-xs text-slate-500">Active</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
                        <p className="text-xs text-slate-500">Expired</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by email or couple ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
            </div>

            {/* Beta Users List */}
            <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                    <Card className="bg-slate-900/40 border-slate-800">
                        <CardContent className="p-8 text-center">
                            <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No beta users found</p>
                            <p className="text-sm text-slate-500 mt-1">
                                Users will appear here when they join the early access program
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredUsers.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={`overflow-hidden transition-all ${isExpired(user.ends_at)
                                    ? 'bg-slate-900/20 border-red-500/30 opacity-60'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-amber-500/30'
                                }`}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                                                <Crown className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-medium">
                                                        {user.partner1_email || 'Unknown'}
                                                    </span>
                                                    <span className="text-slate-500">+</span>
                                                    <span className="text-white font-medium">
                                                        {user.partner2_email || 'Partner'}
                                                    </span>
                                                    {isExpired(user.ends_at) ? (
                                                        <Badge className="bg-red-500/20 text-red-400 border-0">
                                                            Expired
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                                                            Active
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Joined: {formatDate(user.starts_at)} •
                                                    Expires: {formatDate(user.ends_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleExtendBeta(user.id, 3)}
                                                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                            >
                                                +3 Months
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRevokeBeta(user.id)}
                                                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
