'use client';

import { motion } from 'framer-motion';
import {
    Trophy,
    Star,
    Heart,
    Flame,
    Target,
    Zap,
    ArrowRight,
    Lock,
    Calendar,
    Link as LinkIcon,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSound } from '@/hooks/useSound';
import { useAchievements } from '@/hooks/useAchievements';

const iconMap: Record<string, any> = {
    star: Star,
    flame: Flame,
    heart: Heart,
    target: Target,
    trophy: Trophy,
    zap: Zap,
    calendar: Calendar,
    link: LinkIcon,
};

const gradientMap: Record<string, string> = {
    star: 'from-amber-400 to-yellow-600',
    flame: 'from-orange-400 to-red-600',
    heart: 'from-rose-400 to-pink-600',
    target: 'from-blue-400 to-indigo-600',
    trophy: 'from-green-400 to-emerald-600',
    zap: 'from-purple-400 to-violet-600',
    calendar: 'from-cyan-400 to-blue-600',
    link: 'from-teal-400 to-green-600',
};

export default function AchievementsPage() {
    const { playSound } = useSound();
    const { achievements, isLoading } = useAchievements();

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    return (
        <main className="min-h-screen pb-44 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-4">
                <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white">
                    <ArrowRight className="w-6 h-6 transform rotate-180" />
                </Link>
                <h1 className="text-xl font-bold">الإنجازات</h1>
                <div className="text-sm text-surface-400">
                    {unlockedCount}/{totalCount}
                </div>
            </div>

            {/* Progress */}
            <div className="glass-card p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-primary-400">{Math.round((unlockedCount / totalCount) * 100)}%</span>
                    <span className="text-surface-400">التقدم الكلي</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                    />
                </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                    const Icon = iconMap[achievement.icon] || Trophy;
                    const gradient = gradientMap[achievement.icon] || 'from-gray-400 to-gray-600';

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => playSound('pop')}
                            className={`glass-card p-4 text-center relative overflow-hidden transition-transform hover:scale-105 ${!achievement.unlocked ? 'opacity-50' : ''
                                }`}
                        >
                            {/* Badge */}
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${achievement.unlocked
                                    ? `bg-gradient-to-br ${gradient} shadow-lg`
                                    : 'bg-surface-700'
                                }`}>
                                {achievement.unlocked ? (
                                    <Icon className="w-8 h-8 text-white" />
                                ) : (
                                    <Lock className="w-6 h-6 text-surface-500" />
                                )}
                            </div>

                            <h3 className="font-semibold text-sm mb-1">{achievement.title}</h3>
                            <p className="text-xs text-surface-400 line-clamp-2">{achievement.description}</p>

                            {/* Progress bar for locked achievements */}
                            {!achievement.unlocked && achievement.target && achievement.progress !== undefined && (
                                <div className="mt-3">
                                    <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500"
                                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-surface-500 mt-1">
                                        {achievement.progress}/{achievement.target}
                                    </p>
                                </div>
                            )}

                            {/* Unlock glow */}
                            {achievement.unlocked && (
                                <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent pointer-events-none" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </main>
    );
}
