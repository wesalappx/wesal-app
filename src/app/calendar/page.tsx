'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    ArrowLeft,
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
    Sparkles,
    Droplets,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { useCalendar, ScheduledSession as DBSession } from '@/hooks/useCalendar';
import { usePairing } from '@/hooks/usePairing';
import { useHealth } from '@/hooks/useHealth';
import { useTranslation } from '@/hooks/useTranslation';

// --- Types ---
interface ScheduledSession {
    id: string;
    title: string;
    date: Date;
    time: string;
    type: 'game' | 'date' | 'checkin' | 'birthday' | 'anniversary' | 'special';
    reminder: boolean;
    isRecurring?: boolean;
}

// --- Config ---
const typeConfig = {
    game: { icon: Gamepad2, color: 'bg-indigo-500/20 text-indigo-400', gradient: 'from-indigo-500 to-violet-500', label: 'لعبة' },
    date: { icon: Heart, color: 'bg-rose-500/20 text-rose-400', gradient: 'from-rose-500 to-pink-500', label: 'موعد' },
    checkin: { icon: Check, color: 'bg-emerald-500/20 text-emerald-400', gradient: 'from-emerald-500 to-teal-500', label: 'تقييم' },
    birthday: { icon: Gift, color: 'bg-pink-500/20 text-pink-400', gradient: 'from-pink-500 to-rose-500', label: 'عيد ميلاد' },
    anniversary: { icon: Star, color: 'bg-amber-500/20 text-amber-400', gradient: 'from-amber-500 to-orange-500', label: 'ذكرى' },
    special: { icon: Sparkles, color: 'bg-purple-500/20 text-purple-400', gradient: 'from-purple-500 to-fuchsia-500', label: 'مناسبة' },
};

const arabicDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const englishDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const englishMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const mapDbTypeToLocal = (dbType: string): any => {
    switch (dbType) {
        case 'JOURNEY': return 'game';
        case 'ACTIVITY': return 'date';
        case 'CHECK_IN': return 'checkin';
        default: return 'special';
    }
};

const mapLocalTypeToDb = (localType: string): any => {
    switch (localType) {
        case 'game': return 'JOURNEY';
        case 'date': return 'ACTIVITY';
        case 'checkin': return 'CHECK_IN';
        default: return 'CUSTOM';
    }
};

