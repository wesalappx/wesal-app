'use client';

import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings-store';

// Full Page Loading
export default function LoadingScreen({ message = 'جاري التحميل...' }: { message?: string }) {
    const { theme } = useSettingsStore();

    return (
        <div className={`min-h-screen flex items-center justify-center ${theme === 'light'
                ? 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
                : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'
            }`}>
            <div className="text-center">
                {/* Animated Logo/Spinner */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-primary-500/30 border-t-primary-500"
                />
                <p className={`text-lg ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>{message}</p>
            </div>
        </div>
    );
}

// Card/Section Loading Skeleton
export function LoadingSkeleton({
    className = '',
    lines = 3
}: {
    className?: string;
    lines?: number;
}) {
    const { theme } = useSettingsStore();

    return (
        <div className={`animate-pulse ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`h-4 rounded mb-3 last:mb-0 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}
                    style={{ width: `${100 - i * 15}%` }}
                />
            ))}
        </div>
    );
}

// Card Loading Placeholder
export function LoadingCard({ className = '' }: { className?: string }) {
    const { theme } = useSettingsStore();

    return (
        <div className={`p-6 rounded-2xl animate-pulse ${className} ${theme === 'light'
                ? 'bg-white border border-slate-100'
                : 'bg-white/5 border border-white/10'
            }`}>
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded w-3/4 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                    <div className={`h-3 rounded w-1/2 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                </div>
            </div>
            <div className="space-y-2">
                <div className={`h-3 rounded ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                <div className={`h-3 rounded w-5/6 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
            </div>
        </div>
    );
}

// Button Loading State
export function LoadingButton({
    children,
    isLoading,
    className = '',
    ...props
}: {
    children: React.ReactNode;
    isLoading: boolean;
    className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            disabled={isLoading || props.disabled}
            className={`relative ${className} ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
        >
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
            )}
            <span className={isLoading ? 'invisible' : ''}>{children}</span>
        </button>
    );
}

// Inline spinner
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-2',
        lg: 'w-10 h-10 border-4',
    };

    return (
        <div className={`${sizes[size]} border-primary-500/30 border-t-primary-500 rounded-full animate-spin`} />
    );
}

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
}
