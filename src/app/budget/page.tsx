'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Wallet,
    Home,
    Heart,
    Plane,
    Gift,
    MoreHorizontal,
    Check,
    Trash2,
    Edit2,
    Loader2,
    TrendingUp,
    Users
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { usePairing } from '@/hooks/usePairing';

interface BudgetItem {
    id: string;
    category: string;
    item_name: string;
    estimated_cost: number;
    actual_cost: number | null;
    paid_by: string;
    is_completed: boolean;
    notes: string | null;
}

const categories = [
    { id: 'wedding', title: 'حفل الزفاف', titleEn: 'Wedding', icon: Heart, color: 'from-rose-500 to-pink-600' },
    { id: 'mahr', title: 'المهر', titleEn: 'Mahr', icon: Gift, color: 'from-amber-500 to-orange-600' },
    { id: 'furniture', title: 'الأثاث', titleEn: 'Furniture', icon: Home, color: 'from-emerald-500 to-teal-600' },
    { id: 'honeymoon', title: 'شهر العسل', titleEn: 'Honeymoon', icon: Plane, color: 'from-cyan-500 to-blue-600' },
    { id: 'housing', title: 'السكن', titleEn: 'Housing', icon: Home, color: 'from-violet-500 to-purple-600' },
    { id: 'other', title: 'أخرى', titleEn: 'Other', icon: MoreHorizontal, color: 'from-slate-500 to-gray-600' },
];