export default function CalendarPage() {
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';

    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Data Hooks
    const { getSessions, createSession, deleteSession } = useCalendar();
    const { getHealthData, updateHealthData } = useHealth();
    const { getStatus } = usePairing();

    // Data State
    const [sessions, setSessions] = useState<ScheduledSession[]>([]);
    const [lastPeriodDate, setLastPeriodDate] = useState<Date | null>(null);
    const [cycleLength, setCycleLength] = useState(28);
    const [showCycleSettings, setShowCycleSettings] = useState(false);
    const [savingHealth, setSavingHealth] = useState(false);

    // --- Loading Data ---
    const refreshData = async () => {
        // 1. Fetch Shared Sessions
        const sRes = await getSessions(currentMonth);
        if (sRes.data) {
            setSessions(sRes.data.map((s: DBSession) => ({
                id: s.id,
                title: s.title,
                date: new Date(s.scheduled_date),
                time: s.scheduled_time?.slice(0, 5) || '00:00',
                type: mapDbTypeToLocal(s.type),
                reminder: s.reminder_enabled,
                isRecurring: s.is_recurring // Map DB field
            })));
        }

        // 2. Fetch Shared Health Data
        const hRes = await getHealthData();
        if (hRes.data) {
            if (hRes.data.last_period_date) setLastPeriodDate(new Date(hRes.data.last_period_date));
            if (hRes.data.cycle_length) setCycleLength(hRes.data.cycle_length);
        }
    };

    useEffect(() => {
        refreshData();
    }, [currentMonth]);

    // --- Logic: Cycle Phases ---
    const getCyclePhase = (date: Date) => {
        if (!lastPeriodDate) return null;

        // Calculate difference in days
        const diffTime = date.getTime() - lastPeriodDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Determine day within current cycle
        // If negative (date is before last period), we ignore or handle previous cycle logic roughly
        // Ideally we project phases based on cycle length modulo.

        // Simple projection for current/future
        const currentCycleDay = (diffDays % cycleLength + cycleLength) % cycleLength + 1;

        // Standard phases (approximate)
        // Menstruation: 1-5
        // Follicular: 6-11
        // Ovulation: 12-16 (Peak 14)
        // Luteal: 17-28

        if (currentCycleDay >= 1 && currentCycleDay <= 5) return { name: 'Menstruation', bg: 'bg-rose-500/20', border: 'border-rose-500/30', dot: 'bg-rose-500', label: isRTL ? 'دورة' : 'Period' };
        if (currentCycleDay >= 12 && currentCycleDay <= 16) return { name: 'Ovulation', bg: 'bg-purple-500/20', border: 'border-purple-500/30', dot: 'bg-purple-500', label: isRTL ? 'خصوبة' : 'Fertile' };
        if (currentCycleDay >= 17) return { name: 'Luteal', bg: 'bg-amber-500/5', border: '', dot: 'bg-amber-500', label: isRTL ? 'تجهيز' : 'Luteal' };

        return { name: 'Follicular', bg: 'bg-blue-500/5', border: '', dot: 'bg-blue-400', label: isRTL ? 'راحة' : 'Follicular' };
    };

    // --- Actions ---
    const handleSaveSession = async (data: any) => {
        const res = await createSession({
            title: data.title,
            type: mapLocalTypeToDb(data.type),
            scheduled_date: data.date.toISOString().split('T')[0],
            scheduled_time: data.time,
            reminder_enabled: data.reminder,
            is_recurring: data.is_recurring // Ensure this is passed
        });
        if (res.data) {
            refreshData();
            setShowAddModal(false);
        }
    };

    const handleSaveHealth = async () => {
        setSavingHealth(true);
        await updateHealthData({
            last_period_date: lastPeriodDate?.toISOString().split('T')[0] || null,
            cycle_length: cycleLength
        });
        setSavingHealth(false);
        setShowCycleSettings(false);
        refreshData(); // Re-calc phases
    };

    // --- Render Helpers ---
    const { daysInMonth, startingDay } = (() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            startingDay: new Date(year, month, 1).getDay()
        };
    })();

    const monthName = isRTL ? arabicMonths[currentMonth.getMonth()] : englishMonths[currentMonth.getMonth()];
    const dayNames = isRTL ? arabicDays : englishDays;

    return (
        <div className="min-h-screen bg-surface-950 font-sans pb-32">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    {isRTL ? <ArrowRight className="w-6 h-6 text-white" /> : <ArrowLeft className="w-6 h-6 text-white" />}
                </Link>
                <h1 className="text-lg font-bold text-white">{isRTL ? 'التقويم المشترك' : 'Shared Calendar'}</h1>
                <div onClick={() => setCurrentMonth(new Date())} className="p-2 rounded-full hover:bg-white/10 cursor-pointer">
                    <CalendarIcon className="w-5 h-5 text-primary-400" />
                </div>
            </header>

            <main className="px-4 py-4 space-y-6">

                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-surface-900 rounded-2xl p-2 border border-white/5">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-white/5 rounded-xl"><ChevronRight className={`w-5 h-5 text-white ${!isRTL && 'rotate-180'}`} /></button>
                    <div className="text-center">
                        <span className="text-lg font-bold text-white block">{monthName}</span>
                        <span className="text-xs text-surface-400">{currentMonth.getFullYear()}</span>
                    </div>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-white/5 rounded-xl"><ChevronLeft className={`w-5 h-5 text-white ${!isRTL && 'rotate-180'}`} /></button>
                </div>

                {/* Calendar Grid */}
                <div className="bg-surface-900 rounded-3xl border border-white/5 p-4 shadow-xl">
                    <div className="grid grid-cols-7 mb-4">
                        {dayNames.map((d, i) => (
                            <div key={i} className="text-center text-[10px] text-surface-400 font-medium tracking-wider uppercase">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                        {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} />)}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isSelected = selectedDate?.toDateString() === date.toDateString();

                            // Data for this day
                            const daySessions = sessions.filter(s =>
                                s.date.toDateString() === date.toDateString() ||
                                (s.isRecurring && s.date.getDate() === date.getDate() && s.date.getMonth() === date.getMonth())
                            );
                            const phase = getCyclePhase(date);

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative flex flex-col items-center justify-start pt-1 gap-1 cursor-pointer group h-14 rounded-xl transition-all border 
                                        ${phase?.bg || 'hover:bg-white/5'} 
                                        ${phase?.border || 'border-transparent'}
                                        ${isSelected ? 'ring-2 ring-primary-500 z-10' : ''}
                                    `}
                                >
                                    {/* Day Number */}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                                        ${isSelected ? 'bg-primary-500 text-white' :
                                            isToday ? 'bg-surface-700 text-primary-400' :
                                                'text-surface-300'}
                                    `}>
                                        {day}
                                    </div>

                                    {/* Indicators */}
                                    <div className="flex gap-0.5 h-1 items-end mt-auto mb-1">
                                        {daySessions.slice(0, 3).map((s, idx) => (
                                            <div key={idx} className={`w-1 h-1 rounded-full ${typeConfig[s.type]?.color.split(' ')[0].replace('/20', '')}`} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] text-surface-400">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-rose-500/50 border border-rose-500/50" />
                            <span>{isRTL ? 'دورة' : 'Period'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500/50 border border-purple-500/50" />
                            <span>{isRTL ? 'خصوبة' : 'Fertile'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                            <span>{isRTL ? 'اليوم' : 'Today'}</span>
                        </div>
                    </div>
                </div>

                {/* Selected Day Info */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">
                            {selectedDate ?
                                selectedDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' }) :
                                (isRTL ? 'تفاصيل اليوم' : 'Today Details')}
                        </h3>
                        {selectedDate && (
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-xs bg-primary-500/10 text-primary-400 px-3 py-1.5 rounded-full border border-primary-500/20">
                                <Plus className="w-3.5 h-3.5" />
                                {isRTL ? 'إضافة' : 'Add'}
                            </button>
                        )}
                    </div>

                    {selectedDate && getCyclePhase(selectedDate) && (
                        <div className={`p-4 rounded-2xl flex items-center justify-between border ${getCyclePhase(selectedDate)?.bg} ${getCyclePhase(selectedDate)?.border}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCyclePhase(selectedDate)?.dot} bg-opacity-20`}>
                                    <Activity className={`w-5 h-5 ${getCyclePhase(selectedDate)?.dot.replace('bg-', 'text-')}`} />
                                </div>
                                <div>
                                    <span className="text-xs text-surface-400 block">{isRTL ? 'الحالة الصحية' : 'Cycle Phase'}</span>
                                    <span className="text-white font-bold">{getCyclePhase(selectedDate)?.label}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowCycleSettings(true)} className="text-xs text-surface-500 underline">{isRTL ? 'تعديل' : 'Edit'}</button>
                        </div>
                    )}

                    {/* Sessions List */}
                    <div className="space-y-2">
                        {selectedDate ? (
                            (() => {
                                const selectedSessions = sessions.filter(s =>
                                    s.date.toDateString() === selectedDate.toDateString() ||
                                    (s.isRecurring && s.date.getDate() === selectedDate.getDate() && s.date.getMonth() === selectedDate.getMonth())
                                );

                                return selectedSessions.length > 0 ? (
                                    selectedSessions.map(session => {
                                        const Cfg = typeConfig[session.type] || typeConfig.special;
                                        const Icon = Cfg.icon;
                                        return (
                                            <div key={session.id} className="p-3 rounded-2xl bg-surface-900 border border-white/5 flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${Cfg.color}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-white font-bold text-sm">{session.title}</h4>
                                                        {session.isRecurring && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-surface-700">
                                                                {isRTL ? 'سنوي' : 'Yearly'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-surface-400">{session.time}</span>
                                                </div>
                                                <button onClick={() => deleteSession(session.id).then(refreshData)} className="p-2 hover:bg-red-500/10 rounded-lg group">
                                                    <Trash2 className="w-4 h-4 text-surface-600 group-hover:text-red-400 transition-colors" />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-surface-500 text-sm border border-dashed border-white/5 rounded-2xl">
                                        {isRTL ? 'لا يوجد أحداث في هذا اليوم' : 'No events for this day'}
                                    </div>
                                );
                            })()
                        ) : (
                            <div className="text-center py-8 text-surface-500 text-sm">
                                {isRTL ? 'اختر يوماً لعرض التفاصيل' : 'Select a day to view details'}
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Floating Add Button */}
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSelectedDate(new Date()); setShowAddModal(true); }}
                className="fixed bottom-24 left-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 z-30"
            >
                <Plus className="w-6 h-6 text-white" />
            </motion.button>

            {/* --- Modals --- */}

            {/* Add Session Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-surface-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4 text-center">{isRTL ? 'حدث جديد' : 'New Event'}</h3>
                            <AddSessionForm
                                date={selectedDate || new Date()}
                                onClose={() => setShowAddModal(false)}
                                onSave={handleSaveSession}
                                isRTL={isRTL}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cycle Settings Modal */}
            <AnimatePresence>
                {showCycleSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-surface-900 w-full max-w-xs rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Droplets className="w-6 h-6 text-rose-400" />
                                </div>
                                <h3 className="text-white font-bold">{isRTL ? 'إعدادات الدورة' : 'Cycle Settings'}</h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-surface-400 block mb-1">{isRTL ? 'تاريخ آخر دورة' : 'Last Period Date'}</label>
                                    <input
                                        type="date"
                                        value={lastPeriodDate ? lastPeriodDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setLastPeriodDate(new Date(e.target.value))}
                                        className="w-full bg-surface-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-surface-400 block mb-1">{isRTL ? 'متوسط الطول (أيام)' : 'Cycle Length (days)'}</label>
                                    <input
                                        type="number"
                                        value={cycleLength}
                                        onChange={(e) => setCycleLength(Number(e.target.value))}
                                        className="w-full bg-surface-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                    />
                                </div>
                            </div>

                            <button onClick={handleSaveHealth} disabled={savingHealth} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors">
                                {savingHealth ? '...' : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                            </button>
                            <button onClick={() => setShowCycleSettings(false)} className="w-full py-2 text-surface-400 text-sm hover:text-white">
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

function AddSessionForm({ date, onClose, onSave, isRTL }: any) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('20:00');
    const [type, setType] = useState('date');
    const [reminder, setReminder] = useState(true);
    const [isRecurring, setIsRecurring] = useState(false);

    // Auto-check recurring for birthday/anniversary
    useEffect(() => {
        if (type === 'birthday' || type === 'anniversary') {
            setIsRecurring(true);
        } else {
            setIsRecurring(false);
        }
    }, [type]);

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-surface-400 block mb-1">{isRTL ? 'العنوان' : 'Title'}</label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={isRTL ? 'مثال: عشاء رومانسي' : 'e.g. Dinner Date'}
                    className="w-full bg-surface-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 outline-none transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-surface-400 block mb-1">{isRTL ? 'التاريخ' : 'Date'}</label>
                    <div className="w-full bg-surface-950 border border-white/10 rounded-xl px-3 py-3 text-white text-sm opacity-60 cursor-not-allowed">
                        {date.toLocaleDateString()}
                    </div>
                </div>
                <div>
                    <label className="text-xs text-surface-400 block mb-1">{isRTL ? 'الوقت' : 'Time'}</label>
                    <input
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full bg-surface-950 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs text-surface-400 block mb-2">{isRTL ? 'النوع' : 'Type'}</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {Object.entries(typeConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = type === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setType(key)}
                                className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-all shrink-0
                                    ${isSelected ? `${cfg.color} border-current` : 'border-white/5 bg-white/5 text-surface-400'}
                                `}
                            >
                                <Icon className="w-5 h-5 mb-1" />
                                <span className="text-[10px]">{cfg.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Recurring Option */}
            <div className="flex items-center gap-3 p-3 bg-surface-950/50 rounded-xl border border-white/5">
                <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-surface-700 bg-surface-800 text-primary-500 focus:ring-primary-500/50"
                />
                <label htmlFor="isRecurring" className="text-sm text-surface-300 select-none cursor-pointer flex-1">
                    {isRTL ? 'تكرار سنوياً (أعياد، ذكرى...)' : 'Repeat Yearly (Birthday, Anniversary...)'}
                </label>
            </div>

            <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 bg-surface-800 text-surface-300 rounded-xl font-bold hover:bg-surface-700 transition-colors">
                    {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                    onClick={() => onSave({ title, date, time, type, reminder, is_recurring: isRecurring })}
                    disabled={!title}
                    className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRTL ? 'حفظ' : 'Save'}
                </button>
            </div>
        </div>
    );
}
