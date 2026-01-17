'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, ArrowUp, Bot, User, Loader2, Sparkles,
    Heart, AlertTriangle, StickyNote, Wallet, MessageCircle,
    Shield, X, ChevronDown, Flower2, Lock
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useNotes } from '@/hooks/useNotes';
import { useCalendar } from '@/hooks/useCalendar';
import { useHealth } from '@/hooks/useHealth';
import { useProgress } from '@/hooks/useProgress';
import { useAchievements } from '@/hooks/useAchievements';
import { useJourneys } from '@/hooks/useJourneys';
import { useWhisper } from '@/hooks/useWhisper';
import { useInsights } from '@/hooks/useInsights';
import { useTierLimits } from '@/hooks/useTierLimits';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface QuickAction {
    id: string;
    icon: any;
    label: { ar: string; en: string };
    prompt: { ar: string; en: string };
}

const quickActions: QuickAction[] = [
    {
        id: 'partner-mood',
        icon: Heart,
        label: { ar: 'حالة الشريك', en: 'Partner' },
        prompt: { ar: 'أخبرني عن حالة شريكي اليوم بناءً على آخر تسجيل للمشاعر. هل هو سعيد؟ متوتر؟ ما نصيحتك؟', en: 'Tell me about my partner mood today based on their latest check-in. Are they happy? Stressed? What do you advise?' }
    },
    {
        id: 'add-note',
        icon: StickyNote,
        label: { ar: 'ملاحظة', en: 'Note' },
        prompt: { ar: 'أريد إضافة ملاحظة جديدة. اسألني عن العنوان والمحتوى ثم احفظها لي.', en: 'I want to add a new note. Ask me for the title and content then save it.' }
    },
    {
        id: 'advice',
        icon: MessageCircle,
        label: { ar: 'نصيحة', en: 'Advice' },
        prompt: { ar: 'أعطني نصيحة مخصصة لتحسين علاقتي بناءً على بياناتي الحالية (حالتي المزاجية، النشاطات، السلسلة).', en: 'Give me personalized advice to improve my relationship based on my current data (mood, activities, streak).' }
    },
    {
        id: 'romantic-ideas',
        icon: Flower2,
        label: { ar: 'رومانسية', en: 'Romance' },
        prompt: { ar: 'أعطني 3 أفكار رومانسية مفاجئة يمكنني تنفيذها اليوم أو هذا الأسبوع.', en: 'Give me 3 surprise romantic ideas I can do today or this week.' }
    },
    {
        id: 'budget',
        icon: Wallet,
        label: { ar: 'ميزانية', en: 'Budget' },
        prompt: { ar: 'راجع أهدافي المالية الحالية وأخبرني عن تقدمي. هل لدي أهداف؟ ما اقترحاتك؟', en: 'Review my current budget goals and tell me about my progress. Do I have goals? What are your suggestions?' }
    },
    {
        id: 'intimate-wellness',
        icon: Lock,
        label: { ar: 'الصحة الخاصة', en: 'Private Health' },
        prompt: { ar: 'أحتاج نصائح للعلاقة الحميمية والتواصل الجسدي مع شريكي.', en: 'I need advice about intimacy and physical connection with my partner.' }
    },
];

