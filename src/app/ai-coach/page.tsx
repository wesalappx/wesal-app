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
import { createClient } from '@/lib/supabase/client';

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
        prompt: { ar: 'كيف حال شريكي اليوم؟', en: 'How is my partner feeling today?' }
    },
    {
        id: 'add-note',
        icon: StickyNote,
        label: { ar: 'ملاحظة', en: 'Note' },
        prompt: { ar: 'أريد إضافة ملاحظة', en: 'I want to add a note' }
    },
    {
        id: 'advice',
        icon: MessageCircle,
        label: { ar: 'نصيحة', en: 'Advice' },
        prompt: { ar: 'أحتاج نصيحة للعلاقة', en: 'I need relationship advice' }
    },
    {
        id: 'romantic-ideas',
        icon: Flower2,
        label: { ar: 'رومانسية', en: 'Romance' },
        prompt: { ar: 'أعطني أفكار رومانسية', en: 'Give me romantic ideas' }
    },
    {
        id: 'budget',
        icon: Wallet,
        label: { ar: 'ميزانية', en: 'Budget' },
        prompt: { ar: 'ساعدني في الميزانية', en: 'Help with budget' }
    },
    {
        id: 'intimate-wellness',
        icon: Lock,
        label: { ar: 'الصحة الخاصة', en: 'Private Health' },
        prompt: { ar: 'أحتاج نصائح خاصة', en: 'I need private advice' }
    },
];

export default function AICoachPage() {
    const { t, language } = useTranslation();
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
    const supabase = createClient();

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
                const { data, error } = await supabase
                    .from('game_sessions')
                    .select('id, game_type, created_at, scores')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!error && data) {
                    setGamesData(data);
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
                switch (action) {
                    case 'ADD_NOTE':
                        if (params.title) {
                            await createNote(params.title, params.content || '', (params.category as any) || 'general');
                            results.push(isRTL ? `✅ تم إضافة ملاحظة: "${params.title}"` : `✅ Added note: "${params.title}"`);
                        }
                        break;
                    case 'ADD_DATE':
                        if (params.title && params.date) {
                            await createSpecialDate(params.title, params.date, (params.type as any) || 'custom');
                            results.push(isRTL ? `✅ تم إضافة مناسبة: "${params.title}"` : `✅ Added date: "${params.title}"`);
                        }
                        break;
                    case 'ADD_BUDGET':
                        if (params.title && params.amount) {
                            await createBudgetGoal(params.title, parseFloat(params.amount));
                            results.push(isRTL ? `✅ تم إضافة هدف: "${params.title}"` : `✅ Added goal: "${params.title}"`);
                        }
                        break;
                    case 'ADD_CALENDAR':
                        if (params.title && params.date) {
                            await createSession({
                                title: params.title,
                                scheduled_date: params.date,
                                type: (params.type as any) || 'CUSTOM',
                                reminder_enabled: true
                            });
                            results.push(isRTL ? `📅 تم إضافة للتقويم: "${params.title}"` : `📅 Added to calendar: "${params.title}"`);
                        }
                        break;
                }
            } catch (error) {
                console.error('Action error:', error);
            }
        }

        return results;
    };

    // Clean action tags from response
    const cleanResponse = (response: string): string => {
        return response.replace(/\[ACTION:[^\]]+\]/g, '').trim();
    };

    // Send message to AI
    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

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
RULE 1: ONLY add actions when user EXPLICITLY asks to save/record/add using words like: "سجل", "احفظ", "أضف", "ذكرني", "save", "add", "record", "remember"
When the user explicitly asks you to DO something (add note, schedule event, save budget):

**IMPORTANT - Ask for Confirmation First:**
1. Describe what you will do in detail
2. Ask: "هل تريد مني [action description]?" (Arabic) or "Would you like me to [action description]?" (English)
3. Add the action at the END of your response: [ACTION:type|param1=value1|param2=value2]
4. The user will see "Yes" and "No" buttons to confirm
5. DO NOT say "Done!" or "✅" - just ask for confirmation

