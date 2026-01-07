'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Gamepad2,
    Save,
    RefreshCw,
    Crown,
    Eye,
    EyeOff,
    Dices,
    Target,
    Sparkles,
    Heart,
    MessageCircle,
    Zap,
    Users,
    Star
} from 'lucide-react';
import { motion } from 'framer-motion';

// Game data structure
interface Game {
    id: string;
    name: { ar: string; en: string };
    description: { ar: string; en: string };
    icon: string;
    isEnabled: boolean;
    isPremium: boolean;
    playCount: number;
}

// Icon mapping
const gameIcons: Record<string, any> = {
    dices: Dices,
    target: Target,
    sparkles: Sparkles,
    heart: Heart,
    message: MessageCircle,
    zap: Zap,
    users: Users,
    star: Star,
    gamepad: Gamepad2,
};

export default function AdminGamesPage() {
    const [games, setGames] = useState<Game[]>([
        { id: 'truth_or_dare', name: { ar: 'صراحة أو تحدي', en: 'Truth or Dare' }, description: { ar: 'لعبة الصراحة والتحديات', en: 'Classic truth or dare game' }, icon: 'target', isEnabled: true, isPremium: false, playCount: 1250 },
        { id: 'would_you_rather', name: { ar: 'هل تفضل', en: 'Would You Rather' }, description: { ar: 'اختيارات صعبة ومضحكة', en: 'Tough and fun choices' }, icon: 'dices', isEnabled: true, isPremium: false, playCount: 980 },
        { id: 'compliment_battle', name: { ar: 'معركة الإطراء', en: 'Compliment Battle' }, description: { ar: 'تنافسوا في المجاملات', en: 'Compete in compliments' }, icon: 'heart', isEnabled: true, isPremium: false, playCount: 750 },
        { id: 'guess_emoji', name: { ar: 'خمن الإيموجي', en: 'Guess the Emoji' }, description: { ar: 'خمنوا المعنى من الإيموجي', en: 'Guess meaning from emojis' }, icon: 'sparkles', isEnabled: true, isPremium: false, playCount: 620 },
        { id: 'story_builder', name: { ar: 'بناء القصة', en: 'Story Builder' }, description: { ar: 'ابنوا قصة معاً', en: 'Build a story together' }, icon: 'message', isEnabled: true, isPremium: true, playCount: 340 },
        { id: 'memory_lane', name: { ar: 'ذكريات', en: 'Memory Lane' }, description: { ar: 'اختبروا ذاكرتكم', en: 'Test your memory' }, icon: 'star', isEnabled: true, isPremium: true, playCount: 280 },
        { id: 'couple_quiz', name: { ar: 'اختبار الشريك', en: 'Couple Quiz' }, description: { ar: 'كم تعرفون بعضكم', en: 'How well do you know each other' }, icon: 'users', isEnabled: true, isPremium: true, playCount: 450 },
        { id: 'roulette', name: { ar: 'روليت الحب', en: 'Love Roulette' }, description: { ar: 'دور العجلة واربح', en: 'Spin and win' }, icon: 'zap', isEnabled: true, isPremium: true, playCount: 520 },
    ]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/admin/games');
            if (res.ok) {
                const data = await res.json();
                if (data.games) {
                    setGames(data.games);
                }
            }
        } catch (err) {
            console.error('Error fetching games:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEnabled = (gameId: string) => {
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, isEnabled: !g.isEnabled } : g));
        setHasChanges(true);
    };

    const togglePremium = (gameId: string) => {
        setGames(prev => prev.map(g => g.id === gameId ? { ...g, isPremium: !g.isPremium } : g));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ games }),
            });
            if (res.ok) {
                setHasChanges(false);
                alert('Games settings saved!');
            }
        } catch (err) {
            console.error('Error saving games:', err);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Gamepad2 className="w-8 h-8 text-emerald-400" />
                        Games Management
                    </h1>
                    <p className="text-slate-400 mt-1">Toggle games on/off and control premium access</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className={`bg-emerald-600 hover:bg-emerald-500 text-white ${!hasChanges && 'opacity-50'}`}
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-white">{games.length}</p>
                        <p className="text-xs text-slate-500">Total Games</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-400">{games.filter(g => g.isEnabled).length}</p>
                        <p className="text-xs text-slate-500">Active</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-amber-400">{games.filter(g => g.isPremium).length}</p>
                        <p className="text-xs text-slate-500">Premium Only</p>
                    </CardContent>
                </Card>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {games.map((game, idx) => {
                    const IconComponent = gameIcons[game.icon] || Gamepad2;
                    return (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={`relative overflow-hidden transition-all ${game.isEnabled
                                    ? 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/30'
                                    : 'bg-slate-900/20 border-slate-800/50 opacity-60'
                                }`}>
                                {/* Premium Badge */}
                                {game.isPremium && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <Badge className="bg-amber-500/20 text-amber-400 border-0">
                                            <Crown className="w-3 h-3 mr-1" /> Premium
                                        </Badge>
                                    </div>
                                )}

                                <CardContent className="p-5">
                                    {/* Icon & Info */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${game.isEnabled
                                                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
                                                : 'bg-slate-800/50'
                                            }`}>
                                            <IconComponent className={`w-6 h-6 ${game.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold truncate ${game.isEnabled ? 'text-white' : 'text-slate-500'}`}>
                                                {game.name.en}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate">{game.name.ar}</p>
                                        </div>
                                    </div>

                                    {/* Play Count */}
                                    <div className="mb-4 p-2 bg-slate-800/30 rounded-lg text-center">
                                        <span className="text-lg font-bold text-white">{game.playCount.toLocaleString()}</span>
                                        <span className="text-xs text-slate-500 ml-1">plays</span>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleEnabled(game.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${game.isEnabled
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            {game.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {game.isEnabled ? 'Active' : 'Hidden'}
                                        </button>
                                        <button
                                            onClick={() => togglePremium(game.id)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${game.isPremium
                                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                    : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <Crown className="w-4 h-4" />
                                            {game.isPremium ? 'Premium' : 'Free'}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
