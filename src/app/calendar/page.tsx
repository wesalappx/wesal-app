'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    Heart,
    Gamepad2,
    Bell,
    Check,
    X,
    ChevronRight,
    ChevronLeft,
    Star,
    Gift,
    Save,
    Trash2,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useCalendar, ScheduledSession as DBSession } from '@/hooks/useCalendar';
import { usePairing } from '@/hooks/usePairing';

interface ScheduledSession {
    id: string;
    title: string;
    date: Date;
    time: string;
    type: 'game' | 'date' | 'checkin' | 'birthday' | 'anniversary' | 'special';
    reminder: boolean;
    isRecurring?: boolean;
}

const typeConfig = {
    game: { icon: Gamepad2, color: 'bg-primary-500/20 text-primary-400', gradient: 'from-primary-500 to-violet-500', label: 'لعبة' },
    date: { icon: Heart, color: 'bg-pink-500/20 text-pink-400', gradient: 'from-pink-500 to-rose-500', label: 'موعد' },
    checkin: { icon: Check, color: 'bg-emerald-500/20 text-emerald-400', gradient: 'from-emerald-500 to-teal-500', label: 'تقييم' },
    birthday: { icon: Gift, color: 'bg-rose-500/20 text-rose-400', gradient: 'from-rose-500 to-pink-500', label: 'عيد ميلاد' },
    anniversary: { icon: Heart, color: 'bg-amber-500/20 text-amber-400', gradient: 'from-amber-500 to-orange-500', label: 'ذكرى' },
    special: { icon: Star, color: 'bg-purple-500/20 text-purple-400', gradient: 'from-purple-500 to-indigo-500', label: 'مناسبة' },
};

const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// Preset holidays
const PRESET_HOLIDAYS = [
    { id: 'eid-fitr', name: 'عيد الفطر', month: 3, day: 10, type: 'special' as const, icon: '🌙' },
    { id: 'eid-adha', name: 'عيد الأضحى', month: 5, day: 17, type: 'special' as const, icon: '🐑' },
    { id: 'valentine', name: 'يوم الحب', month: 1, day: 14, type: 'date' as const, icon: '💕' },
    { id: 'mothers-day', name: 'يوم الأم', month: 2, day: 21, type: 'special' as const, icon: '👩' },
    { id: 'national-day', name: 'اليوم الوطني', month: 8, day: 23, type: 'special' as const, icon: '🇸🇦' },
];

const STORAGE_KEY_OVULATION = 'calendar_ovulation_settings';
const STORAGE_KEY_SESSIONS = 'calendar_sessions_local';

const mapDbTypeToLocal = (dbType: string): 'game' | 'date' | 'checkin' | 'birthday' | 'anniversary' | 'special' => {
    switch (dbType) {
        case 'JOURNEY': return 'game';
        case 'ACTIVITY': return 'date';
        case 'CHECK_IN': return 'checkin';
        case 'CUSTOM': return 'special';
        default: return 'date';
    }
};