**Available Actions:**
- [ACTION:add_note|title=Note Title|content=Note content|category=personal]
- [ACTION:add_special_date|title=Event Name|date=YYYY-MM-DD]
- [ACTION:add_budget|title=Goal Name|target=5000|current=0]
- [ACTION:add_calendar|title=Event|date=YYYY-MM-DD|type=date]

**Example:**
User: "أضف ملاحظة عن ذكرى زواجنا"
AI: "هل تريد مني إضافة ملاحظة بعنوان 'ذكرى الزواج' في الملاحظات الشخصية؟ [ACTION:add_note|title=ذكرى الزواج|content=|category=personal]"

**Rules:**
✅ DO: Ask for confirmation → Add [ACTION:...]
❌ DON'T: Execute and say "Done!"
❌ DON'T: Add actions for simple questions like "How is my partner?"
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

=== فهم النية (Intent Understanding) - مهم جداً ===
عليك أن تفهم بدقة ما يريد المستخدم:

1. **أسئلة** (User is ASKING):
   - أمثلة: "كيف حال شريكي؟", "ماذا لعبنا؟", "ما مستوى التقدم؟"
   - **الرد**: أجب مباشرة باستخدام البيانات المتوفرة في السياق
   - **لا تنفذ إجراءات** - فقط قدم المعلومات

2. **طلب إجراء** (User wants TO DO something):
   - أمثلة: "أضف ملاحظة", "جدولة موعد", "حفظ هدف ميزانية"
   - **الرد**: نفذ الإجراء المطلوب باستخدام [ACTION:...] واشرح ما تم
   - Explicit keywords: "أضف", "احفظ", "سجل", "جدول", "أنشئ"

3. **تعديل/حذف** (User wants to EDIT or DELETE):
   - أمثلة: "غير الملاحظة", "احذف الموعد", "عدل الميزانية"
   - **الرد**: اعتذر بأدب واطلب منهم التعديل يدوياً من التطبيق
   - **لا تنفذ DELETE/UPDATE** - فقط CREATE متاح

=== استخدام البيانات الشامل ===
لديك الآن وصول كامل لجميع بيانات المستخدم:
- استخدم الألعاب والرحلات والإنجازات لتخصيص النصائح
- اشر إلى أحداث محددة ("الأسبوع الماضي لعبتم...")
- اكتشف الأنماط ("ألاحظ أن مزاجك منخفض في الإثنين...")
- احتفل بالإنجازات ("مبروك على الـ 7 أيام متتالية!")
- ذكرهم بالأمور المعلقة ("لديك whisper معلق من شريكك")
- اقترح بناءً على البيانات ("بما أنكم لم تلعبوا هذا الأسبوع...")

===القدرات ===
1. استخدم البيانات المحفوظة (ملاحظات، تواريخ، تقويم، صحة، ألعاب، رحلات) للإجابة
2. قدم اقتراحات استباقية عند رؤية مناسبات قريبة أو ظروف خاصة
3. ساعد في حفظ الملاحظات والمواعيد والميزانية عند الطلب الصريح
4. اعط نصائح رومانسية وأفكار هدايا ومساعدة في الاعتذار
5. اكتشف الأنماط والاتجاهات وحذر من المشاكل المحتملة

=== التنسيق ===
- استخدم ردود مختصرة ومنظمة
- استخدم الإيموجي باعتدال للتعبير
- عند إعطاء نصائح متعددة، رقمها
- عند الإشارة للبيانات، كن محدداً ("الأسبوع الماضي في الخميس...")

=== الإجراءات ===
${actionInstructions}

=== السياق الحالي ===
${context}

