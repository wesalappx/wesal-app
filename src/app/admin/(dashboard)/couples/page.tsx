'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    Flame,
    ChevronLeft,
    ChevronRight,
    Users,
    Calendar,
    RefreshCw,
    Sparkles,
    User,
    MoreVertical,
    Unlink,
    Crown,
    RotateCcw
} from 'lucide-react';

interface CoupleData {
    id: string;
    partner1: { id: string; display_name: string; avatar_url: string | null };
    partner2: { id: string; display_name: string; avatar_url: string | null };
    status: string;
    paired_at: string;
    currentStreak: number;
    longestStreak: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminCouplesPage() {
    const [couples, setCouples] = useState<CoupleData[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchCouples();
    }, [pagination.page, statusFilter]);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClick = () => setActionMenuOpen(null);
        if (actionMenuOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [actionMenuOpen]);

    // Action handlers
    const handleUnpair = async (coupleId: string) => {
        if (!confirm('Are you sure you want to unpair this couple? This cannot be undone.')) return;
        setActionLoading(coupleId);
        try {
            const res = await fetch('/api/admin/couples/unpair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupleId }),
            });
            if (res.ok) {
                setCouples(prev => prev.map(c => c.id === coupleId ? { ...c, status: 'UNPAIRED' } : c));
            }
        } catch (err) {
            console.error('Error unpairing:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const handleResetStreak = async (coupleId: string) => {
        if (!confirm('Are you sure you want to reset the streak to 0?')) return;
        setActionLoading(coupleId);
        try {
            const res = await fetch('/api/admin/couples/reset-streak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupleId }),
            });
            if (res.ok) {
                setCouples(prev => prev.map(c => c.id === coupleId ? { ...c, currentStreak: 0 } : c));
            }
        } catch (err) {
            console.error('Error resetting streak:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const handleGrantPremium = async (coupleId: string) => {
        setActionLoading(coupleId);
        try {
            const res = await fetch('/api/admin/couples/grant-premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupleId }),
            });
            if (res.ok) {
                alert('Premium granted to couple!');
            }
        } catch (err) {
            console.error('Error granting premium:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const fetchCouples = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: '',
            });
            if (statusFilter) params.set('status', statusFilter);

            const res = await fetch(`/api/admin/couples?${params}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch couples');
            }
            const data = await res.json();
            setCouples(data.couples);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching couples:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'PAUSED':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'UNPAIRED':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Active Relationships</h1>
                    <p className="text-slate-400 flex items-center gap-2 text-sm">
                        <Heart className="w-4 h-4 text-pink-400" />
                        Tracking {pagination.total.toLocaleString()} couples across the platform
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCouples()}
                    className="border-white/10 hover:bg-white/5 text-slate-300"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 p-1 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 w-fit">
                {['', 'ACTIVE', 'PAUSED', 'UNPAIRED'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${statusFilter === filter
                            ? 'bg-primary-500 shadow-lg shadow-primary-500/25 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {filter === '' ? 'All Couples' : filter.charAt(0) + filter.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Couples Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 rounded-3xl bg-slate-900/40 border border-white/5 animate-pulse" />
                    ))}
                </div>
            ) : couples.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500">No couples found matching your criteria</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {couples.map((couple) => (
                        <div
                            key={couple.id}
                            className="group relative rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/5 hover:-translate-y-1"
                        >
                            {/* Gradient Background */}
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

                            <div className="p-6 relative z-10">
                                {/* Partner Avatars */}
                                <div className="flex items-center justify-center mb-8 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-pink-500/50 to-blue-500/50 z-0" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950 border border-white/10 z-20">
                                        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                                    </div>

                                    {/* Partner 1 */}
                                    <div className="relative z-10 flex flex-col items-center mr-6 group-hover:translate-x-1 transition-transform">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center mb-3 shadow-lg shadow-pink-500/10">
                                            {couple.partner1?.avatar_url ? (
                                                <img src={couple.partner1.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-pink-200">{couple.partner1?.display_name?.charAt(0).toUpperCase() || '?'}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-white max-w-[80px] truncate">{couple.partner1?.display_name || 'Partner 1'}</p>
                                    </div>

                                    {/* Partner 2 */}
                                    <div className="relative z-10 flex flex-col items-center ml-6 group-hover:-translate-x-1 transition-transform">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
                                            {couple.partner2?.avatar_url ? (
                                                <img src={couple.partner2.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-blue-200">{couple.partner2?.display_name?.charAt(0).toUpperCase() || '?'}</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-white max-w-[80px] truncate">{couple.partner2?.display_name || 'Partner 2'}</p>
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-orange-500/5" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <Flame className="w-5 h-5 text-orange-400 mb-1 fill-orange-500/20" />
                                            <span className="text-xl font-bold text-white leading-none">{couple.currentStreak}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-orange-400/80 font-bold mt-1">Current</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-yellow-500/5" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <Sparkles className="w-5 h-5 text-yellow-400 mb-1" />
                                            <span className="text-xl font-bold text-white leading-none">{couple.longestStreak}</span>
                                            <span className="text-[10px] uppercase tracking-wider text-yellow-400/80 font-bold mt-1">Best</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className={`px-2.5 py-1 rounded-md border text-xs font-bold ${getStatusStyle(couple.status)}`}>
                                        {couple.status}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(couple.paired_at).toLocaleDateString()}
                                        </div>

                                        {/* Action Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionMenuOpen(actionMenuOpen === couple.id ? null : couple.id);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            >
                                                {actionLoading === couple.id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <MoreVertical className="w-4 h-4" />
                                                )}
                                            </button>

                                            {actionMenuOpen === couple.id && (
                                                <div
                                                    className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="p-1">
                                                        <button
                                                            onClick={() => handleGrantPremium(couple.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                                                        >
                                                            <Crown className="w-4 h-4" />
                                                            Grant Premium
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetStreak(couple.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                            Reset Streak
                                                        </button>
                                                        <div className="my-1 border-t border-white/5" />
                                                        <button
                                                            onClick={() => handleUnpair(couple.id)}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <Unlink className="w-4 h-4" />
                                                            Unpair Couple
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                    <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="rounded-full w-10 h-10 p-0 border-white/10 hover:bg-white/10 hover:text-white bg-transparent"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-medium text-slate-400">
                        Page <span className="text-white">{pagination.page}</span> / {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="rounded-full w-10 h-10 p-0 border-white/10 hover:bg-white/10 hover:text-white bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
