'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Plus, X, StickyNote, Heart, Wallet, Star, Map,
    Calendar, Trash2, Pin, PinOff, Edit3, Check, Gift, Cake, Sparkles
} from 'lucide-react';
import { useNotes, Note, SpecialDate, BudgetGoal } from '@/hooks/useNotes';
import { useTranslation } from '@/hooks/useTranslation';

const categoryConfig = {
    general: { icon: StickyNote, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
    journey: { icon: Map, color: 'text-purple-400', bg: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' },
    budget: { icon: Wallet, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
    wishlist: { icon: Star, color: 'text-amber-400', bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30' },
    memories: { icon: Heart, color: 'text-rose-400', bg: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30' },
};

const dateTypeConfig = {
    birthday: { icon: Cake, color: 'text-pink-400', label: { ar: 'عيد ميلاد', en: 'Birthday' } },
    anniversary: { icon: Heart, color: 'text-rose-400', label: { ar: 'ذكرى سنوية', en: 'Anniversary' } },
    first_date: { icon: Sparkles, color: 'text-amber-400', label: { ar: 'أول موعد', en: 'First Date' } },
    first_kiss: { icon: Heart, color: 'text-red-400', label: { ar: 'أول قبلة', en: 'First Kiss' } },
    wedding: { icon: Gift, color: 'text-purple-400', label: { ar: 'زواج', en: 'Wedding' } },
    custom: { icon: Calendar, color: 'text-blue-400', label: { ar: 'مخصص', en: 'Custom' } },
};

type Tab = 'notes' | 'dates' | 'budget';

export default function NotesPage() {
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';
    const {
        notes, specialDates, budgetGoals, loading,
        createNote, updateNote, deleteNote,
        createSpecialDate, updateSpecialDate, deleteSpecialDate,
        createBudgetGoal, updateBudgetGoal, deleteBudgetGoal
    } = useNotes();

    const [activeTab, setActiveTab] = useState<Tab>('notes');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editingDate, setEditingDate] = useState<SpecialDate | null>(null);
    const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null);

    // Add Note Modal State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState<Note['category']>('general');

    // Add Date Modal State
    const [newDateTitle, setNewDateTitle] = useState('');
    const [newDateDate, setNewDateDate] = useState('');
    const [newDateType, setNewDateType] = useState<SpecialDate['event_type']>('custom');

    // Add Budget Modal State
    const [newBudgetTitle, setNewBudgetTitle] = useState('');
    const [newBudgetAmount, setNewBudgetAmount] = useState('');

    const handleSaveNote = async () => {
        if (!newTitle.trim()) return;

        if (editingNote) {
            await updateNote(editingNote.id, { title: newTitle, content: newContent, category: newCategory });
        } else {
            await createNote(newTitle, newContent, newCategory);
        }

        resetModal();
    };

    const handleSaveDate = async () => {
        if (!newDateTitle.trim() || !newDateDate) return;

        if (editingDate) {
            await updateSpecialDate(editingDate.id, {
                title: newDateTitle,
                event_date: newDateDate,
                event_type: newDateType
            });
        } else {
            await createSpecialDate(newDateTitle, newDateDate, newDateType);
        }
        resetModal();
    };

    const handleSaveBudget = async () => {
        if (!newBudgetTitle.trim() || !newBudgetAmount) return;

        if (editingBudget) {
            await updateBudgetGoal(editingBudget.id, {
                title: newBudgetTitle,
                target_amount: parseFloat(newBudgetAmount)
            });
        } else {
            await createBudgetGoal(newBudgetTitle, parseFloat(newBudgetAmount));
        }
        resetModal();
    };

    const resetModal = () => {
        setShowAddModal(false);
        setEditingNote(null);
        setEditingDate(null);
        setEditingBudget(null);
        setNewTitle('');
        setNewContent('');
        setNewCategory('general');
        setNewDateTitle('');
        setNewDateDate('');
        setNewDateType('custom');
        setNewBudgetTitle('');
        setNewBudgetAmount('');
    };

    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateStr);

        // For recurring dates, find next occurrence
        const thisYear = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const nextYear = new Date(today.getFullYear() + 1, eventDate.getMonth(), eventDate.getDate());

        const targetDate = thisYear >= today ? thisYear : nextYear;
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const tabs = [
        { id: 'notes' as Tab, label: isRTL ? 'ملاحظات' : 'Notes', icon: StickyNote, count: notes.length },
        { id: 'dates' as Tab, label: isRTL ? 'مناسبات' : 'Dates', icon: Calendar, count: specialDates.length },
        { id: 'budget' as Tab, label: isRTL ? 'ميزانية' : 'Budget', icon: Wallet, count: budgetGoals.length },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 font-sans">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="max-w-md mx-auto p-4 pb-32 relative z-10">
                {/* Header */}
                <header className="flex items-center justify-between mb-6 pt-4">
                    <Link href="/dashboard" className="p-2 -ml-2 text-surface-400 hover:text-white transition-colors">
                        {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-primary-400" />
                        {isRTL ? 'ملاحظاتنا' : 'Our Notes'}
                    </h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 px-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'bg-surface-800/50 text-surface-400 hover:bg-surface-700 border border-white/5'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface-700'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center py-20"
                        >
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <div className="space-y-3">
                                    {notes.length === 0 ? (
                                        <div className="glass-card p-8 text-center">
                                            <StickyNote className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                                            <p className="text-surface-400">{isRTL ? 'لا توجد ملاحظات بعد' : 'No notes yet'}</p>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm"
                                            >
                                                {isRTL ? 'أضف أول ملاحظة' : 'Add first note'}
                                            </button>
                                        </div>
                                    ) : (
                                        notes.map((note, idx) => {
                                            const config = categoryConfig[note.category];
                                            const Icon = config.icon;
                                            return (
                                                <motion.div
                                                    key={note.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`glass-card p-4 border ${config.border} bg-gradient-to-br ${config.bg}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-10 h-10 rounded-xl bg-surface-800/50 flex items-center justify-center ${config.color}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                {note.is_pinned && <Pin className="w-3 h-3 text-amber-400" />}
                                                                <h3 className="font-bold text-white truncate">{note.title}</h3>
                                                            </div>
                                                            {note.content && (
                                                                <p className="text-sm text-surface-300 mt-1 line-clamp-2">{note.content}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => updateNote(note.id, { is_pinned: !note.is_pinned })}
                                                                className="p-2 text-surface-500 hover:text-amber-400 transition-colors"
                                                            >
                                                                {note.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingNote(note);
                                                                    setNewTitle(note.title);
                                                                    setNewContent(note.content || '');
                                                                    setNewCategory(note.category);
                                                                    setShowAddModal(true);
                                                                }}
                                                                className="p-2 text-surface-500 hover:text-white transition-colors"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteNote(note.id)}
                                                                className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Dates Tab */}
                            {activeTab === 'dates' && (
                                <div className="space-y-3">
                                    {specialDates.length === 0 ? (
                                        <div className="glass-card p-8 text-center">
                                            <Calendar className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                                            <p className="text-surface-400">{isRTL ? 'لا توجد مناسبات' : 'No special dates'}</p>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm"
                                            >
                                                {isRTL ? 'أضف مناسبة' : 'Add date'}
                                            </button>
                                        </div>
                                    ) : (
                                        specialDates.map((date, idx) => {
                                            const config = dateTypeConfig[date.event_type];
                                            const Icon = config.icon;
                                            const daysUntil = getDaysUntil(date.event_date);
                                            return (
                                                <motion.div
                                                    key={date.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="glass-card p-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center ${config.color}`}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-white">{date.title}</h3>
                                                            <p className="text-sm text-surface-400">
                                                                {new Date(date.event_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingDate(date);
                                                                    setNewDateTitle(date.title);
                                                                    setNewDateDate(date.event_date);
                                                                    setNewDateType(date.event_type);
                                                                    setShowAddModal(true);
                                                                }}
                                                                className="p-2 text-surface-500 hover:text-white transition-colors"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSpecialDate(date.id)}
                                                                className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Budget Tab */}
                            {activeTab === 'budget' && (
                                <div className="space-y-3">
                                    {budgetGoals.length === 0 ? (
                                        <div className="glass-card p-8 text-center">
                                            <Wallet className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                                            <p className="text-surface-400">{isRTL ? 'لا توجد أهداف' : 'No budget goals'}</p>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm"
                                            >
                                                {isRTL ? 'أضف هدف' : 'Add goal'}
                                            </button>
                                        </div>
                                    ) : (
                                        budgetGoals.map((goal, idx) => {
                                            const progress = (goal.current_amount / goal.target_amount) * 100;
                                            return (
                                                <motion.div
                                                    key={goal.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="glass-card p-4"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="font-bold text-white">{goal.title}</h3>
                                                        <span className="text-green-400 font-bold">
                                                            {goal.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-surface-700 rounded-full overflow-hidden mb-3">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(progress, 100)}%` }}
                                                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder={isRTL ? 'أضف مبلغ' : 'Add amount'}
                                                            className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    const input = e.target as HTMLInputElement;
                                                                    const amount = parseFloat(input.value);
                                                                    if (amount > 0) {
                                                                        updateBudgetGoal(goal.id, { current_amount: goal.current_amount + amount });
                                                                        input.value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    const input = document.querySelector(`input[placeholder="${isRTL ? 'أضف مبلغ' : 'Add amount'}"]`) as HTMLInputElement;
                                                                    const amount = parseFloat(input?.value || '0');
                                                                    if (amount > 0) {
                                                                        updateBudgetGoal(goal.id, { current_amount: goal.current_amount + amount });
                                                                        if (input) input.value = '';
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingBudget(goal);
                                                                    setNewBudgetTitle(goal.title);
                                                                    setNewBudgetAmount(goal.target_amount.toString());
                                                                    setShowAddModal(true);
                                                                }}
                                                                className="p-2 text-surface-500 hover:text-white transition-colors"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteBudgetGoal(goal.id)}
                                                                className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={resetModal}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            onClick={e => e.stopPropagation()}
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className="w-full sm:max-w-sm bg-surface-900 border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">
                                    {editingNote
                                        ? (isRTL ? 'تعديل الملاحظة' : 'Edit Note')
                                        : editingDate
                                            ? (isRTL ? 'تعديل المناسبة' : 'Edit Date')
                                            : editingBudget
                                                ? (isRTL ? 'تعديل الهدف' : 'Edit Goal')
                                                : activeTab === 'notes'
                                                    ? (isRTL ? 'ملاحظة جديدة' : 'New Note')
                                                    : activeTab === 'dates'
                                                        ? (isRTL ? 'مناسبة جديدة' : 'New Date')
                                                        : (isRTL ? 'هدف جديد' : 'New Goal')
                                    }
                                </h2>
                                <button onClick={resetModal} className="p-2 text-surface-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Note Form */}
                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'العنوان' : 'Title'}
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                    <textarea
                                        placeholder={isRTL ? 'المحتوى (اختياري)' : 'Content (optional)'}
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                        rows={3}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
                                    />
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.entries(categoryConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setNewCategory(key as Note['category'])}
                                                className={`p-3 rounded-xl border transition-all ${newCategory === key
                                                    ? `${config.border} bg-gradient-to-br ${config.bg}`
                                                    : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <config.icon className={`w-5 h-5 mx-auto ${config.color}`} />
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSaveNote}
                                        disabled={!newTitle.trim()}
                                        className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {editingNote ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add')}
                                    </button>
                                </div>
                            )}

                            {/* Date Form */}
                            {activeTab === 'dates' && !editingNote && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'اسم المناسبة' : 'Event name'}
                                        value={newDateTitle}
                                        onChange={e => setNewDateTitle(e.target.value)}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                    <input
                                        type="date"
                                        value={newDateDate}
                                        onChange={e => setNewDateDate(e.target.value)}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(dateTypeConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setNewDateType(key as SpecialDate['event_type'])}
                                                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${newDateType === key
                                                    ? 'border-primary-500 bg-primary-500/10'
                                                    : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <config.icon className={`w-5 h-5 ${config.color}`} />
                                                <span className="text-xs text-surface-300">{config.label[language]}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSaveDate}
                                        disabled={!newDateTitle.trim() || !newDateDate}
                                        className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {editingDate ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add')}
                                    </button>
                                </div>
                            )}

                            {/* Budget Form */}
                            {activeTab === 'budget' && !editingNote && (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'اسم الهدف' : 'Goal name'}
                                        value={newBudgetTitle}
                                        onChange={e => setNewBudgetTitle(e.target.value)}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                    <input
                                        type="number"
                                        placeholder={isRTL ? 'المبلغ المستهدف' : 'Target amount'}
                                        value={newBudgetAmount}
                                        onChange={e => setNewBudgetAmount(e.target.value)}
                                        className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    />
                                    <button
                                        onClick={handleSaveBudget}
                                        disabled={!newBudgetTitle.trim() || !newBudgetAmount}
                                        className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {editingBudget ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إضافة' : 'Add')}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