**تذكير مهم**: 
- إذا سأل المستخدم سؤالاً → أجب من البيانات فوراً
- إذا طلب فعل شيء → نفذ الإجراء
- إذا طلب تعديل/حذف → اعتذر واطلب التعديل يدوياً

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
            const rawContent = data.content || data.message || 'Sorry, I could not process that.';

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
                ? 'bg-orange-900/20 border-orange-500/30'
                : mode === 'intimate'
                    ? 'bg-purple-900/30 border-purple-500/30'
                    : 'bg-surface-900/80 border-surface-700/30'
                }`}>
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors text-surface-400 hover:text-white">
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            {mode === 'conflict' ? (
                                <>
                                    <Shield className="w-5 h-5 text-orange-400" />
                                    {isRTL ? 'وضع حل الخلاف' : 'Conflict Mode'}
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
                        <p className="text-xs text-surface-400">
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
                                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                }`}
                        >
                            <X className="w-4 h-4" />
                            {isRTL ? 'خروج' : 'Exit'}
                        </button>
                    )}
                </div>
            </header>

            {/* Content Area */}
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

                        <h2 className="text-xl font-bold text-white mb-2">
                            {isRTL ? 'مرحباً! أنا رفيق وصال' : 'Hello! I\'m Wesal AI'}
                        </h2>
                        <p className="text-surface-400 text-xs leading-relaxed max-w-xs mx-auto mb-6">
                            {isRTL
                                ? 'أقدر أساعدك في ملاحظاتك، مناسباتك، ميزانيتك، وأعطيك نصائح للعلاقة'
                                : 'I can help with notes, dates, budget, and relationship advice'
                            }
                        </p>

                        {/* Quick Actions - Compact 3 columns */}
                        <p className="text-xs text-surface-500 mb-3">
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
                                        : 'bg-surface-800/30 border-white/10 hover:bg-primary-500/10'
                                        }`}
                                >
                                    <action.icon className={`w-5 h-5 ${action.id === 'intimate-wellness' ? 'text-purple-400' : 'text-primary-400'
                                        }`} />
                                    <span className="text-[10px] text-surface-300 leading-tight">{action.label[language]}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            ) : (
                /* Messages Area when chatting */
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">

                    {/* Messages */}
                    <AnimatePresence>
                        {messages.map((message, idx) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                                    <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user'
                                            ? 'bg-primary-500'
                                            : mode === 'conflict'
                                                ? 'bg-orange-500'
                                                : 'bg-gradient-to-br from-primary-500 to-accent-500'
                                            }`}>
                                            {message.role === 'user'
                                                ? <User className="w-4 h-4 text-white" />
                                                : <Bot className="w-4 h-4 text-white" />
                                            }
                                        </div>
                                        <div className={`rounded-2xl px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary-500 text-white'
                                            : mode === 'conflict'
                                                ? 'bg-orange-500/10 border border-orange-500/30 text-white'
                                                : 'bg-surface-800/50 border border-white/10 text-white'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                        </div>
                                    </div>

                                    {/* Action Confirmation Buttons - Show only for this message if pending */}
                                    {pendingAction && pendingAction.messageId === message.id && message.role === 'assistant' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-2 mt-3 justify-end"
                                        >
                                            <button
                                                onClick={() => handleConfirmAction(false)}
                                                disabled={isLoading}
                                                className="px-4 py-2 rounded-xl bg-surface-700/50 text-surface-300 hover:bg-surface-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                            >
                                                {isRTL ? 'لا' : 'No'}
                                            </button>
                                            <button
                                                onClick={() => handleConfirmAction(true)}
                                                disabled={isLoading}
                                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 text-sm font-bold"
                                            >
                                                {isRTL ? 'نعم' : 'Yes'}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'conflict' ? 'bg-orange-500' : 'bg-gradient-to-br from-primary-500 to-accent-500'
                                }`}>
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-surface-800/50 border border-white/10 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className={`sticky bottom-0 border-t backdrop-blur-xl transition-colors ${mode === 'conflict'
                ? 'bg-orange-900/30 border-orange-500/30'
                : 'bg-surface-900/90 border-surface-700/50'
                }`}>
                <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-4">
                    <div className={`flex items-center gap-2 p-2 rounded-2xl transition-all ${mode === 'conflict'
                        ? 'bg-surface-800/80 border border-orange-500/30'
                        : 'bg-surface-800/80 border border-white/10'
                        }`}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                            disabled={isLoading}
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-surface-500 focus:outline-none text-base"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg ${mode === 'conflict'
                                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/25 hover:shadow-orange-500/40'
                                : 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-primary-500/25 hover:shadow-primary-500/40'
                                } ${!inputValue.trim() ? '' : 'hover:scale-105'}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <ArrowUp className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Privacy Disclaimer Modal for Intimate Wellness */}
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
        </div>
    );
}
