'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface SettingsCardProps {
    icon: ReactNode;
    title: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    rightElement?: ReactNode;
    danger?: boolean;
}

export default function SettingsCard({
    icon,
    title,
    description,
    href,
    onClick,
    rightElement,
    danger = false,
}: SettingsCardProps) {
    const content = (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full p-4 glass-card transition-all cursor-pointer backdrop-blur-md
        ${danger
                    ? 'border-red-500/20 hover:border-red-500/40 bg-red-500/5'
                    : 'border-white/10 hover:border-primary-500/30'
                }`}
        >
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
          ${danger ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400' : 'bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400'}`}
                >
                    {icon}
                </div>

                {/* Text */}
                <div className="flex-1 text-right">
                    <h3 className={`font-bold text-lg ${danger ? 'text-red-400' : 'text-white'}`}>
                        {title}
                    </h3>
                    {description && (
                        <p className={`text-sm mt-0.5 ${danger ? 'text-red-300/70' : 'text-surface-400'}`}>{description}</p>
                    )}
                </div>

                {/* Right Element or Arrow */}
                {rightElement || (
                    <ChevronLeft className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-surface-400'}`} />
                )}
            </div>
        </motion.div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return <button onClick={onClick} className="w-full">{content}</button>;
}

// Toggle Switch Component
interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label?: string;
}

export function ToggleSwitch({ enabled, onChange, label }: ToggleSwitchProps) {
    return (
        <div
            role="switch"
            aria-checked={enabled}
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation(); // Prevent parent card click
                onChange(!enabled);
            }}
            className="flex items-center gap-3 cursor-pointer"
        >
            <div
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center
          ${enabled ? 'bg-primary-500 justify-start' : 'bg-surface-600 justify-end'}`}
            >
                <motion.div
                    layout
                    className="w-6 h-6 bg-white rounded-full shadow-lg"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </div>
        </div>
    );
}
