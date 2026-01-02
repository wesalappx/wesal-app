'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Gamepad2, Check, Gift, Star, Sparkles, Moon, Droplets,
    ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, Settings2, Trash2, Clock, Edit3,
    ArrowRight, ArrowLeft, Calendar as CalendarIcon, Plus, X
} from 'lucide-react';
import { useCalendar, ScheduledSession } from '@/hooks/useCalendar';
import { useHealth } from '@/hooks/useHealth';
import { usePairing } from '@/hooks/usePairing';
import { useTranslation } from '@/hooks/useTranslation';

// --- Types ---
interface ScheduledEvent {
    id: string;
    title: string;
    date: Date;
    time?: string;
    type: string;
    reminder: boolean;
    isRecurring?: boolean;
}

interface DBSession {
    id: string;
    title: string;
    type: string;
    scheduled_date: string;
    scheduled_time?: string;
    reminder_enabled: boolean;
    is_recurring?: boolean;
    [key: string]: any;
}

// --- Config ---
const typeConfig: Record<string, { icon: any; color: string; bgColor: string; gradient: string; label: string; labelEn: string }> = {
    game: { icon: Gamepad2, color: 'text-indigo-400', bgColor: 'bg-indigo-500', gradient: 'from-indigo-500 to-violet-500', label: 'لعبة', labelEn: 'Game' },
    date: { icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500', gradient: 'from-rose-500 to-pink-500', label: 'موعد', labelEn: 'Date' },
    checkin: { icon: Check, color: 'text-emerald-400', bgColor: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500', label: 'تقييم', labelEn: 'Check-in' },
    birthday: { icon: Gift, color: 'text-pink-400', bgColor: 'bg-pink-500', gradient: 'from-pink-500 to-rose-500', label: 'عيد ميلاد', labelEn: 'Birthday' },
    anniversary: { icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500', label: 'ذكرى', labelEn: 'Anniversary' },
    special: { icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500', gradient: 'from-purple-500 to-fuchsia-500', label: 'مناسبة', labelEn: 'Special' },
};

// Special Days (Auto-detected)
const specialDays = [
    { month: 1, day: 14, nameAr: 'عيد الحب', nameEn: "Valentine's Day", icon: Heart, color: 'text-rose-500' },
    { month: 11, day: 31, nameAr: 'رأس السنة', nameEn: "New Year's Eve", icon: Sparkles, color: 'text-amber-500' },
];

const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const englishMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const mapDbTypeToLocal = (dbType: string): string => {
    switch (dbType) {
        case 'JOURNEY': return 'game';
        case 'ACTIVITY': return 'date';
        case 'CHECK_IN': return 'checkin';
        default: return 'special';
    }
};

const mapLocalTypeToDb = (localType: string): string => {
    switch (localType) {
        case 'game': return 'JOURNEY';
        case 'date': return 'ACTIVITY';
        case 'checkin': return 'CHECK_IN';
        default: return 'CUSTOM';
    }
};

// --- Main Component ---
export default function CalendarPage() {
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';

    // State
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
    const [showCycleSettings, setShowCycleSettings] = useState(false);
    const [showPeriodTracking, setShowPeriodTracking] = useState(true); // Toggle for period visibility

    // Data Hooks
    const { getSessions, createSession, deleteSession, updateSession } = useCalendar();
    const { getHealthData, updateHealthData, isLoading: healthLoading } = useHealth();

    // Data State
    const [sessions, setSessions] = useState<ScheduledEvent[]>([]);
    const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
    const [cycleLength, setCycleLength] = useState(28);
    const [savingHealth, setSavingHealth] = useState(false);

    // --- Data Loading ---
    const refreshData = async () => {
        const sRes = await getSessions(currentMonth);
        if (sRes.data) {
            setSessions(sRes.data.map((s: DBSession) => ({
                id: s.id,
                title: s.title,
                date: new Date(s.scheduled_date),
                time: s.scheduled_time?.slice(0, 5) || '',
                type: mapDbTypeToLocal(s.type),
                reminder: s.reminder_enabled,
                isRecurring: s.is_recurring
            })));
        }

        const hRes = await getHealthData();
        if (hRes.data) {
            if (hRes.data.last_period_date) setLastPeriodDate(new Date(hRes.data.last_period_date));
            if (hRes.data.cycle_length) setCycleLength(hRes.data.cycle_length);
        }
    };

    useEffect(() => {
        refreshData();
    }, [currentMonth]);

    // --- Cycle Phase Calculation ---
    const getCyclePhase = (date: Date): { phase: string; color: string; bgColor: string; borderColor: string } | null => {
        // Return null if period tracking is hidden
        if (!showPeriodTracking) return null;
        if (!lastPeriodDate) return null;

        const diffTime = date.getTime() - lastPeriodDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return null;

        const dayInCycle = (diffDays % cycleLength) + 1;

        // Menstruation: Days 1-5
        if (dayInCycle <= 5) {
            return {
                phase: isRTL ? 'الدورة' : 'Period',
                color: 'text-rose-400',
                bgColor: 'bg-rose-500/20',
                borderColor: 'border-rose-500/40'
            };
        }

        // Ovulation: Days 12-16 (fertile window)
        if (dayInCycle >= 12 && dayInCycle <= 16) {
            return {
                phase: isRTL ? 'فترة الخصوبة' : 'Fertile',
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/20',
                borderColor: 'border-emerald-500/40'
            };
        }

        return null;
    };

    // --- Calendar Grid Generation ---
    const generateMonthDays = (month: Date) => {
        const year = month.getFullYear();
        const monthNum = month.getMonth();
        const firstDay = new Date(year, monthNum, 1);
        const lastDay = new Date(year, monthNum + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayIndex = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty slots for days before the first of the month
        for (let i = 0; i < startingDayIndex; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, monthNum, day));
        }

        return days;
    };

    const monthDays = useMemo(() => generateMonthDays(currentMonth), [currentMonth]);

    // --- Navigation ---
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    };

    const nextYear = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    };

    // --- Get Events for a Day ---
    const getEventsForDay = (date: Date) => {
        return sessions.filter(s =>
            s.date.getDate() === date.getDate() &&
            s.date.getMonth() === date.getMonth() &&
            s.date.getFullYear() === date.getFullYear()
        );
    };

    // --- Check for Special Days ---
    const getSpecialDay = (date: Date) => {
        return specialDays.find(sd => sd.month === date.getMonth() && sd.day === date.getDate());
    };

    // --- Is Today ---
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // --- Save Health Data ---
    const handleSaveHealth = async () => {
        setSavingHealth(true);
        await updateHealthData({
            last_period_date: lastPeriodDate?.toISOString().split('T')[0] || null,
            cycle_length: cycleLength
        });
        setSavingHealth(false);
        setShowCycleSettings(false);
    };

    // --- Add Event ---
    const handleAddEvent = async (data: { title: string; type: string; time: string; isRecurring: boolean; eventDate: Date }) => {
        if (editingEvent) {
            await updateSession(editingEvent.id, {
                title: data.title,
                type: mapLocalTypeToDb(data.type) as any,
                scheduled_date: data.eventDate.toISOString().split('T')[0],
                scheduled_time: data.time || undefined,
                is_recurring: data.isRecurring
            });
        } else {
            await createSession({
                title: data.title,
                type: mapLocalTypeToDb(data.type) as any,
                scheduled_date: data.eventDate.toISOString().split('T')[0],
                scheduled_time: data.time || undefined,
                reminder_enabled: true,
                is_recurring: data.isRecurring
            });
        }

        await refreshData();
        setShowAddModal(false);
        setEditingEvent(null);
    };

    // --- Delete Event ---
    const handleDeleteEvent = async (eventId: string) => {
        await deleteSession(eventId);
        await refreshData();
    };

    // --- Day Names ---
    const dayNames = isRTL ? arabicDays : englishDays;
    const monthNames = isRTL ? arabicMonths : englishMonths;

    return (
        <div className={`min-h-screen font-sans ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            <div className="max-w-md mx-auto p-4 pb-32">

                <header className="flex items-center justify-between mb-6 pt-4">
                    <Link href="/dashboard" className={`p-2 -ml-2 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-surface-400 hover:text-white'}`}>
                        <ArrowRight className={`w-6 h-6 ${isRTL ? '' : 'rotate-180'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        <CalendarIcon className="w-5 h-5 text-primary-400" />
                        {isRTL ? 'التقويم' : 'Calendar'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="p-2 text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowCycleSettings(true)}
                            className={`p-2 transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-surface-400 hover:text-white'}`}
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* View Toggle */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'month'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : theme === 'light' ? 'bg-white text-slate-500 hover:bg-slate-50' : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        {isRTL ? 'شهري' : 'Month'}
                    </button>
                    <button
                        onClick={() => setViewMode('year')}
                        className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${viewMode === 'year'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : theme === 'light' ? 'bg-white text-slate-500 hover:bg-slate-50' : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700'
                            }`}
                    >
                        <Grid3X3 className="w-4 h-4" />
                        {isRTL ? 'سنوي' : 'Year'}
                    </button>
                </div>

                {/* Period Tracking Toggle */}
                <div className="mb-4">
                    <button
                        onClick={() => setShowPeriodTracking(!showPeriodTracking)}
                        className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${showPeriodTracking
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : theme === 'light'
                                ? 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-200'
                                : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700 border border-white/5'
                            }`}
                    >
                        {showPeriodTracking ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                {isRTL ? 'إخفاء متابعة الدورة' : 'Hide Period Tracking'}
                            </>
                        ) : (
                            <>
                                <span className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-slate-300' : 'bg-surface-500'}`}></span>
                                {isRTL ? 'إظهار متابعة الدورة' : 'Show Period Tracking'}
                            </>
                        )}
                    </button>
                </div>

                {/* Month View */}
                <AnimatePresence mode="wait">
                    {viewMode === 'month' && (
                        <motion.div
                            key="month-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Month Navigation */}
                            <div className={`${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'glass-card'} p-4 mb-4 rounded-2xl`}>
                                <div className="flex items-center justify-between">
                                    <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                        <ChevronRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'} ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                    </button>
                                    <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </h2>
                                    <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                        <ChevronLeft className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'} ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className={`${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'glass-card'} p-4 mb-4 rounded-2xl`}>
                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {dayNames.map(day => (
                                        <div key={day} className={`text-center text-xs font-medium py-2 ${theme === 'light' ? 'text-slate-400' : 'text-surface-500'}`}>
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Day Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {monthDays.map((date, idx) => {
                                        if (!date) {
                                            return <div key={`empty-${idx}`} className="aspect-square" />;
                                        }

                                        const cyclePhase = getCyclePhase(date);
                                        const events = getEventsForDay(date);
                                        const special = getSpecialDay(date);
                                        const today = isToday(date);
                                        const isSelected = selectedDate?.getDate() === date.getDate() &&
                                            selectedDate?.getMonth() === date.getMonth();

                                        return (
                                            <motion.button
                                                key={date.toISOString()}
                                                onClick={() => setSelectedDate(date)}
                                                whileTap={{ scale: 0.95 }}
                                                className={`aspect-square rounded-xl relative flex flex-col items-center justify-center transition-all border
                                                    ${cyclePhase ? `${cyclePhase.bgColor} ${cyclePhase.borderColor}` : theme === 'light' ? 'border-transparent hover:bg-slate-50' : 'border-transparent hover:bg-white/5'}
                                                    ${isSelected ? 'ring-2 ring-primary-500 !bg-primary-500/20' : ''}
                                                    ${today ? 'ring-2 ring-amber-500' : ''}
                                                `}
                                            >
                                                <span className={`text-sm font-medium ${today ? 'text-amber-500' : cyclePhase ? cyclePhase.color : theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                                                    {date.getDate()}
                                                </span>

                                                {/* Event Dots */}
                                                {events.length > 0 && (
                                                    <div className="flex gap-0.5 mt-1">
                                                        {events.slice(0, 3).map((e, i) => (
                                                            <div key={i} className={`w-1 h-1 rounded-full ${typeConfig[e.type]?.bgColor || 'bg-primary-500'}`} />
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Special Day Indicator */}
                                                {special && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <special.icon className={`w-3 h-3 ${special.color}`} />
                                                    </div>
                                                )}

                                                {/* Cycle Phase Indicator */}
                                                {cyclePhase && (
                                                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                                                        {cyclePhase.phase === (isRTL ? 'الدورة' : 'Period') ? (
                                                            <Droplets className="w-2.5 h-2.5 text-rose-400" />
                                                        ) : (
                                                            <Moon className="w-2.5 h-2.5 text-emerald-400" />
                                                        )}
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className={`${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'glass-card'} p-3 mb-4 rounded-2xl`}>
                                <div className="flex flex-wrap gap-3 justify-center text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50" />
                                        <span className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>{isRTL ? 'الدورة' : 'Period'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                                        <span className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>{isRTL ? 'خصوبة' : 'Fertile'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded ring-2 ring-amber-500" />
                                        <span className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>{isRTL ? 'اليوم' : 'Today'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Day Details */}
                            {selectedDate && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'glass-card'} p-4 rounded-2xl`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                                            </h3>
                                            <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                                {dayNames[selectedDate.getDay()]}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingEvent(null);
                                                setShowAddModal(true);
                                            }}
                                            className="p-2 bg-primary-500 rounded-xl text-white hover:bg-primary-600 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Events List */}
                                    {getEventsForDay(selectedDate).length > 0 ? (
                                        <div className="space-y-2">
                                            {getEventsForDay(selectedDate).map(event => {
                                                const cfg = typeConfig[event.type] || typeConfig.special;
                                                const Icon = cfg.icon;
                                                return (
                                                    <div key={event.id} className={`flex items-center justify-between p-3 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-800/50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${cfg.bgColor}/20`}>
                                                                <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{event.title}</p>
                                                                {event.time && (
                                                                    <p className={`text-xs flex items-center gap-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                                                        <Clock className="w-3 h-3" />
                                                                        {event.time}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEvent(event);
                                                                    setShowAddModal(true);
                                                                }}
                                                                className={`p-2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-surface-500 hover:text-white'}`}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className={`p-2 transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-red-500' : 'text-surface-500 hover:text-red-400'}`}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className={`text-center py-4 ${theme === 'light' ? 'text-slate-400' : 'text-surface-500'}`}>
                                            {isRTL ? 'لا توجد أحداث' : 'No events'}
                                        </p>
                                    )}

                                    {/* Cycle Info */}
                                    {getCyclePhase(selectedDate) && (
                                        <div className={`mt-4 p-3 rounded-xl ${getCyclePhase(selectedDate)!.bgColor} border ${getCyclePhase(selectedDate)!.borderColor}`}>
                                            <p className={`text-sm font-medium ${getCyclePhase(selectedDate)!.color}`}>
                                                {getCyclePhase(selectedDate)!.phase}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Year View */}
                    {viewMode === 'year' && (
                        <motion.div
                            key="year-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Year Navigation */}
                            <div className={`${theme === 'light' ? 'bg-white shadow-sm border border-slate-100' : 'glass-card'} p-4 mb-4 rounded-2xl`}>
                                <div className="flex items-center justify-between">
                                    <button onClick={prevYear} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                        <ChevronRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'} ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                    </button>
                                    <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                                        {currentMonth.getFullYear()}
                                    </h2>
                                    <button onClick={nextYear} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                                        <ChevronLeft className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'} ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Mini Months Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {Array.from({ length: 12 }, (_, i) => {
                                    const monthDate = new Date(currentMonth.getFullYear(), i, 1);
                                    const isCurrentMonth = i === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

                                    return (
                                        <motion.button
                                            key={i}
                                            onClick={() => {
                                                setCurrentMonth(monthDate);
                                                setViewMode('month');
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`${theme === 'light' ? 'bg-white shadow-sm hover:shadow-md' : 'glass-card'} p-3 text-center transition-all ${isCurrentMonth ? 'ring-2 ring-primary-500 !bg-primary-500/10' : ''
                                                } rounded-2xl`}
                                        >
                                            <p className={`text-sm font-bold ${isCurrentMonth ? 'text-primary-500' : theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                                                {monthNames[i]}
                                            </p>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Upcoming Events List */}
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-surface-400 mb-3 px-1">
                        {isRTL ? 'الأحداث القادمة' : 'Upcoming Events'}
                    </h3>
                    {sessions.length === 0 ? (
                        <div className="glass-card p-4 text-center">
                            <p className="text-surface-500 text-sm">
                                {isRTL ? 'لا توجد أحداث مجدولة' : 'No scheduled events'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sessions
                                .sort((a, b) => a.date.getTime() - b.date.getTime())
                                .map(event => {
                                    const config = typeConfig[event.type] || typeConfig.date;
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={event.id}
                                            className="glass-card p-3 flex items-center gap-3"
                                        >
                                            <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-medium text-sm truncate">
                                                    {event.title}
                                                </h4>
                                                <p className="text-surface-400 text-xs">
                                                    {event.date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                    {event.time && ` • ${event.time}`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddEventModal
                        date={selectedDate || new Date()}
                        initialData={editingEvent}
                        isRTL={isRTL}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingEvent(null);
                        }}
                        onSave={handleAddEvent}
                    />
                )}
            </AnimatePresence>

            {/* Cycle Settings Modal */}
            <AnimatePresence>
                {showCycleSettings && (
                    <CycleSettingsModal
                        isRTL={isRTL}
                        lastPeriodDate={lastPeriodDate}
                        cycleLength={cycleLength}
                        saving={savingHealth}
                        onClose={() => setShowCycleSettings(false)}
                        onSave={handleSaveHealth}
                        onDateChange={setLastPeriodDate}
                        onCycleLengthChange={setCycleLength}
                    />
                )}
            </AnimatePresence>

        </div>
    );
}

// --- Add Event Modal Component ---
function AddEventModal({ date, initialData, isRTL, onClose, onSave }: {
    date: Date;
    initialData: ScheduledEvent | null;
    isRTL: boolean;
    onClose: () => void;
    onSave: (data: { title: string; type: string; time: string; isRecurring: boolean; eventDate: Date }) => void;
}) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [type, setType] = useState(initialData?.type || 'date');
    const [time, setTime] = useState(initialData?.time || '');
    const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
    const [saving, setSaving] = useState(false);
    const [eventDate, setEventDate] = useState<Date>(initialData ? initialData.date : date);

    const monthNames = isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayNames = isRTL
        ? ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        await onSave({ title, type, time, isRecurring, eventDate });
        setSaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                onClick={e => e.stopPropagation()}
                dir={isRTL ? 'rtl' : 'ltr'}
                className="w-full sm:max-w-sm bg-surface-900 border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh]"
            >
                {/* Drag Handle (mobile only) */}
                <div className="flex justify-center pt-2 pb-1 sm:hidden">
                    <div className="w-8 h-1 rounded-full bg-white/30" />
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5">
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row' : 'flex-row'}`}>
                        {/* Date Badge */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
                            <span className="text-lg font-bold text-white">{date.getDate()}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-white">
                                {isRTL
                                    ? (initialData ? 'تعديل الحدث' : 'إضافة حدث')
                                    : (initialData ? 'Edit Event' : 'Add Event')}
                            </h3>
                            <p className="text-xs text-surface-400">
                                {dayNames[date.getDay()]} • {monthNames[date.getMonth()]} {date.getFullYear()}
                            </p>
                        </div>
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-lg text-surface-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form - Scrollable */}
                <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[60vh]">

                    {/* Date Picker */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-1.5">
                            {isRTL ? 'تاريخ الحدث' : 'Event Date'}
                        </label>
                        <input
                            type="date"
                            value={`${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`}
                            onChange={e => {
                                if (e.target.value) {
                                    const [year, month, day] = e.target.value.split('-').map(Number);
                                    setEventDate(new Date(year, month - 1, day));
                                }
                            }}
                            className="w-full bg-surface-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-1.5">
                            {isRTL ? 'عنوان الحدث' : 'Event Title'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={isRTL ? 'مثال: عشاء رومانسي' : 'e.g., Romantic dinner'}
                            className="w-full bg-surface-800 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-surface-500 focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Type Selection - Compact Grid */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-1.5">
                            {isRTL ? 'نوع الحدث' : 'Event Type'}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {Object.entries(typeConfig).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const isSelected = type === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setType(key)}
                                        className={`flex flex-col items-center py-2.5 px-1 rounded-lg border transition-all
                                            ${isSelected
                                                ? `${cfg.bgColor}/20 border-current ${cfg.color}`
                                                : 'border-white/5 bg-white/5 text-surface-400 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <Icon className="w-4 h-4 mb-1" />
                                        <span className="text-[10px] font-medium">
                                            {isRTL ? cfg.label : cfg.labelEn}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Input */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-1.5">
                            {isRTL ? 'الوقت' : 'Time'} <span className="text-surface-500">({isRTL ? 'اختياري' : 'optional'})</span>
                        </label>
                        <div className="relative">
                            <Clock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 ${isRTL ? 'right-3' : 'left-3'}`} />
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className={`w-full bg-surface-800 border border-white/10 rounded-lg py-2.5 text-white text-sm focus:border-primary-500 outline-none ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
                            />
                        </div>
                    </div>

                    {/* Recurring Toggle */}
                    <div
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`flex items-center justify-between p-3 bg-surface-800/50 rounded-lg border cursor-pointer transition-all ${isRecurring ? 'border-primary-500/50 bg-primary-500/10' : 'border-white/5 hover:border-white/10'}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-md ${isRecurring ? 'bg-primary-500/20' : 'bg-white/5'}`}>
                                <CalendarIcon className={`w-3.5 h-3.5 ${isRecurring ? 'text-primary-400' : 'text-surface-400'}`} />
                            </div>
                            <div>
                                <p className="text-sm text-white">{isRTL ? 'يتكرر سنوياً' : 'Yearly repeat'}</p>
                            </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-primary-500' : 'bg-surface-600'}`}>
                            <motion.div
                                initial={false}
                                animate={{
                                    x: isRecurring ? (isRTL ? -20 : 20) : 0
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md ${isRTL ? 'right-1' : 'left-1'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer - Save Button */}
                <div className="px-4 pb-4 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || saving}
                        className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                {isRTL
                                    ? (initialData ? 'حفظ التعديلات' : 'إضافة')
                                    : (initialData ? 'Save Changes' : 'Add')}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Cycle Settings Modal Component ---
function CycleSettingsModal({ isRTL, lastPeriodDate, cycleLength, saving, onClose, onSave, onDateChange, onCycleLengthChange }: {
    isRTL: boolean;
    lastPeriodDate: Date | null;
    cycleLength: number;
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
    onDateChange: (date: Date | null) => void;
    onCycleLengthChange: (length: number) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-surface-900 border border-white/10 rounded-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-500/20 rounded-xl">
                        <Droplets className="w-5 h-5 text-rose-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                        {isRTL ? 'إعدادات الدورة' : 'Cycle Settings'}
                    </h3>
                </div>

                <div className="space-y-4">
                    {/* Last Period Date */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-2">
                            {isRTL ? 'تاريخ آخر دورة' : 'Last Period Date'}
                        </label>
                        <input
                            type="date"
                            value={lastPeriodDate?.toISOString().split('T')[0] || ''}
                            onChange={e => onDateChange(e.target.value ? new Date(e.target.value) : null)}
                            className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Cycle Length */}
                    <div>
                        <label className="text-xs text-surface-400 block mb-2">
                            {isRTL ? 'طول الدورة (أيام)' : 'Cycle Length (days)'}
                        </label>
                        <input
                            type="number"
                            min={21}
                            max={35}
                            value={cycleLength}
                            onChange={e => onCycleLengthChange(parseInt(e.target.value) || 28)}
                            className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-surface-800 text-surface-400 font-medium rounded-xl hover:bg-surface-700 transition-colors"
                        >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl disabled:opacity-50"
                        >
                            {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
