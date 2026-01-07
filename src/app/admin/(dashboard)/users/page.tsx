'use client';

import { useEffect, useState } from 'react';
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
    MoreVertical,
    Shield,
    RefreshCw,
    Ban,
    Crown,
    KeyRound,
    LogOut,
    Check,
    X
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
    isBanned?: boolean;
    isPremium?: boolean;
    email?: string;
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
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, search]);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClick = () => setActionMenuOpen(null);
        if (actionMenuOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [actionMenuOpen]);

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

    // User Action Handlers
    const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ban: !currentlyBanned }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentlyBanned } : u));
            }
        } catch (err) {
            console.error('Error banning user:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const handleGrantPremium = async (userId: string, currentlyPremium: boolean) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, grant: !currentlyPremium }),
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: !currentlyPremium } : u));
            }
        } catch (err) {
            console.error('Error granting premium:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const handleResetPassword = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                alert('Password reset email sent!');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

    const handleForceLogout = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch('/api/admin/users/force-logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                alert('User sessions invalidated!');
            }
        } catch (err) {
            console.error('Error forcing logout:', err);
        } finally {
            setActionLoading(null);
            setActionMenuOpen(null);
        }
    };

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
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-1">User Management</h1>
                    <p className="text-slate-400 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-primary-400" />
                        Administrator Access • Total Users: {pagination.total.toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers()}
                        className="border-white/10 hover:bg-white/5 text-slate-300"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search Bar - Glass */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-xl p-1">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                            <input
                                placeholder="Search by name, email or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 pl-12 h-12 rounded-xl text-base"
                            />
                        </div>
                        <Button type="submit" className="h-12 px-8 rounded-xl bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                            Search
                        </Button>
                    </form>
                </div>
            </div>

            {/* Users Table - Glass Container */}
            <div className="relative rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User Profile</th>
                                <th className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Relationship</th>
                                <th className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Engagement</th>
                                <th className="px-6 py-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-4" />
                                            <p className="text-slate-500 text-sm">Loading users...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                                <Search className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <p>No users found matching your search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                    {user.display_name?.charAt(0).toUpperCase() || <User className="w-5 h-5 text-slate-600" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base group-hover:text-primary-400 transition-colors">{user.display_name || 'Anonymous User'}</p>
                                                    <p className="text-xs text-slate-500 font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                        ID: {user.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isPaired ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm">
                                                    <Heart className="w-3 h-3 fill-pink-500/20" />
                                                    <span className="font-medium">Coupled</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-sm">
                                                    <User className="w-3 h-3" />
                                                    <span className="font-medium">Single</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                                                    <span className="font-mono">{user.checkinCount}</span>
                                                    <span className="text-xs text-slate-500">Check-ins</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                                                    }}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <MoreVertical className="w-4 h-4" />
                                                    )}
                                                </Button>

                                                {/* Action Dropdown */}
                                                {actionMenuOpen === user.id && (
                                                    <div
                                                        className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="p-2 border-b border-white/5">
                                                            <p className="text-xs text-slate-500 px-2">User Actions</p>
                                                        </div>
                                                        <div className="p-1">
                                                            {/* Ban/Unban */}
                                                            <button
                                                                onClick={() => handleBanUser(user.id, user.isBanned || false)}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${user.isBanned
                                                                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                                                                        : 'text-red-400 hover:bg-red-500/10'
                                                                    }`}
                                                            >
                                                                {user.isBanned ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                                {user.isBanned ? 'Unban User' : 'Ban User'}
                                                            </button>

                                                            {/* Grant/Revoke Premium */}
                                                            <button
                                                                onClick={() => handleGrantPremium(user.id, user.isPremium || false)}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${user.isPremium
                                                                        ? 'text-slate-400 hover:bg-slate-500/10'
                                                                        : 'text-amber-400 hover:bg-amber-500/10'
                                                                    }`}
                                                            >
                                                                <Crown className="w-4 h-4" />
                                                                {user.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                                                            </button>

                                                            <div className="my-1 border-t border-white/5" />

                                                            {/* Reset Password */}
                                                            <button
                                                                onClick={() => handleResetPassword(user.id)}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                                            >
                                                                <KeyRound className="w-4 h-4" />
                                                                Send Password Reset
                                                            </button>

                                                            {/* Force Logout */}
                                                            <button
                                                                onClick={() => handleForceLogout(user.id)}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                                Force Logout
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-sm text-slate-500">
                            Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="border-white/10 hover:bg-white/5 text-slate-300 hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="border-white/10 hover:bg-white/5 text-slate-300 hover:text-white"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
