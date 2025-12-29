'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Heart,
    Flame,
    ChevronLeft,
    ChevronRight,
    Users,
    Calendar
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

    useEffect(() => {
        fetchCouples();
    }, [pagination.page, statusFilter]);

    const fetchCouples = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success">Active</Badge>;
            case 'PAUSED':
                return <Badge variant="warning">Paused</Badge>;
            case 'UNPAIRED':
                return <Badge variant="destructive">Unpaired</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Couples</h1>
                    <p className="text-slate-400 mt-1">Manage paired couples and their relationships</p>
                </div>
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                    {pagination.total} total couples
                </Badge>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Button
                            variant={statusFilter === '' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('')}
                            className={statusFilter === '' ? 'bg-primary-600 text-white' : 'border-slate-700 text-slate-400'}
                            size="sm"
                        >
                            All
                        </Button>
                        <Button
                            variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('ACTIVE')}
                            className={statusFilter === 'ACTIVE' ? 'bg-green-600 text-white' : 'border-slate-700 text-slate-400'}
                            size="sm"
                        >
                            Active
                        </Button>
                        <Button
                            variant={statusFilter === 'PAUSED' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('PAUSED')}
                            className={statusFilter === 'PAUSED' ? 'bg-yellow-600 text-white' : 'border-slate-700 text-slate-400'}
                            size="sm"
                        >
                            Paused
                        </Button>
                        <Button
                            variant={statusFilter === 'UNPAIRED' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('UNPAIRED')}
                            className={statusFilter === 'UNPAIRED' ? 'bg-red-600 text-white' : 'border-slate-700 text-slate-400'}
                            size="sm"
                        >
                            Unpaired
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Couples Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                </div>
            ) : couples.length === 0 ? (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="py-12 text-center text-slate-500">
                        No couples found
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {couples.map((couple) => (
                        <Card key={couple.id} className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-slate-700 transition-colors">
                            <CardContent className="p-6">
                                {/* Partners */}
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                                            {couple.partner1?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <p className="text-sm text-white font-medium truncate max-w-[100px]">
                                            {couple.partner1?.display_name || 'Unknown'}
                                        </p>
                                    </div>

                                    <Heart className="w-6 h-6 text-pink-500 shrink-0" />

                                    <div className="text-center">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                                            {couple.partner2?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <p className="text-sm text-white font-medium truncate max-w-[100px]">
                                            {couple.partner2?.display_name || 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-white">{couple.currentStreak}</p>
                                        <p className="text-xs text-slate-400">Current Streak</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <Flame className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-white">{couple.longestStreak}</p>
                                        <p className="text-xs text-slate-400">Best Streak</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                    {getStatusBadge(couple.status)}
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(couple.paired_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="border-slate-700 text-slate-400 hover:bg-slate-800"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="border-slate-700 text-slate-400 hover:bg-slate-800"
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
