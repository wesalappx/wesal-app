'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Map,
    Save,
    RefreshCw,
    Crown,
    Eye,
    EyeOff,
    Heart,
    MessageCircle,
    Target,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';

// Journey structure
interface Journey {
    id: string;
    title: { ar: string; en: string };
    description: { ar: string; en: string };
    totalSteps: number;
    completedByCount: number;
    isEnabled: boolean;
    isPremium: boolean;
}

// Icon mapping
const journeyIcons: Record<string, any> = {
    basics: Heart,
    communication: MessageCircle,
    future: Target,
};

export default function AdminJourneysPage() {
    const [journeys, setJourneys] = useState<Journey[]>([
        { id: 'basics', title: { ar: 'أساسيات العلاقة', en: 'Relationship Basics' }, description: { ar: 'بناء الأساس', en: 'Build the foundation' }, totalSteps: 5, completedByCount: 234, isEnabled: true, isPremium: false },
        { id: 'communication', title: { ar: 'فن التواصل', en: 'Art of Communication' }, description: { ar: 'تعلم التواصل الفعال', en: 'Learn effective communication' }, totalSteps: 5, completedByCount: 156, isEnabled: true, isPremium: false },
        { id: 'future', title: { ar: 'تخطيط المستقبل', en: 'Future Planning' }, description: { ar: 'خططوا معاً', en: 'Plan together' }, totalSteps: 5, completedByCount: 89, isEnabled: true, isPremium: true },
    ]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

    useEffect(() => {
        fetchJourneys();
    }, []);

    const fetchJourneys = async () => {
        try {
            const res = await fetch('/api/admin/journeys');
            if (res.ok) {
                const data = await res.json();
                if (data.journeys) {
                    setJourneys(data.journeys);
                }
            }
        } catch (err) {
            console.error('Error fetching journeys:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleEnabled = (journeyId: string) => {
        setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, isEnabled: !j.isEnabled } : j));
        setHasChanges(true);
    };

    const togglePremium = (journeyId: string) => {
        setJourneys(prev => prev.map(j => j.id === journeyId ? { ...j, isPremium: !j.isPremium } : j));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/journeys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journeys }),
            });
            if (res.ok) {
                setHasChanges(false);
                alert('Journeys settings saved!');
            }
        } catch (err) {
            console.error('Error saving journeys:', err);
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
                        <Map className="w-8 h-8 text-violet-400" />
                        Journeys Management
                    </h1>
                    <p className="text-slate-400 mt-1">Control journey availability and premium status</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className={`bg-violet-600 hover:bg-violet-500 text-white ${!hasChanges && 'opacity-50'}`}
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-white">{journeys.length}</p>
                        <p className="text-xs text-slate-500">Total Journeys</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-400">{journeys.filter(j => !j.isPremium).length}</p>
                        <p className="text-xs text-slate-500">Free Journeys</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/40 border-slate-800">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-amber-400">{journeys.filter(j => j.isPremium).length}</p>
                        <p className="text-xs text-slate-500">Premium Journeys</p>
                    </CardContent>
                </Card>
            </div>

            {/* Journeys List */}
            <div className="space-y-4">
                {journeys.map((journey, idx) => {
                    const IconComponent = journeyIcons[journey.id] || Map;
                    const isExpanded = expandedJourney === journey.id;

                    return (
                        <motion.div
                            key={journey.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={`overflow-hidden transition-all ${journey.isEnabled
                                    ? 'bg-slate-900/40 border-slate-800 hover:border-violet-500/30'
                                    : 'bg-slate-900/20 border-slate-800/50 opacity-60'
                                }`}>
                                <CardContent className="p-0">
                                    {/* Main Row */}
                                    <div className="p-5 flex items-center gap-4">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${journey.isEnabled
                                                ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20'
                                                : 'bg-slate-800/50'
                                            }`}>
                                            <IconComponent className={`w-7 h-7 ${journey.isEnabled ? 'text-violet-400' : 'text-slate-500'}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className={`font-bold text-lg ${journey.isEnabled ? 'text-white' : 'text-slate-500'}`}>
                                                    {journey.title.en}
                                                </h3>
                                                {journey.isPremium && (
                                                    <Badge className="bg-amber-500/20 text-amber-400 border-0">
                                                        <Crown className="w-3 h-3 mr-1" /> Premium
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{journey.title.ar}</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="text-center px-4 border-r border-white/5">
                                            <p className="text-2xl font-bold text-white">{journey.totalSteps}</p>
                                            <p className="text-xs text-slate-500">Steps</p>
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-2xl font-bold text-emerald-400">{journey.completedByCount}</p>
                                            <p className="text-xs text-slate-500">Completions</p>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleEnabled(journey.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${journey.isEnabled
                                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                {journey.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                {journey.isEnabled ? 'Active' : 'Hidden'}
                                            </button>
                                            <button
                                                onClick={() => togglePremium(journey.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${journey.isPremium
                                                        ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                        : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                <Crown className="w-4 h-4" />
                                                {journey.isPremium ? 'Premium' : 'Free'}
                                            </button>
                                            <button
                                                onClick={() => setExpandedJourney(isExpanded ? null : journey.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 bg-slate-950/30 p-5"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Description (EN)</p>
                                                    <p className="text-sm text-white">{journey.description.en}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Description (AR)</p>
                                                    <p className="text-sm text-white text-right" dir="rtl">{journey.description.ar}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