const mapLocalTypeToDb = (localType: string): 'JOURNEY' | 'ACTIVITY' | 'CHECK_IN' | 'CUSTOM' => {
    switch (localType) {
        case 'game': return 'JOURNEY';
        case 'date': return 'ACTIVITY';
        case 'checkin': return 'CHECK_IN';
        default: return 'CUSTOM';
    }
};

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [sessions, setSessions] = useState<ScheduledSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [showOvulationTracker, setShowOvulationTracker] = useState(false);
    const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
    const [cycleLength, setCycleLength] = useState(28);
    const [ovulationSaved, setOvulationSaved] = useState(false);

    const { getSessions, createSession, deleteSession } = useCalendar();
    const { getStatus } = usePairing();
    const [isPaired, setIsPaired] = useState(false);

    // Load ovulation settings
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY_OVULATION);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.lastPeriodDate) setLastPeriodDate(new Date(data.lastPeriodDate));
                if (data.cycleLength) setCycleLength(data.cycleLength);
            } catch (e) { }
        }
    }, []);

    const saveOvulationSettings = () => {
        localStorage.setItem(STORAGE_KEY_OVULATION, JSON.stringify({
            lastPeriodDate: lastPeriodDate?.toISOString() || null,
            cycleLength
        }));
        setOvulationSaved(true);
        setTimeout(() => setOvulationSaved(false), 2000);
    };

    const getOvulationDates = () => {
        if (!lastPeriodDate) return { ovulation: null, fertileStart: null, fertileEnd: null };
        const ovulationDay = new Date(lastPeriodDate);
        ovulationDay.setDate(ovulationDay.getDate() + (cycleLength - 14));
        const fertileStart = new Date(ovulationDay);
        fertileStart.setDate(fertileStart.getDate() - 5);
        const fertileEnd = new Date(ovulationDay);
        fertileEnd.setDate(fertileEnd.getDate() + 1);
        return { ovulation: ovulationDay, fertileStart, fertileEnd };
    };

    const isInFertileWindow = (day: number) => {
        const { fertileStart, fertileEnd } = getOvulationDates();
        if (!fertileStart || !fertileEnd) return false;
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return checkDate >= fertileStart && checkDate <= fertileEnd;
    };

    const isOvulationDay = (day: number) => {
        const { ovulation } = getOvulationDates();
        if (!ovulation) return false;
        return day === ovulation.getDate() && currentMonth.getMonth() === ovulation.getMonth() && currentMonth.getFullYear() === ovulation.getFullYear();
    };

    // Load sessions
    useEffect(() => {
        const loadSessions = async () => {
            setIsLoadingSessions(true);
            const { isPaired: paired } = await getStatus();
            setIsPaired(paired);

            if (paired) {
                const { data } = await getSessions(currentMonth);
                if (data) {
                    setSessions(data.map((s: DBSession) => ({
                        id: s.id, title: s.title, date: new Date(s.scheduled_date),
                        time: s.scheduled_time || '20:00', type: mapDbTypeToLocal(s.type), reminder: s.reminder_enabled,
                    })));
                }
            } else {
                const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
                if (saved) {
                    try {
                        setSessions(JSON.parse(saved).map((s: any) => ({ ...s, date: new Date(s.date) })));
                    } catch (e) { }
                }
            }
            setIsLoadingSessions(false);
        };
        loadSessions();
    }, [currentMonth]);

    const saveSessionsToLocal = (newSessions: ScheduledSession[]) => {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(newSessions));
    };

    const handleAddSession = async (session: Omit<ScheduledSession, 'id'>) => {
        const newSession: ScheduledSession = { ...session, id: Date.now().toString() };
        if (isPaired) {
            const { data, error } = await createSession({
                title: session.title, type: mapLocalTypeToDb(session.type),
                scheduled_date: session.date.toISOString().split('T')[0],
                scheduled_time: session.time, reminder_enabled: session.reminder,
            });
            if (!error && data) newSession.id = data.id;
        }
        const updated = [...sessions, newSession];
        setSessions(updated);
        if (!isPaired) saveSessionsToLocal(updated);
        setShowAddModal(false);
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (isPaired) await deleteSession(sessionId);
        const updated = sessions.filter(s => s.id !== sessionId);
        setSessions(updated);
        if (!isPaired) saveSessionsToLocal(updated);
    };

    const addPresetHoliday = (preset: typeof PRESET_HOLIDAYS[0]) => {
        const year = new Date().getFullYear();
        const exists = sessions.some(s => s.title === preset.name);
        if (!exists) {
            handleAddSession({
                title: preset.name, date: new Date(year, preset.month, preset.day),
                time: '00:00', type: preset.type, reminder: true, isRecurring: true
            });
        }
    };

    const isPresetAdded = (presetName: string) => sessions.some(s => s.title === presetName);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return { daysInMonth: lastDay.getDate(), startingDay: firstDay.getDay() };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    const getSessionsForDate = (day: number) => {
        return sessions.filter(session => {
            const d = new Date(session.date);
            return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 overflow-hidden font-sans relative">
            {/* Creative Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-radial from-blue-500/15 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent rounded-full blur-3xl" />

                {/* Floating Hearts */}
                <motion.div className="absolute top-32 right-8 text-2xl opacity-20" animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }}>💕</motion.div>
                <motion.div className="absolute top-1/2 left-6 text-xl opacity-15" animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 1 }}>✨</motion.div>
                <motion.div className="absolute bottom-40 right-12 text-lg opacity-10" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 2 }}>🌙</motion.div>

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/70 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">التقويم المشترك</h1>
                        <p className="text-xs text-surface-400">خططوا لحظاتكم الخاصة معاً</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-3">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-44 relative z-10">
                {/* Month Navigator - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-white/5 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-lg"
                >
                    <button onClick={() => navigateMonth('next')} className="p-3 rounded-xl hover:bg-white/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">
                            {arabicMonths[currentMonth.getMonth()]}
                        </h2>
                        <p className="text-sm text-surface-400">{currentMonth.getFullYear()}</p>
                    </div>
                    <button onClick={() => navigateMonth('prev')} className="p-3 rounded-xl hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                </motion.div>

                {/* Calendar Grid - Creative Design */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                >
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-rose-500/10 rounded-[2rem] blur-xl" />

                    <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-2xl">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {arabicDays.map((day, i) => (
                                <div key={i} className="text-center text-xs font-bold text-primary-400 py-2">{day}</div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: startingDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const daySessions = getSessionsForDate(day);
                                const hasSession = daySessions.length > 0;
                                const today = isToday(day);
                                const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth();
                                const isFertile = isInFertileWindow(day);
                                const isOvulation = isOvulationDay(day);

                                return (
                                    <motion.button
                                        key={day}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden
                                            ${today
                                                ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30 ring-2 ring-primary-400/50'
                                                : isOvulation
                                                    ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md'
                                                    : isFertile
                                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                                        : isSelected
                                                            ? 'bg-white/10 text-white border border-white/30'
                                                            : hasSession
                                                                ? 'bg-surface-800/80 text-white border border-surface-600'
                                                                : 'text-surface-400 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`text-sm ${today ? 'font-bold' : 'font-medium'} relative z-10`}>{day}</span>
                                        {isOvulation && <Sparkles className="w-3 h-3 absolute top-1 right-1 text-white" />}
                                        {hasSession && (
                                            <div className="absolute bottom-1 flex gap-0.5">
                                                {daySessions.slice(0, 3).map((s, idx) => (
                                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${typeConfig[s.type]?.gradient || 'from-primary-400 to-primary-500'}`} />
                                                ))}
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-xs text-surface-400">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-accent-500" />
                                <span>اليوم</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-surface-400">
                                <div className="w-3 h-3 rounded-full bg-surface-700" />
                                <span>مناسبة</span>
                            </div>
                            {lastPeriodDate && (
                                <div className="flex items-center gap-1.5 text-xs text-surface-400">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                                    <span>خصوبة</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Preset Holidays - Enhanced */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl border border-amber-500/20 p-4"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white">مناسبات مهمة</h3>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" dir="rtl" style={{ scrollbarWidth: 'none' }}>
                        {PRESET_HOLIDAYS.map((preset) => {
                            const isAdded = isPresetAdded(preset.name);
                            return (
                                <motion.button
                                    key={preset.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => isAdded ? handleDeleteSession(sessions.find(s => s.title === preset.name)?.id || '') : addPresetHoliday(preset)}
                                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm whitespace-nowrap shrink-0 transition-all shadow-sm ${isAdded
                                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-primary-500/20'
                                        : 'bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/15'
                                        }`}
                                >
                                    <span className="text-base">{preset.icon}</span>
                                    <span className="font-medium">{preset.name}</span>
                                    {isAdded && <Check className="w-4 h-4" />}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>



                {/* Ovulation Tracker */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-rose-500/20 p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                            <span>🌸</span>
                            تتبع الدورة
                        </h3>
                        <button onClick={() => setShowOvulationTracker(!showOvulationTracker)} className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1 rounded-full bg-rose-500/10">
                            {showOvulationTracker ? 'إخفاء' : 'إعداد'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showOvulationTracker && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-rose-300/80 mb-1 text-right">تاريخ آخر دورة</label>
                                        <input type="date" value={lastPeriodDate ? lastPeriodDate.toISOString().split('T')[0] : ''} onChange={(e) => setLastPeriodDate(new Date(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-rose-500/30 text-white text-sm focus:ring-2 focus:ring-rose-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-rose-300/80 mb-1 text-right">طول الدورة (21-35)</label>
                                        <input type="number" value={cycleLength} onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)} min="21" max="35" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-rose-500/30 text-white text-sm focus:ring-2 focus:ring-rose-500" />
                                    </div>
                                </div>
                                <button onClick={saveOvulationSettings} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${ovulationSaved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'}`}>
                                    {ovulationSaved ? <><Check className="w-4 h-4" /> تم الحفظ</> : <><Save className="w-4 h-4" /> حفظ</>}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Upcoming Sessions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-400" />
                        القادم
                    </h3>

                    {sessions.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                            <CalendarIcon className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                            <p className="text-surface-400">لا توجد مناسبات مجدولة</p>
                            <p className="text-xs text-surface-500 mt-1">أضف مناسبتك الأولى!</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {sessions.slice(0, 5).map((session, index) => {
                                const config = typeConfig[session.type];
                                if (!config) return null;
                                const TypeIcon = config.icon;
                                const sessionDate = new Date(session.date);

                                return (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 group hover:border-primary-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-lg`}>
                                                <TypeIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-bold text-white">{session.title}</h4>
                                                <p className="text-sm text-surface-400 mt-0.5">
                                                    {sessionDate.getDate()} {arabicMonths[sessionDate.getMonth()]}
                                                    {session.time !== '00:00' && ` • ${session.time}`}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteSession(session.id)} className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </main>

            {/* FAB */}
            <div className="fixed bottom-28 left-6 z-40">
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white flex items-center justify-center shadow-xl shadow-primary-500/30"
                >
                    <Plus className="w-7 h-7" />
                </motion.button>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddSessionModal onClose={() => setShowAddModal(false)} onAdd={handleAddSession} initialDate={selectedDate} />
                )}
            </AnimatePresence>
        </div>
    );
}

function AddSessionModal({ onClose, onAdd, initialDate }: { onClose: () => void; onAdd: (session: Omit<ScheduledSession, 'id'>) => void; initialDate?: Date | null; }) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(initialDate ? initialDate.toISOString().split('T')[0] : '');
    const [time, setTime] = useState('20:00');
    const [type, setType] = useState<'game' | 'date' | 'checkin' | 'birthday' | 'anniversary' | 'special'>('date');
    const [reminder, setReminder] = useState(true);
    const [isRecurring, setIsRecurring] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date) return;
        onAdd({ title, date: new Date(date), time, type, reminder, isRecurring });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-lg" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="relative w-full max-w-md bg-surface-900 rounded-3xl p-6 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 z-10"><X className="w-5 h-5 text-surface-400" /></button>
                <h3 className="text-xl font-bold text-white mb-6 text-right">إضافة مناسبة</h3>
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2 text-right">العنوان</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-right placeholder-surface-500 focus:ring-2 focus:ring-primary-500" placeholder="مثال: عشاء رومانسي" dir="rtl" autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2 text-right">النوع</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['date', 'birthday', 'anniversary', 'special', 'game', 'checkin'] as const).map((t) => {
                                const config = typeConfig[t];
                                const TypeIcon = config.icon;
                                return (
                                    <button key={t} type="button" onClick={() => { setType(t); if (t === 'birthday' || t === 'anniversary') setIsRecurring(true); }} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${type === t ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-white/5 border-transparent text-surface-400 hover:bg-white/10'}`}>
                                        <TypeIcon className="w-5 h-5" />
                                        <span className="text-xs">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-surface-300 mb-2 text-right">التاريخ</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm text-surface-300 mb-2 text-right">الوقت</label>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <button type="button" onClick={() => setReminder(!reminder)} className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${reminder ? 'bg-primary-500 justify-end' : 'bg-surface-600 justify-start'}`}>
                            <motion.div layout className="w-5 h-5 bg-white rounded-full shadow" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                        </button>
                        <label className="flex items-center gap-2 text-white text-sm"><span>تذكير</span><Bell className="w-4 h-4 text-primary-400" /></label>
                    </div>
                    {(type === 'birthday' || type === 'anniversary' || type === 'special') && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                            <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${isRecurring ? 'bg-amber-500 justify-end' : 'bg-surface-600 justify-start'}`}>
                                <motion.div layout className="w-5 h-5 bg-white rounded-full shadow" transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                            </button>
                            <label className="flex items-center gap-2 text-white text-sm"><span>تكرار سنوي</span><CalendarIcon className="w-4 h-4 text-amber-400" /></label>
                        </div>
                    )}
                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 rounded-xl text-white font-bold text-lg shadow-lg">حفظ</button>
                </form>
            </motion.div>
        </div>
    );
}