export default function AICoachPage() {
    const { t, language } = useTranslation();
    const { theme } = useSettingsStore();
    const isRTL = language === 'ar';
    const { user } = useAuth();
    const { getStatus } = usePairing();
    const { getPartnerCheckIn } = useCheckIn();
    const { notes, specialDates, budgetGoals, createNote, createSpecialDate, createBudgetGoal } = useNotes();
    const { getSessions, createSession } = useCalendar();
    const { getHealthData, getCycleInfo } = useHealth();
    const { progress: progressStats } = useProgress();
    const { achievements } = useAchievements();
    const { progressMap: journeysData } = useJourneys();
    const { incomingWhisper, outgoingWhisper } = useWhisper();
    const { insights: insightsData } = useInsights();
    const { canUse, trackUsage, isPremium, getUpgradePrompt } = useTierLimits();
    const supabase = createClient();

    // AI usage tracking state
    const [aiUsage, setAiUsage] = useState<{ remaining: number; limit: number } | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'normal' | 'conflict' | 'intimate'>('normal');
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [partnerInfo, setPartnerInfo] = useState<{ name: string; mood?: number } | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [healthCycleInfo, setHealthCycleInfo] = useState<any | null>(null);
    const [gamesData, setGamesData] = useState<any[]>([]);
    const [checkInTrends, setCheckInTrends] = useState<any | null>(null);
    const [showPrivacyDisclaimer, setShowPrivacyDisclaimer] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        action: string;
        params: Record<string, string>;
        messageId: string;
    } | null>(null);

    // Separate storage for intimate mode messages (privacy: hidden when exiting)
    const [savedIntimateMessages, setSavedIntimateMessages] = useState<Message[]>([]);
    const [savedNormalMessages, setSavedNormalMessages] = useState<Message[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Partner status state
    const [partnerStatus, setPartnerStatus] = useState<'online' | 'offline'>('offline');

    // Fetch partner info - only on mount
    useEffect(() => {
        const fetchPartnerInfo = async () => {
            try {
                const status = await getStatus();
                if (status.partner) {
                    setPartnerInfo({ name: status.partner.display_name || 'Partner' });
                    setPartnerStatus(status.partner.is_online ? 'online' : 'offline');

                    // Get partner's latest check-in
                    if (status.partner.id) {
                        const result = await getPartnerCheckIn(status.partner.id);
                        if (result && result.data) {
                            setPartnerInfo(prev => prev ? { ...prev, mood: result.data.mood } : null);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching partner info:', error);
            }
        };
        fetchPartnerInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch calendar events - only on mount
    useEffect(() => {
        const fetchCalendarEvents = async () => {
            try {
                const result = await getSessions();
                if (result.data) {
                    setCalendarEvents(result.data);
                }
            } catch (error) {
                console.error('Error fetching calendar:', error);
            }
        };
        fetchCalendarEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch health data - only on mount
    useEffect(() => {
        const fetchHealthData = async () => {
            try {
                const result = await getHealthData();
                if (result.data) {
                    const cycleInfo = getCycleInfo(result.data);
                    setHealthCycleInfo(cycleInfo);
                }
            } catch (error) {
                console.error('Error fetching health data:', error);
            }
        };
        fetchHealthData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch games data - only on mount
    useEffect(() => {
        const fetchGamesData = async () => {
            if (!user) return;
            try {
                // First get the couple_id
                const { data: coupleData } = await supabase
                    .from('couples')
                    .select('id')
                    .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                    .eq('status', 'ACTIVE')
                    .maybeSingle();

                if (!coupleData?.id) return;

                const { data, error } = await supabase
                    .from('game_sessions')
                    .select('id, game_type, created_at, current_state')
                    .eq('couple_id', coupleData.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!error && data) {
                    // Transform current_state to include scores for compatibility
                    const transformed = data.map(item => ({
                        ...item,
                        scores: item.current_state?.scores || {}
                    }));
                    setGamesData(transformed);
                }
            } catch (error) {
                console.error('Error fetching games data:', error);
            }
        };
        fetchGamesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Fetch check-in trends (last 30 days) - only on mount
    useEffect(() => {
        const fetchCheckInTrends = async () => {
            if (!user) return;
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const { data, error } = await supabase
                    .from('check_ins')
                    .select('mood, energy, stress, created_at')
                    .eq('user_id', user.id)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: true });

                if (!error && data && data.length > 0) {
                    // Calculate trends
                    const total = data.length;
                    const avgMood = data.reduce((sum, c) => sum + c.mood, 0) / total;
                    const avgEnergy = data.reduce((sum, c) => sum + c.energy, 0) / total;
                    const avgStress = data.reduce((sum, c) => sum + c.stress, 0) / total;

                    // Detect mood trend
                    const firstHalf = data.slice(0, Math.floor(total / 2));
                    const secondHalf = data.slice(Math.floor(total / 2));
                    const firstMood = firstHalf.reduce((s, c) => s + c.mood, 0) / firstHalf.length;
                    const secondMood = secondHalf.reduce((s, c) => s + c.mood, 0) / secondHalf.length;

                    let moodTrend = 'stable';
                    if (secondMood > firstMood + 0.5) moodTrend = 'improving';
                    else if (secondMood < firstMood - 0.5) moodTrend = 'declining';

                    setCheckInTrends({
                        total,
                        avgMood,
                        avgEnergy,
                        avgStress,
                        moodTrend
                    });
                }
            } catch (error) {
                console.error('Error fetching check-in trends:', error);
            }
        };
        fetchCheckInTrends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Build context for AI - COMPREHENSIVE
    const buildContext = () => {
        const context: string[] = [];
        const today = new Date();

        // Partner info and status
        if (partnerInfo?.name) {
            context.push(`=== PARTNER INFO ===`);
            context.push(`Partner name: ${partnerInfo.name}`);
            context.push(`Partner status: ${partnerStatus === 'online' ? 'متصل الآن (Online)' : 'غير متصل (Offline)'}`);
            if (partnerInfo.mood) {
                const moodLabels = ['سيء جداً', 'سيء', 'عادي', 'جيد', 'ممتاز'];
                context.push(`Partner's mood today: ${moodLabels[partnerInfo.mood - 1]} (${partnerInfo.mood}/5)`);
            }
        }

        // Saved notes with CONTENT (important for answering questions)
        if (notes.length > 0) {
            context.push('');
            context.push('=== SAVED NOTES (use these to answer user questions) ===');
            notes.slice(0, 15).forEach(n => {
                context.push(`- ${n.title}${n.content ? `: ${n.content}` : ''} [category: ${n.category}]`);
            });
        }

        // Calendar events
        if (calendarEvents.length > 0) {
            context.push('');
            context.push('=== CALENDAR EVENTS ===');
            const upcoming = calendarEvents
                .filter(e => new Date(e.scheduled_date) >= today)
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .slice(0, 10);
            upcoming.forEach(e => {
                const daysUntil = Math.ceil((new Date(e.scheduled_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                context.push(`- ${e.title} on ${e.scheduled_date} (${daysUntil === 0 ? 'TODAY!' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}) [type: ${e.type}]`);
            });
        }

        // Special dates with proximity alerts
        if (specialDates.length > 0) {
            context.push('');
            context.push('=== SPECIAL DATES ===');
            specialDates.slice(0, 5).forEach(d => {
                const eventDate = new Date(d.event_date);
                const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const alert = daysUntil <= 7 ? ' ⚠️ COMING SOON!' : daysUntil <= 3 ? ' 🚨 VERY SOON!' : '';
                context.push(`- ${d.title}: ${d.event_date} (${daysUntil} days away)${alert}`);
            });
        }

        // Health & Fertility Data
        // Health & Fertility Data
        if (healthCycleInfo) {
            context.push('');
            context.push('=== HEALTH & FERTILITY INFO ===');
            context.push(`Cycle phase: ${healthCycleInfo.currentPhase} (${healthCycleInfo.phaseName.en} / ${healthCycleInfo.phaseName.ar})`);
            context.push(`Day of cycle: ${healthCycleInfo.dayOfCycle}`);
            context.push(`Fertility level: ${healthCycleInfo.fertilityLevel}`);
            if (healthCycleInfo.isFertileToday) {
                context.push(`🔴 Currently in FERTILE WINDOW!`);
            }
            if (healthCycleInfo.isOvulationDay) {
                context.push(`✨ TODAY is OVULATION DAY!`);
            }
            if (healthCycleInfo.daysUntilOvulation > 0 && healthCycleInfo.daysUntilOvulation <= 5) {
                context.push(`Ovulation in ${healthCycleInfo.daysUntilOvulation} days`);
            }
            if (healthCycleInfo.daysUntilPeriod <= 5) {
                context.push(`Next period in ${healthCycleInfo.daysUntilPeriod} days`);
            }
        }

        // Budget goals
        if (budgetGoals.length > 0) {
            context.push('');
            context.push('=== BUDGET GOALS ===');
            budgetGoals.forEach(g => {
                const progress = Math.round((g.current_amount / g.target_amount) * 100);
                const remaining = g.target_amount - g.current_amount;
                context.push(`- ${g.title}: ${g.current_amount}/${g.target_amount} (${progress}% complete, ${remaining} remaining)`);
            });
        }

        // Games Progress
        if (gamesData.length > 0) {
            context.push('');
            context.push('=== GAMES ACTIVITY ===');
            const last7Days = gamesData.filter(g =>
                (Date.now() - new Date(g.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
            );
            context.push(`Total games played: ${gamesData.length}`);
            context.push(`Games this week: ${last7Days.length}`);

            // Game type breakdown
            const gameTypes: Record<string, number> = gamesData.reduce((acc: Record<string, number>, g: any) => {
                acc[g.game_type] = (acc[g.game_type] || 0) + 1;
                return acc;
            }, {});

            const topGames = Object.entries(gameTypes)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 3)
                .map(([type, count]) => `${type} (${count})`)
                .join(', ');

            if (topGames) {
                context.push(`Favorite games: ${topGames}`);
            }

            if (last7Days.length === 0) {
                context.push('⚠️ No games played this week - suggest playing together!');
            }
        }

        // Journeys Progress
        if (journeysData && Object.keys(journeysData).length > 0) {
            context.push('');
            context.push('=== JOURNEYS PROGRESS ===');
            Object.entries(journeysData).forEach(([type, progress]: any) => {
                const completion = Math.round((progress.completed_steps / progress.total_steps) * 100);
                context.push(`- ${type}: ${progress.completed_steps}/${progress.total_steps} steps (${completion}%)`);

                if (completion === 100 && progress.completed_at) {
                    context.push(`  ✅ COMPLETED on ${progress.completed_at}`);
                } else if (completion > 0 && completion < 100) {
                    context.push(`  📍 IN PROGRESS - ${progress.total_steps - progress.completed_steps} steps remaining`);
                }
            });
        }

        // Achievements
        if (achievements && achievements.length > 0) {
            context.push('');
            context.push('=== ACHIEVEMENTS ===');
            const unlocked = achievements.filter((a: any) => a.unlocked);
            const inProgress = achievements.filter((a: any) => !a.unlocked && a.progress > 0);

            context.push(`Unlocked: ${unlocked.length}/${achievements.length}`);

            if (unlocked.length > 0) {
                context.push('Recent unlocks:');
                unlocked.slice(-3).forEach((a: any) => {
                    context.push(`  🏆 ${a.title} - ${a.description}`);
                });
            }

            if (inProgress.length > 0) {
                context.push('Almost there:');
                inProgress.forEach((a: any) => {
                    const percentage = Math.round((a.progress / a.target) * 100);
                    context.push(`  ⏳ ${a.title}: ${a.progress}/${a.target} (${percentage}%)`);
                });
            }
        }

        // Whisper Activity
        const whisperActivity = [];
        if (incomingWhisper) whisperActivity.push({ ...incomingWhisper, direction: 'received' });
        if (outgoingWhisper) whisperActivity.push({ ...outgoingWhisper, direction: 'sent' });

        if (whisperActivity.length > 0) {
            context.push('');
            context.push('=== WHISPER ACTIVITY ===');
            whisperActivity.forEach((w: any) => {
                const direction = w.direction === 'sent' ? 'Sent' : 'Received';
                context.push(`  - ${direction}: "${w.message}" [${w.type}] - Status: ${w.status}`);
            });

            if (incomingWhisper && incomingWhisper.status === 'pending') {
                context.push(`⚠️ Pending whisper from partner - remind user to respond!`);
            }
        }

        // Check-in Trends
        if (checkInTrends) {
            context.push('');
            context.push('=== CHECK-IN TRENDS (Last 30 Days) ===');
            context.push(`Total check-ins: ${checkInTrends.total}`);
            context.push(`Average mood: ${checkInTrends.avgMood.toFixed(1)}/5`);
            context.push(`Average energy: ${checkInTrends.avgEnergy.toFixed(1)}/5`);
            context.push(`Average stress: ${checkInTrends.avgStress.toFixed(1)}/5`);

            // Trend analysis
            if (checkInTrends.moodTrend === 'improving') {
                context.push('📈 Mood is IMPROVING over time!');
            } else if (checkInTrends.moodTrend === 'declining') {
                context.push('📉 Mood is DECLINING - needs attention!');
            }
        }

        // Progress Stats
        if (progressStats) {
            context.push('');
            context.push('=== RELATIONSHIP PROGRESS ===');
            context.push(`Current streak: ${progressStats.streak} days 🔥`);
            context.push(`Trend: ${progressStats.trend}`);
            context.push(`Alignment score: ${progressStats.alignment}/5`);
            context.push(`Focus area: ${progressStats.focus}`);
            context.push(`Sessions this week: ${progressStats.sessions}`);
            context.push(`Check-ins this week: ${progressStats.checkIns}`);

            if (progressStats.streak === 0) {
                context.push('⚠️ NO ACTIVE STREAK - encourage daily check-ins!');
            } else if (progressStats.streak >= 7) {
                context.push('🎉 Strong streak! Celebrate this achievement!');
            }
        }

        // Insights
        if (insightsData) {
            context.push('');
            context.push('=== AI INSIGHTS ===');
            if (insightsData.weeklyHighlight) {
                context.push(`This week: ${insightsData.weeklyHighlight}`);
            }
            if (insightsData.recommendations && insightsData.recommendations.length > 0) {
                context.push('Suggestions:');
                insightsData.recommendations.slice(0, 3).forEach((s: string) => {
                    context.push(`  - ${s}`);
                });
            }
        }

        return context.join('\n');
    };

    // Parse AI response for actions
    const parseActions = (response: string): { action: string; params: Record<string, string> }[] => {
        const actions: { action: string; params: Record<string, string> }[] = [];

        // Match action patterns: [ACTION:type|param1=value1|param2=value2]
        const actionRegex = /\[ACTION:(\w+)(?:\|([^\]]+))?\]/g;
        let match;

        while ((match = actionRegex.exec(response)) !== null) {
            const actionType = match[1];
            const paramsStr = match[2] || '';
            const params: Record<string, string> = {};

            if (paramsStr) {
                paramsStr.split('|').forEach(p => {
                    const [key, value] = p.split('=');
                    if (key && value) params[key.trim()] = value.trim();
                });
            }

            actions.push({ action: actionType, params });
        }

        return actions;
    };

    // Execute detected actions
    const executeActions = async (actions: { action: string; params: Record<string, string> }[]) => {
        const results: string[] = [];

        for (const { action, params } of actions) {
            try {
                const actionLower = action.toLowerCase();

                switch (actionLower) {
                    case 'add_note':
                        if (params.title) {
                            const result = await createNote(params.title, params.content || '', (params.category as any) || 'general');

                            if (result.error) {
                                results.push(isRTL
                                    ? `❌ فشل إضافة الملاحظة: ${result.error === 'Not paired' ? 'يجب أن تكون مقترناً بشريك' : result.error}`
                                    : `❌ Failed to add note: ${result.error === 'Not paired' ? 'You need to be paired with a partner' : result.error}`
                                );
                            } else {
                                results.push(isRTL ? `✅ تم إضافة ملاحظة: "${params.title}"` : `✅ Added note: "${params.title}"`);
                            }
                        }
                        break;
                    case 'add_special_date':
                        if (params.title && params.date) {
                            const result = await createSpecialDate(params.title, params.date, (params.type as any) || 'custom');

                            if (result.error) {
                                results.push(isRTL
                                    ? `❌ فشل إضافة المناسبة: ${result.error === 'Not paired' ? 'يجب أن تكون مقترناً بشريك' : result.error}`
                                    : `❌ Failed to add date: ${result.error === 'Not paired' ? 'You need to be paired with a partner' : result.error}`
                                );
                            } else {
                                results.push(isRTL ? `✅ تم إضافة مناسبة: "${params.title}"` : `✅ Added date: "${params.title}"`);
                            }
                        }
                        break;
                    case 'add_budget':
                        if (params.title && (params.target || params.amount)) {
                            const amount = parseFloat(params.target || params.amount);
                            const result = await createBudgetGoal(params.title, amount);

                            if (result.error) {
                                results.push(isRTL
                                    ? `❌ فشل إضافة الهدف: ${result.error === 'Not paired' ? 'يجب أن تكون مقترناً بشريك' : result.error}`
                                    : `❌ Failed to add goal: ${result.error === 'Not paired' ? 'You need to be paired with a partner' : result.error}`
                                );
                            } else {
                                results.push(isRTL ? `✅ تم إضافة هدف: "${params.title}"` : `✅ Added goal: "${params.title}"`);
                            }
                        }
                        break;
                    case 'add_calendar':
                        if (params.title && params.date) {
                            const result = await createSession({
                                title: params.title,
                                scheduled_date: params.date,
                                type: (params.type as any) || 'CUSTOM',
                                reminder_enabled: true
                            });

                            if (result.error) {
                                results.push(isRTL
                                    ? `❌ فشل إضافة الموعد: ${result.error === 'Not paired' ? 'يجب أن تكون مقترناً بشريك' : result.error}`
                                    : `❌ Failed to add event: ${result.error === 'Not paired' ? 'You need to be paired with a partner' : result.error}`
                                );
                            } else {
                                results.push(isRTL ? `📅 تم إضافة ل تقويم: "${params.title}"` : `📅 Added to calendar: "${params.title}"`);
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error('Action error:', error);
                results.push(isRTL ? '❌ حدث خطأ في تنفيذ الإجراء' : '❌ Error executing action');
            }
        }

        return results;
    };

    // Clean action tags from response
    const cleanResponse = (response: string): string => {
        return response.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    };

    // Fetch AI usage on mount
    useEffect(() => {
        const fetchUsage = async () => {
            const usage = await canUse('ai_chat');
            if (usage.limit > 0) {
                setAiUsage({ remaining: usage.remaining, limit: usage.limit });
            }
        };
        fetchUsage();
    }, [canUse]);

    // Send message to AI
    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        // Check if user can send more messages (tier limit)
        const usage = await canUse('ai_chat');
        if (!usage.canUse && usage.limit > 0) {
            setShowUpgradePrompt(true);
            return;
        }

        // Track usage
        const trackResult = await trackUsage('ai_chat');
        if (trackResult.remaining >= 0) {
            setAiUsage({ remaining: trackResult.remaining, limit: usage.limit });
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setShowQuickActions(false);

        // Check for conflict mode trigger
        const conflictTriggers = ['خلاف', 'مشكلة', 'زعلان', 'conflict', 'problem', 'fight', 'argument'];
        const isConflictRelated = conflictTriggers.some(trigger =>
            content.toLowerCase().includes(trigger)
        );

        if (isConflictRelated && mode !== 'conflict') {
            setMode('conflict');
        }

        try {
            const context = buildContext();
            const actionInstructions = `
=== ACTION SYSTEM ===
**CRITICAL RULE: NEVER add [ACTION:...] unless you have ALL required information!**

When user wants to add something (note, date, budget), follow this EXACT process:

**STEP 1: Gather Information First**
- If user says "أريد إضافة ملاحظة" but doesn't provide title/content → ASK them: "ما عنوان الملاحظة ومحتواها؟"
- If user says generic request → ASK for specific details
- DO NOT add any [ACTION:...] tag until you have the actual data

**STEP 2: Only After User Provides Details**
- Once user gives you specific title/content → THEN add [ACTION:...]
- Example flow:
  User: "أريد إضافة ملاحظة"
  AI: "بالتأكيد! ما عنوان الملاحظة ومحتواها؟"
  User: "عنوانها ذكرى زفافنا ومحتواها كان يوم رائع"
  AI: "هل تريد مني إضافة ملاحظة بعنوان 'ذكرى زفافنا' ومحتوى 'كان يوم رائع'؟ [ACTION:add_note|title=ذكرى زفافنا|content=كان يوم رائع|category=personal]"

**Available Actions (only use when you have REAL data):**
- [ACTION:add_note|title=ACTUAL_TITLE|content=ACTUAL_CONTENT|category=personal]
- [ACTION:add_special_date|title=Event Name|date=YYYY-MM-DD]
- [ACTION:add_budget|title=Goal Name|target=5000|current=0]
- [ACTION:add_calendar|title=Event|date=YYYY-MM-DD|type=date]

**WRONG ❌:**
User: "أريد إضافة ملاحظة"
AI: "هل تريد مني إضافة ملاحظة؟ [ACTION:add_note|title=ملاحظة جديدة|content=|category=personal]"

**CORRECT ✅:**
User: "أريد إضافة ملاحظة"
AI: "بالتأكيد! ما عنوان الملاحظة ومحتواها؟"
`;

            const systemPrompt = mode === 'intimate'
                ? `أنت مستشار الصحة الجنسية المحترف - معالج نفسي جنسي بخبرة 15+ عاماً.

=== الشخصية ===
- مهني، محترم، ومريح للتحدث معه
- تستخدم مصطلحات طبية واضحة ومهذبة
- لا تحكم، وتحترم خصوصية المستخدم
- تتحدث بثقة وتطمئن الزوجين

=== المجالات ===
1. نصائح للعلاقة الحميمية والتواصل الجسدي
2. صحة الزوجين الجنسية
3. التغذية والأطعمة المفيدة للحيوية
4. التعامل مع التحديات الشائعة

=== القواعد المهمة ===
- كل المحادثات خاصة ولا يتم حفظها
- لا تضف أي ملاحظات أو إجراءات [ACTION:...]
- كن مباشراً لكن مهذباً
- إذا كانت الحالة تتطلب طبيب، انصح بزيارته

=== التنسيق ===
- ردود مختصرة ومنظمة
- استخدم 🔒 للتأكيد على الخصوصية
- رقم النصائح عند تعددها

Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`
                : mode === 'conflict'
                    ? `أنت رفيق وصال - مستشار خبير في حل النزاعات الزوجية بخبرة 20 عاماً.
                   
الدور: وسيط محايد وحكيم يساعد الزوجين على فهم بعضهما والوصول لحل.

القواعد:
- استمع بتعاطف لكلا الطرفين
- لا تنحاز لأي طرف أبداً
- ركز على المشاعر والاحتياجات وليس اللوم
- اقترح خطوات عملية للحل
- استخدم لغة هادئة ومحترمة

Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`
                    : `أنت رفيق وصال - مستشار علاقات خبير بخبرة 20+ عاماً في مساعدة الأزواج.

=== الشخصية ===
- حكيم، رسمي لكن ودود (مثل صديق موثوق)
- تتحدث بثقة ومعرفة عميقة
- تهتم حقاً بسعادة الزوجين
- تعطي نصائح عملية وقابلة للتطبيق

=== طول الرد (مهم جداً) ===
- كن مختصراً قدر الإمكان
- الأسئلة البسيطة: جملة أو جملتين
- الأسئلة المتوسطة: فقرة قصيرة
- فقط المواضيع المعقدة: رد مفصل
- لا تكرر نفسك أبداً

=== التنسيق (مهم جداً) ===
ممنوع منعاً باتاً:
- لا تستخدم ** أبداً (هذا مهم!)
- لا تستخدم ## أو # أبداً
- لا تستخدم --- أبداً
- اكتب نص عادي فقط
- استخدم الإيموجي باعتدال

=== فهم النية ===
1. أسئلة: أجب مباشرة من البيانات
2. طلب إجراء (أضف/احفظ/سجل): نفذ باستخدام [ACTION:...]
3. تعديل/حذف: اعتذر واطلب التعديل يدوياً

=== الإجراءات ===
${actionInstructions}

=== السياق ===
${context}

Respond in ${language === 'ar' ? 'Arabic' : 'English'}.`;

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: content }
                    ]
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();

            // API returns OpenAI format: data.choices[0].message.content
            const rawContent = data.choices?.[0]?.message?.content
                || data.content
                || data.message
                || 'عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.';

            // Parse actions
            const actions = parseActions(rawContent);
            let finalContent = cleanResponse(rawContent);

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: finalContent,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // If there are actions, store first one as pending (require confirmation)
            if (actions.length > 0) {
                setPendingAction({
                    action: actions[0].action,
                    params: actions[0].params,
                    messageId: assistantMessage.id
                });
            }
        } catch (error) {
            console.error('AI error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: isRTL
                    ? 'عذراً، حدث خطأ. حاول مرة أخرى.'
                    : 'Sorry, an error occurred. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle action confirmation (Yes/No buttons)
    const handleConfirmAction = async (confirmed: boolean) => {
        if (!pendingAction) return;

        if (!confirmed) {
            // User clicked No - add cancellation message
            const cancelMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: isRTL ? 'حسناً، تم الإلغاء.' : 'Okay, cancelled.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, cancelMessage]);
            setPendingAction(null);
            return;
        }

        // User clicked Yes - execute the action
        setIsLoading(true);
        try {
            const result = await executeActions([{
                action: pendingAction.action,
                params: pendingAction.params
            }]);

            // Add confirmation message
            const confirmMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: result.length > 0
                    ? result.join('\n')
                    : (isRTL ? '✅ تم!' : '✅ Done!'),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMessage]);
        } catch (error) {
            console.error('Action execution error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: isRTL ? 'عذراً، حدث خطأ في تنفيذ الإجراء.' : 'Sorry, an error occurred while executing the action.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setPendingAction(null);
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPendingAction(null); // Clear any pending action when user sends new message
        sendMessage(inputValue);
    };

    const handleQuickAction = (action: QuickAction) => {
        if (action.id === 'intimate-wellness') {
            setShowPrivacyDisclaimer(true);
        } else {
            sendMessage(action.prompt[language]);
        }
    };

    const enterIntimateMode = () => {
        setShowPrivacyDisclaimer(false);

        // Save current normal messages before switching
        setSavedNormalMessages(messages);

        // Check if we have previous intimate messages to restore
        if (savedIntimateMessages.length > 0) {
            setMessages(savedIntimateMessages);
        } else {
            // First time entering, show welcome
            setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: isRTL
                    ? '🔒 مرحباً! أنا مستشار الصحة الخاصة.\n\n⚠️ ملاحظة مهمة: جميع المحادثات في هذا الوضع لا يتم حفظها وهي سرية تماماً.\n\nأنا هنا لمساعدتكم في:\n• نصائح للعلاقة الحميمية\n• صحة الزوجين\n• التغذية والحيوية\n\nكيف أقدر أساعدك؟'
                    : '🔒 Hello! I\'m your Private Health Advisor.\n\n⚠️ Important: All conversations in this mode are NOT saved and completely private.\n\nI\'m here to help with:\n• Intimate relationship advice\n• Couples wellness\n• Nutrition & vitality\n\nHow can I help you?',
                timestamp: new Date()
            }]);
        }

        setMode('intimate');
        setShowQuickActions(false);
    };

    const exitPrivateMode = () => {
        // Save intimate messages before clearing
        setSavedIntimateMessages(messages);

        // Restore normal messages or show fresh start
        setMessages(savedNormalMessages.length > 0 ? savedNormalMessages : []);

        setMode('normal');
        setShowQuickActions(true);
    };

    return (
        <div className={`min-h-screen font-sans flex flex-col ${mode === 'intimate'
            ? 'bg-gradient-to-b from-purple-950 via-surface-900 to-purple-950'
            : theme === 'light'
                ? 'bg-slate-50'
                : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'
            }`}>
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] animate-pulse ${mode === 'conflict' ? 'bg-orange-500/10' : mode === 'intimate' ? 'bg-purple-500/15' : 'bg-primary-500/10'
                    }`} />
                <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px] animate-pulse delay-1000 ${mode === 'conflict' ? 'bg-red-500/10' : mode === 'intimate' ? 'bg-pink-500/10' : 'bg-accent-500/10'
                    }`} />
            </div>

            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${mode === 'conflict'
                ? theme === 'light' ? 'bg-orange-50/90 border-orange-200' : 'bg-orange-900/20 border-orange-500/30'
                : mode === 'intimate'
                    ? 'bg-purple-900/30 border-purple-500/30'
                    : theme === 'light'
                        ? 'bg-white/80 border-slate-200'
                        : 'bg-surface-900/80 border-surface-700/30'
                }`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className={`p-2 rounded-full hover:bg-white/10 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-surface-400 hover:text-white'}`}>
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Link>
                    <div className="flex-1">
                        <h1 className={`text-lg font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {mode === 'conflict' ? (
                                <>
                                    <Shield className={`w-5 h-5 ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`} />
                                    <span className={theme === 'light' ? 'text-orange-900' : 'text-white'}>
                                        {isRTL ? 'وضع حل الخلاف' : 'Conflict Mode'}
                                    </span>
                                </>
                            ) : mode === 'intimate' ? (
                                <>
                                    <Lock className="w-5 h-5 text-purple-400" />
                                    {isRTL ? 'الصحة الخاصة' : 'Private Health'}
                                </>
                            ) : (
                                <>
                                    <Bot className="w-5 h-5 text-primary-400" />
                                    {isRTL ? 'رفيق وصال' : 'Wesal AI'}
                                </>
                            )}
                        </h1>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {mode === 'conflict'
                                ? (isRTL ? 'أساعدكم تحلون الخلاف' : 'Helping you resolve conflict')
                                : mode === 'intimate'
                                    ? (isRTL ? '🔒 محادثة خاصة وآمنة' : '🔒 Private & Secure')
                                    : (isRTL ? 'رفيقك الذكي' : 'Your AI companion')
                            }
                        </p>
                    </div>
                    {(mode === 'conflict' || mode === 'intimate') && (
                        <button
                            onClick={exitPrivateMode}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors ${mode === 'intimate'
                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                : theme === 'light'
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                    : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                }`}
                        >
                            <X className="w-4 h-4" />
                            {isRTL ? 'خروج' : 'Exit'}
                        </button>
                    )}
                    {/* Usage Counter Badge - Hidden for premium users */}
                    {!isPremium && aiUsage && aiUsage.limit > 0 && mode !== 'intimate' && (
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${aiUsage.remaining <= 1
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-surface-700/50 text-surface-300'
                            }`}>
                            {aiUsage.remaining}/{aiUsage.limit}
                        </div>
                    )}
                </div>
            </header>

            {/* Upgrade Prompt Modal */}
            <AnimatePresence>
                {showUpgradePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
                        onClick={() => setShowUpgradePrompt(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`rounded-3xl p-6 max-w-sm w-full text-center border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-800 border-white/10'}`}
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {isRTL ? 'انتهت رسائل اليوم' : 'Daily Limit Reached'}
                            </h3>
                            <p className={`mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {isRTL
                                    ? 'اشترك في Premium للحصول على محادثات غير محدودة مع رفيق وصال'
                                    : 'Upgrade to Premium for unlimited AI conversations'}
                            </p>
                            <Link
                                href="/settings/upgrade"
                                className="block w-full py-3 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold mb-3"
                            >
                                {isRTL ? 'ترقية الآن' : 'Upgrade Now'}
                            </Link>
                            <button
                                onClick={() => setShowUpgradePrompt(false)}
                                className="text-surface-500 text-sm"
                            >
                                {isRTL ? 'لاحقاً' : 'Maybe Later'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <AnimatePresence>
                {messages.length === 0 ? (
                    /* Full-page Welcome Screen */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-lg mx-auto w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center w-full"
                        >
                            {/* AI Avatar - Static */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30 mx-auto mb-5">
                                <Bot className="w-10 h-10 text-white" />
                            </div>

                            <h2 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {isRTL ? 'مرحباً! أنا رفيق وصال' : 'Hello! I\'m Wesal AI'}
                            </h2>
                            <p className={`text-xs leading-relaxed max-w-xs mx-auto mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {isRTL
                                    ? 'أقدر أساعدك في ملاحظاتك، مناسباتك، ميزانيتك، وأعطيك نصائح للعلاقة'
                                    : 'I can help with notes, dates, budget, and relationship advice'
                                }
                            </p>

                            {/* Quick Actions - Compact 3 columns */}
                            <p className={`text-xs mb-3 ${theme === 'light' ? 'text-slate-400' : 'text-surface-500'}`}>
                                {isRTL ? 'اختر موضوع أو اكتب سؤالك' : 'Choose a topic or type below'}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {quickActions.map((action, idx) => (
                                    <motion.button
                                        key={action.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => handleQuickAction(action)}
                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${action.id === 'intimate-wellness'
                                            ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/15'
                                            : theme === 'light'
                                                ? 'bg-white border-slate-200 hover:bg-slate-50'
                                                : 'bg-surface-800/30 border-white/10 hover:bg-primary-500/10'
                                            }`}
                                    >
                                        <action.icon className={`w-5 h-5 ${action.id === 'intimate-wellness' ? 'text-purple-400' : (theme === 'light' ? 'text-primary-500' : 'text-primary-400')
                                            }`} />
                                        <span className={`text-[10px] leading-tight ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>{action.label[language]}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Messages Area when chatting */
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">

                        {messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? theme === 'light'
                                        ? 'bg-primary-500 text-white rounded-tr-none shadow-lg shadow-primary-500/20'
                                        : 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-600/20'
                                    : theme === 'light'
                                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                                        : 'bg-surface-800 text-white rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className={`rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 ${theme === 'light'
                                    ? 'bg-white border border-slate-200'
                                    : 'bg-surface-800'
                                    }`}>
                                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-xl z-20 transition-colors ${theme === 'light'
                ? 'bg-white/80 border-white/50'
                : 'bg-surface-900/90 border-surface-800'
                }`}>
                <div className="max-w-2xl mx-auto flex items-end gap-2">
                    <button
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className={`p-3 rounded-xl transition-colors ${theme === 'light'
                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                            }`}
                    >
                        {showQuickActions ? <ChevronDown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </button>

                    <div className={`flex-1 rounded-2xl border transition-all flex items-center px-4 py-2 ${theme === 'light'
                        ? 'bg-slate-50 border-slate-200 focus-within:border-primary-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100'
                        : 'bg-surface-800 border-surface-700 focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/20'
                        }`}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                            placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                            className={`w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm py-2 ${theme === 'light' ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-surface-400'
                                }`}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        onClick={() => sendMessage(inputValue)}
                        disabled={!inputValue.trim() || isLoading}
                        className={`p-3 rounded-xl transition-all shadow-lg ${inputValue.trim() && !isLoading
                            ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-primary-500/25 hover:scale-105 active:scale-95'
                            : theme === 'light'
                                ? 'bg-slate-200 text-slate-400'
                                : 'bg-surface-800 text-surface-500'
                            }`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />)}
                    </button>
                </div>
            </div>

            {/* Pending Action Confirmation Modal */}
            <AnimatePresence>
                {pendingAction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${theme === 'light'
                                ? 'bg-white border-slate-200'
                                : 'bg-surface-900 border-surface-700'
                                }`}
                        >
                            <div className="text-center mb-6">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'light' ? 'bg-primary-50 text-primary-600' : 'bg-primary-900/30 text-primary-400'
                                    }`}>
                                    <Bot className="w-7 h-7" />
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                    {isRTL ? 'تأكيد الإجراء' : 'Confirm Action'}
                                </h3>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                    {isRTL ? 'هل تريد مني تنفيذ هذا الإجراء؟' : 'Would you like me to proceed with this action?'}
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${theme === 'light'
                                ? 'bg-slate-50 border-slate-100 text-slate-700'
                                : 'bg-surface-800 border-surface-700 text-surface-200'
                                }`}>
                                {isRTL ? 'الإجراء: ' : 'Action: '} {pendingAction.action.replace('_', ' ')}
                                <br />
                                <span className={theme === 'light' ? 'text-slate-500 font-normal' : 'text-surface-400 font-normal'}>
                                    {Object.entries(pendingAction.params).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPendingAction(null)}
                                    className={`py-2.5 rounded-xl font-medium transition-colors ${theme === 'light'
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                                        }`}
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (pendingAction) {
                                            executeActions([pendingAction]);
                                            setPendingAction(null);
                                        }
                                    }}
                                    className="py-2.5 rounded-xl font-medium bg-primary-600 text-white hover:bg-primary-500 transition-colors"
                                >
                                    {isRTL ? 'نعم، نفذ' : 'Yes, Proceed'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Privacy Disclaimer (First Time) */}
            <AnimatePresence>
                {showPrivacyDisclaimer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowPrivacyDisclaimer(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-gradient-to-b from-purple-900/90 to-surface-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-purple-500/30 shadow-2xl"
                        >
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {isRTL ? 'الصحة الخاصة' : 'Private Health'}
                                </h3>
                                <p className="text-purple-200 text-sm leading-relaxed">
                                    {isRTL
                                        ? 'هذا الوضع مخصص لنصائح الصحة الجنسية والعلاقة الحميمية بين الزوجين.'
                                        : 'This mode provides professional advice on intimate health and wellness for couples.'}
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-purple-300 text-sm font-medium mb-1">
                                            {isRTL ? '🔒 خصوصية تامة' : '🔒 Complete Privacy'}
                                        </p>
                                        <p className="text-purple-200/70 text-xs">
                                            {isRTL
                                                ? 'جميع المحادثات في هذا الوضع لا يتم حفظها نهائياً وهي سرية تماماً.'
                                                : 'All conversations in this mode are NOT saved and completely confidential.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPrivacyDisclaimer(false)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-surface-700/50 text-surface-300 font-medium hover:bg-surface-600/50 transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={enterIntimateMode}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    {isRTL ? 'متابعة' : 'Continue'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
