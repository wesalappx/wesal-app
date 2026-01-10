'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Activity,
    AlertTriangle,
    Search,
    Filter,
    RefreshCw,
    Clock,
    User,
    Smartphone,
    Globe,
    MousePointer,
    Navigation,
    Zap,
    XCircle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    TrendingUp,
    Users,
    FileText,
    Trash2,
    Download,
    Eye,
    GitBranch,
    List
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface LogEntry {
    id: string;
    user_id: string | null;
    couple_id: string | null;
    session_id: string | null;
    action_type: string;
    action_name: string;
    page_path: string | null;
    component: string | null;
    request_data: Record<string, unknown>;
    response_data: Record<string, unknown>;
    is_error: boolean;
    error_code: string | null;
    error_message: string | null;
    error_stack: string | null;
    duration_ms: number | null;
    device_info: {
        browser?: string;
        os?: string;
        screenWidth?: number;
        screenHeight?: number;
    };
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface Stats {
    typeCounts: Record<string, number>;
    errorCount: number;
    activeSessions: number;
    hourlyStats: { hour: string; total: number; errors: number }[];
    totalLogs24h: number;
}

interface Filters {
    actionType: string;
    isError: boolean | null;
    search: string;
    startDate: string;
    endDate: string;
}

// ============================================
// Action Type Config
// ============================================

const actionTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
    page_view: { icon: Navigation, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    click: { icon: MousePointer, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    api_request: { icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    api_response: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
    error: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
    form_submit: { icon: FileText, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    auth: { icon: User, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
    subscription: { icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    game: { icon: Activity, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    admin: { icon: BarChart3, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
};

// ============================================
// Components
// ============================================

function StatCard({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all">
                <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">{title}</p>
                            <p className="text-2xl font-bold text-white mt-1">{value}</p>
                            {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function LogRow({ log, onViewDetails, onViewFlow }: {
    log: LogEntry;
    onViewDetails: (log: LogEntry) => void;
    onViewFlow?: (sessionId: string) => void;
}) {
    const config = actionTypeConfig[log.action_type] || actionTypeConfig.click;
    const Icon = config.icon;
    const time = new Date(log.created_at);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded-xl border transition-all hover:bg-white/5 cursor-pointer ${log.is_error
                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
            onClick={() => onViewDetails(log)}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">{log.action_name}</span>
                        <Badge variant="outline" className={`text-xs border-0 ${config.bgColor} ${config.color}`}>
                            {log.action_type}
                        </Badge>
                        {log.is_error && (
                            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">
                                Error
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        {log.page_path && (
                            <span className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {log.page_path}
                            </span>
                        )}
                        {log.component && (
                            <span className="flex items-center gap-1">
                                <MousePointer className="w-3 h-3" />
                                {log.component}
                            </span>
                        )}
                        {log.duration_ms && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.duration_ms}ms
                            </span>
                        )}
                    </div>

                    {log.error_message && (
                        <p className="text-xs text-red-400 mt-2 truncate">
                            {log.error_message}
                        </p>
                    )}
                </div>

                {/* Time & Device & Flow Button */}
                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                        <p className="text-xs text-slate-400">
                            {time.toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-slate-500">
                            {time.toLocaleDateString()}
                        </p>
                    </div>
                    {log.session_id && onViewFlow && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewFlow(log.session_id!);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-all"
                        >
                            <GitBranch className="w-3 h-3" />
                            Flow
                        </button>
                    )}
                    {log.device_info?.browser && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Smartphone className="w-3 h-3" />
                            {log.device_info.browser}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function LogDetailsModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">{log.action_name}</h3>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <XCircle className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${actionTypeConfig[log.action_type]?.bgColor} ${actionTypeConfig[log.action_type]?.color} border-0`}>
                            {log.action_type}
                        </Badge>
                        {log.is_error && <Badge className="bg-red-500/20 text-red-400 border-0">Error</Badge>}
                        <span className="text-sm text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Page</p>
                            <p className="text-sm text-white font-mono">{log.page_path || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Component</p>
                            <p className="text-sm text-white font-mono">{log.component || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Session ID</p>
                            <p className="text-sm text-white font-mono truncate">{log.session_id || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Duration</p>
                            <p className="text-sm text-white font-mono">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">User ID</p>
                            <p className="text-sm text-white font-mono truncate">{log.user_id || 'Anonymous'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">IP Address</p>
                            <p className="text-sm text-white font-mono">{log.ip_address || '-'}</p>
                        </div>
                    </div>

                    {/* Device Info */}
                    {log.device_info && Object.keys(log.device_info).length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                <Smartphone className="w-4 h-4" /> Device Info
                            </h4>
                            <div className="bg-slate-800/50 rounded-lg p-3 font-mono text-xs text-slate-300">
                                {JSON.stringify(log.device_info, null, 2)}
                            </div>
                        </div>
                    )}

                    {/* Request Data */}
                    {log.request_data && Object.keys(log.request_data).length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Request Data</h4>
                            <pre className="bg-slate-800/50 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                                {JSON.stringify(log.request_data, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Response Data */}
                    {log.response_data && Object.keys(log.response_data).length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Response Data</h4>
                            <pre className="bg-slate-800/50 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                                {JSON.stringify(log.response_data, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Error Details */}
                    {log.is_error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Error Details
                            </h4>
                            {log.error_code && (
                                <p className="text-sm text-red-300 mb-1">
                                    <span className="text-red-500">Code:</span> {log.error_code}
                                </p>
                            )}
                            {log.error_message && (
                                <p className="text-sm text-red-300 mb-2">{log.error_message}</p>
                            )}
                            {log.error_stack && (
                                <pre className="bg-red-900/20 rounded-lg p-3 font-mono text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                                    {log.error_stack}
                                </pre>
                            )}
                        </div>
                    )}

                    {/* Metadata */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2">Metadata</h4>
                            <pre className="bg-slate-800/50 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// Session Flow Visualization (n8n-style)
// ============================================

interface SessionFlowProps {
    sessionId: string;
    logs: LogEntry[];
    onClose: () => void;
}

function SessionFlowView({ sessionId, logs, onClose }: SessionFlowProps) {
    // Group logs by page for tree structure
    const pageGroups: { page: string; actions: LogEntry[] }[] = [];
    let currentPage = '';

    logs.forEach(log => {
        const page = log.page_path || '/unknown';
        if (page !== currentPage) {
            currentPage = page;
            pageGroups.push({ page, actions: [log] });
        } else {
            pageGroups[pageGroups.length - 1].actions.push(log);
        }
    });

    const hasErrors = logs.some(l => l.is_error);
    const totalDuration = logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Navigation className="w-5 h-5 text-white" />
                                </div>
                                Session Flow
                            </h3>
                            <p className="text-sm text-slate-400 mt-1 font-mono">
                                {sessionId?.slice(0, 20)}...
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Actions</p>
                                <p className="text-lg font-bold text-white">{logs.length}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Duration</p>
                                <p className="text-lg font-bold text-white">{totalDuration}ms</p>
                            </div>
                            {hasErrors && (
                                <Badge className="bg-red-500/20 text-red-400 border-0">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Has Errors
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <XCircle className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Flow Diagram */}
                <div className="p-6 overflow-y-auto max-h-[65vh]">
                    <div className="relative">
                        {/* Main vertical line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />

                        {/* Flow nodes */}
                        <div className="space-y-1">
                            {pageGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="relative">
                                    {/* Page Node (Main node) */}
                                    <div className="flex items-start gap-4 mb-3">
                                        {/* Node circle */}
                                        <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                            <Navigation className="w-5 h-5 text-white" />
                                        </div>

                                        {/* Page info */}
                                        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-sm text-blue-400 font-medium">
                                                    {group.page}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {group.actions.length} action{group.actions.length > 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Actions within this page */}
                                            <div className="space-y-2 mt-3">
                                                {group.actions.map((action, actionIndex) => {
                                                    const config = actionTypeConfig[action.action_type] || actionTypeConfig.click;
                                                    const ActionIcon = config.icon;

                                                    return (
                                                        <motion.div
                                                            key={action.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: actionIndex * 0.05 }}
                                                            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${action.is_error
                                                                ? 'bg-red-500/10 border border-red-500/20'
                                                                : 'bg-slate-800/50 hover:bg-slate-800'
                                                                }`}
                                                        >
                                                            {/* Mini connector line */}
                                                            <div className={`w-6 h-0.5 ${config.bgColor}`} />

                                                            {/* Action icon */}
                                                            <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                                                                <ActionIcon className={`w-4 h-4 ${config.color}`} />
                                                            </div>

                                                            {/* Action details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-white font-medium truncate">
                                                                        {action.action_name}
                                                                    </span>
                                                                    {action.is_error && (
                                                                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                                                    )}
                                                                </div>
                                                                {action.component && (
                                                                    <span className="text-xs text-slate-500">
                                                                        {action.component}
                                                                    </span>
                                                                )}
                                                                {action.error_message && (
                                                                    <p className="text-xs text-red-400 mt-1 truncate">
                                                                        {action.error_message}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Time & Duration */}
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs text-slate-400">
                                                                    {new Date(action.created_at).toLocaleTimeString()}
                                                                </p>
                                                                {action.duration_ms && (
                                                                    <p className="text-xs text-slate-500">
                                                                        {action.duration_ms}ms
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connector to next page */}
                                    {groupIndex < pageGroups.length - 1 && (
                                        <div className="flex items-center gap-4 ml-6 my-2">
                                            <div className="w-8 flex justify-center">
                                                <ChevronRight className="w-4 h-4 text-slate-600 rotate-90" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* End node */}
                        <div className="flex items-center gap-4 mt-4">
                            <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-slate-400 text-sm">
                                Session End
                                <span className="text-slate-500 ml-2">
                                    ({logs.length > 0 ? new Date(logs[logs.length - 1].created_at).toLocaleTimeString() : '-'})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// Main Page
// ============================================

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'flow'>('list');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [sessionLogs, setSessionLogs] = useState<LogEntry[]>([]);
    const [loadingSession, setLoadingSession] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        actionType: '',
        isError: null,
        search: '',
        startDate: '',
        endDate: '',
    });

    // Fetch logs for a specific session
    const fetchSessionLogs = useCallback(async (sessionId: string) => {
        setLoadingSession(true);
        try {
            const res = await fetch(`/api/admin/logs?sessionId=${sessionId}&limit=100`);
            if (res.ok) {
                const data = await res.json();
                setSessionLogs(data.logs.sort((a: LogEntry, b: LogEntry) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                ));
                setSelectedSessionId(sessionId);
            }
        } catch (err) {
            console.error('Failed to fetch session logs:', err);
        } finally {
            setLoadingSession(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set('page', pagination.page.toString());
            params.set('limit', '50');
            if (filters.actionType) params.set('actionType', filters.actionType);
            if (filters.isError !== null) params.set('isError', filters.isError.toString());
            if (filters.search) params.set('search', filters.search);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);

            const res = await fetch(`/api/admin/logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_stats' }),
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            fetchLogs();
            fetchStats();
        }, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs, fetchStats]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs();
    };

    const actionTypes = ['page_view', 'click', 'api_request', 'api_response', 'error', 'form_submit', 'auth', 'subscription', 'game', 'admin'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-400" />
                        Action Logs
                    </h1>
                    <p className="text-slate-400 mt-1">Monitor user actions, API calls, and errors in real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`border-slate-700 ${autoRefresh ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'text-slate-300'}`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Live' : 'Auto-refresh'}
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => { fetchLogs(); fetchStats(); }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Logs (24h)"
                    value={stats?.totalLogs24h?.toLocaleString() || '0'}
                    icon={Activity}
                    color="bg-gradient-to-br from-blue-500 to-cyan-500"
                />
                <StatCard
                    title="Errors (24h)"
                    value={stats?.errorCount || 0}
                    icon={AlertTriangle}
                    color="bg-gradient-to-br from-red-500 to-orange-500"
                    trend={stats?.totalLogs24h ? `${((stats.errorCount / stats.totalLogs24h) * 100).toFixed(1)}% error rate` : undefined}
                />
                <StatCard
                    title="Active Sessions"
                    value={stats?.activeSessions || 0}
                    icon={Users}
                    color="bg-gradient-to-br from-green-500 to-emerald-500"
                    trend="Last hour"
                />
                <StatCard
                    title="Page Views"
                    value={stats?.typeCounts?.page_view || 0}
                    icon={Eye}
                    color="bg-gradient-to-br from-purple-500 to-pink-500"
                    trend="Last 24 hours"
                />
            </div>

            {/* Filters */}
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    placeholder="Search actions, pages, errors..."
                                    value={filters.search}
                                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.actionType}
                            onChange={e => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
                            className="h-10 px-3 rounded-md bg-slate-800/50 border border-slate-700 text-white text-sm"
                        >
                            <option value="">All Types</option>
                            {actionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                        <select
                            value={filters.isError === null ? '' : filters.isError.toString()}
                            onChange={e => setFilters(prev => ({
                                ...prev,
                                isError: e.target.value === '' ? null : e.target.value === 'true'
                            }))}
                            className="h-10 px-3 rounded-md bg-slate-800/50 border border-slate-700 text-white text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="true">Errors Only</option>
                            <option value="false">Success Only</option>
                        </select>

                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
                            <Filter className="w-4 h-4 mr-2" />
                            Apply
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Logs List */}
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" />
                            Recent Actions
                        </CardTitle>
                        <span className="text-sm text-slate-500">
                            {pagination.total.toLocaleString()} total logs
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No logs found matching your criteria</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <LogRow
                                key={log.id}
                                log={log}
                                onViewDetails={setSelectedLog}
                                onViewFlow={fetchSessionLogs}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="border-slate-700 text-slate-300"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-400">
                        Page <span className="text-white font-medium">{pagination.page}</span> of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="border-slate-700 text-slate-300"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Log Details Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
                )}
            </AnimatePresence>

            {/* Session Flow Modal */}
            <AnimatePresence>
                {selectedSessionId && sessionLogs.length > 0 && (
                    <SessionFlowView
                        sessionId={selectedSessionId}
                        logs={sessionLogs}
                        onClose={() => {
                            setSelectedSessionId(null);
                            setSessionLogs([]);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Loading overlay for session fetch */}
            {loadingSession && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-slate-900 rounded-xl p-6 flex items-center gap-4">
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-white">Loading session flow...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
