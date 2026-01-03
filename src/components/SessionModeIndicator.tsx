import { motion } from 'framer-motion';
import { Users, User, Settings2 } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionModeIndicatorProps {
    onClick: () => void;
    className?: string;
}

export default function SessionModeIndicator({ onClick, className = '' }: SessionModeIndicatorProps) {
    const { preferredSessionMode, theme } = useSettingsStore();
    const { t } = useTranslation();

    const isRemote = preferredSessionMode === 'remote';

    if (!preferredSessionMode) return null;

    return (
        <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all text-sm font-medium ${theme === 'light'
                ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                : 'bg-surface-800/80 border-white/10 text-surface-300 hover:bg-surface-700'
                } ${className}`}
        >
            <div className={`w-2 h-2 rounded-full ${isRemote ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />

            {isRemote ? (
                <>
                    <Users className="w-3.5 h-3.5" />
                    <span>جلسة عن بعد</span>
                </>
            ) : (
                <>
                    <User className="w-3.5 h-3.5" />
                    <span>جلسة محلية</span>
                </>
            )}

            <Settings2 className="w-3 h-3 opacity-50 ml-1" />
        </motion.button>
    );
}
