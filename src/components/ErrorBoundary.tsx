'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        // TODO: Send to error logging service
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-bold text-white mb-2">حدث خطأ غير متوقع</h1>
                        <p className="text-surface-400 mb-8">
                            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
                        </p>

                        {/* Error Details (Development only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                                <p className="text-red-400 text-sm font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                حاول مرة أخرى
                            </button>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                الرئيسية
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Inline Error Fallback for smaller components
export function InlineError({
    message = 'حدث خطأ',
    onRetry
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 text-sm mb-3">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-sm text-red-300 hover:text-red-200 underline"
                >
                    حاول مرة أخرى
                </button>
            )}
        </div>
    );
}
