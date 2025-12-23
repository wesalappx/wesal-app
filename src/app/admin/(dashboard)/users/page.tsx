'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    Heart,
    MessageSquare,
    MoreVertical
} from 'lucide-react';

interface UserData {
    id: string;
    display_name: string;
    avatar_url: string | null;
    gender: string | null;
    created_at: string;
    isPaired: boolean;
    coupleStatus: string | null;
    checkinCount: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search,
            });
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch users');
            }
            const data = await res.json();
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Users</h1>
                    <p className="text-slate-400 mt-1">Manage all registered users</p>
                </div>
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                    {pagination.total} total users
                </Badge>
            </div>

            {/* Search */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-white">
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Check-ins</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
                                                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{user.display_name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{user.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {user.isPaired ? (
                                                        <Badge variant="success" className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            Paired
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            Single
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MessageSquare className="w-4 h-4 text-slate-500" />
                                                    {user.checkinCount}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
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
                </CardContent>
            </Card>
        </div>
    );
}