export default function BudgetPage() {
    const router = useRouter();
    const supabase = createClient();
    const { theme } = useSettingsStore();
    const { getStatus } = usePairing();
    const isArabic = true;

    const [items, setItems] = useState<BudgetItem[]>([]);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Form state
    const [newItem, setNewItem] = useState({
        category: 'wedding',
        item_name: '',
        estimated_cost: '',
        paid_by: 'shared',
    });

    useEffect(() => {
        const init = async () => {
            const status = await getStatus();
            if (status.coupleId) {
                setCoupleId(status.coupleId);
                // Load budget items
                const { data } = await supabase
                    .from('budgets')
                    .select('*')
                    .eq('couple_id', status.coupleId)
                    .order('created_at', { ascending: false });

                if (data) setItems(data);
            }
            setIsLoading(false);
        };
        init();
    }, []);

    const handleAddItem = async () => {
        if (!coupleId || !newItem.item_name || !newItem.estimated_cost) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('budgets')
            .insert({
                couple_id: coupleId,
                created_by: user.id,
                category: newItem.category,
                item_name: newItem.item_name,
                estimated_cost: parseFloat(newItem.estimated_cost),
                paid_by: newItem.paid_by,
            })
            .select()
            .single();

        if (data) {
            setItems(prev => [data, ...prev]);
            setNewItem({ category: 'wedding', item_name: '', estimated_cost: '', paid_by: 'shared' });
            setShowAddModal(false);
        }
    };

    const handleToggleComplete = async (item: BudgetItem) => {
        const { error } = await supabase
            .from('budgets')
            .update({ is_completed: !item.is_completed })
            .eq('id', item.id);

        if (!error) {
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
            ));
        }
    };

    const handleDeleteItem = async (id: string) => {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (!error) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const totalCompleted = items.filter(i => i.is_completed).reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const completionPercent = totalEstimated > 0 ? Math.round((totalCompleted / totalEstimated) * 100) : 0;

    const getCategoryItems = (catId: string) => items.filter(i => i.category === catId);
    const getCategoryTotal = (catId: string) => getCategoryItems(catId).reduce((sum, i) => sum + (i.estimated_cost || 0), 0);

    if (isLoading) {
        return (
            <main className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-surface-50' : 'bg-surface-900'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </main>
        );
    }

    return (
        <main className={`min-h-screen pb-24 font-sans ${theme === 'light' ? 'bg-surface-50 text-slate-800' : 'bg-surface-900 text-white'}`}>
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border ${theme === 'light' ? 'bg-white/50 border-white/40' : 'bg-surface-800/60 border-surface-700/50'}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">{isArabic ? 'ميزانية الزواج' : 'Wedding Budget'}</h1>
                    <div className="w-10" />
                </div>

                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-5 backdrop-blur-xl border mb-6 ${theme === 'light' ? 'bg-white/60 border-white/50 shadow-lg' : 'bg-surface-800/50 border-surface-700/30'}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className={`text-sm mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                {isArabic ? 'إجمالي الميزانية' : 'Total Budget'}
                            </p>
                            <p className="text-3xl font-bold">
                                {totalEstimated.toLocaleString()} <span className="text-lg font-normal">ريال</span>
                            </p>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600`}>
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>
                                {isArabic ? 'المكتمل' : 'Completed'}
                            </span>
                            <span className="font-medium text-emerald-500">{completionPercent}%</span>
                        </div>
                        <div className={`h-2 rounded-full ${theme === 'light' ? 'bg-slate-200' : 'bg-surface-700'}`}>
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Categories */}
                <h2 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-slate-700' : 'text-surface-200'}`}>
                    {isArabic ? 'الفئات' : 'Categories'}
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {categories.map((cat) => {
                        const catTotal = getCategoryTotal(cat.id);
                        const catCount = getCategoryItems(cat.id).length;
                        return (
                            <motion.button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-xl p-3 text-center transition-all border ${selectedCategory === cat.id
                                    ? `bg-gradient-to-br ${cat.color} text-white border-transparent`
                                    : theme === 'light'
                                        ? 'bg-white/60 border-white/50'
                                        : 'bg-surface-800/50 border-surface-700/30'
                                    }`}
                            >
                                <cat.icon className={`w-6 h-6 mx-auto mb-1 ${selectedCategory === cat.id ? 'text-white' : ''}`} />
                                <p className="text-xs font-medium truncate">{isArabic ? cat.title : cat.titleEn}</p>
                                {catCount > 0 && (
                                    <p className={`text-xs mt-1 ${selectedCategory === cat.id ? 'text-white/80' : theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                        {catTotal.toLocaleString()}
                                    </p>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    {(selectedCategory ? getCategoryItems(selectedCategory) : items).map((item) => {
                        const cat = categories.find(c => c.id === item.category);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-xl p-4 backdrop-blur-xl border transition-all ${item.is_completed ? 'opacity-60' : ''} ${theme === 'light' ? 'bg-white/60 border-white/50' : 'bg-surface-800/50 border-surface-700/30'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleComplete(item)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.is_completed
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : theme === 'light' ? 'border-slate-300' : 'border-surface-600'
                                            }`}
                                    >
                                        {item.is_completed && <Check className="w-4 h-4 text-white" />}
                                    </button>
                                    <div className="flex-1">
                                        <p className={`font-medium ${item.is_completed ? 'line-through' : ''}`}>
                                            {item.item_name}
                                        </p>
                                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                                            {cat && (isArabic ? cat.title : cat.titleEn)}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">{item.estimated_cost?.toLocaleString()}</p>
                                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>ريال</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="p-2 text-red-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="text-center py-12">
                            <Wallet className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-slate-300' : 'text-surface-600'}`} />
                            <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>
                                {isArabic ? 'لم تضف أي عنصر بعد' : 'No items added yet'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Button */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-xl shadow-amber-500/30 flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                {isArabic ? 'أضف عنصر' : 'Add Item'}
            </button>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md rounded-t-3xl p-6 ${theme === 'light' ? 'bg-white' : 'bg-surface-800'}`}
                        >
                            <div className="w-12 h-1 rounded-full bg-surface-300 mx-auto mb-6" />
                            <h2 className="text-xl font-bold mb-6">{isArabic ? 'أضف عنصر جديد' : 'Add New Item'}</h2>

                            {/* Category Select */}
                            <div className="mb-4">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'الفئة' : 'Category'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.slice(0, 6).map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setNewItem(prev => ({ ...prev, category: cat.id }))}
                                            className={`p-2 rounded-lg text-xs font-medium transition-all ${newItem.category === cat.id
                                                ? `bg-gradient-to-r ${cat.color} text-white`
                                                : theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'
                                                }`}
                                        >
                                            {isArabic ? cat.title : cat.titleEn}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Item Name */}
                            <div className="mb-4">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'اسم العنصر' : 'Item Name'}
                                </label>
                                <input
                                    type="text"
                                    value={newItem.item_name}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                                    placeholder={isArabic ? 'مثال: فستان الزفاف' : 'e.g., Wedding Dress'}
                                    className={`w-full p-3 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-700 border-surface-600'}`}
                                />
                            </div>

                            {/* Cost */}
                            <div className="mb-4">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'التكلفة التقديرية (ريال)' : 'Estimated Cost (SAR)'}
                                </label>
                                <input
                                    type="number"
                                    value={newItem.estimated_cost}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, estimated_cost: e.target.value }))}
                                    placeholder="0"
                                    className={`w-full p-3 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-700 border-surface-600'}`}
                                />
                            </div>

                            {/* Paid By */}
                            <div className="mb-6">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'من يدفع؟' : 'Who pays?'}
                                </label>
                                <div className="flex gap-2">
                                    {[
                                        { value: 'partner1', label: isArabic ? 'الزوج' : 'Husband' },
                                        { value: 'partner2', label: isArabic ? 'الزوجة' : 'Wife' },
                                        { value: 'shared', label: isArabic ? 'مشترك' : 'Shared' },
                                        { value: 'family', label: isArabic ? 'الأهل' : 'Family' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setNewItem(prev => ({ ...prev, paid_by: opt.value }))}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${newItem.paid_by === opt.value
                                                ? 'bg-primary-500 text-white'
                                                : theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddItem}
                                disabled={!newItem.item_name || !newItem.estimated_cost}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold disabled:opacity-50"
                            >
                                {isArabic ? 'إضافة' : 'Add'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
