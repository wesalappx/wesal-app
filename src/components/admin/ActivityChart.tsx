'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ActivityChartProps {
    data: { label: string; value: number }[];
    color?: string;
    height?: number;
    showArea?: boolean;
}

export default function ActivityChart({
    data,
    color = '#8b5cf6', // Violet default
    height = 100,
    showArea = true
}: ActivityChartProps) {

    const { path, areaPath, points } = useMemo(() => {
        if (!data || data.length === 0) return { path: '', areaPath: '', points: [] };

        const max = Math.max(...data.map(d => d.value));
        const min = Math.min(...data.map(d => d.value));
        const range = max - min || 1;

        const width = 100; // SVG coordinate space %
        const stepX = width / (data.length - 1);

        const points = data.map((d, i) => {
            const x = i * stepX;
            // Normalize value to height (inverted Y for SVG)
            const normalizedY = ((d.value - min) / range);
            const y = height - (normalizedY * height); // Invert
            return { x, y, value: d.value, label: d.label };
        });

        const pathD = points.map((p, i) =>
            (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)
        ).join(' ');

        const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

        return { path: pathD, areaPath: areaD, points };
    }, [data, height]);

    return (
        <div className="w-full relative group" style={{ height }}>
            <svg
                viewBox={`0 0 100 ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {showArea && (
                    <motion.path
                        d={areaPath}
                        fill={`url(#gradient-${color})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />
                )}

                <motion.path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>

            {/* Hover Tooltips (Simplified) */}
            <div className="absolute inset-0 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {points.map((p, i) => (
                    <div
                        key={i}
                        className="relative flex flex-col items-center"
                        style={{ left: `${p.x}%`, bottom: `${height - p.y}px` }}
                    >
                        <div className="w-2 h-2 rounded-full bg-white shadow-lg mb-2 transform -translate-x-1/2 translate-y-1/2" />
                        <div className="absolute bottom-4 bg-slate-900 text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap z-20">
                            {p.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
