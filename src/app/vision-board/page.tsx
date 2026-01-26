'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Plus,
    Home,
    Heart,
    Plane,
    Sparkles,
    Trash2,
    Image as ImageIcon,
    Loader2,
    X
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';
import { usePairing } from '@/hooks/usePairing';

interface VisionItem {
    id: string;
    category: string;
    title: string;
    image_url: string | null;
    note: string | null;
    created_by: string;
}

const categories = [
    { id: 'home', title: 'بيتنا', titleEn: 'Our Home', icon: Home, color: 'from-emerald-500 to-teal-600' },
    { id: 'wedding', title: 'الزفاف', titleEn: 'Wedding', icon: Heart, color: 'from-rose-500 to-pink-600' },
    { id: 'travel', title: 'السفر', titleEn: 'Travel', icon: Plane, color: 'from-cyan-500 to-blue-600' },
    { id: 'lifestyle', title: 'حياتنا', titleEn: 'Lifestyle', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
];

export default function VisionBoardPage() {
    const router = useRouter();
    const supabase = createClient();
    const { theme } = useSettingsStore();
    const { getStatus } = usePairing();
    const isArabic = true;

    const [items, setItems] = useState<VisionItem[]>([]);
    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('home');

    const [newItem, setNewItem] = useState({
        category: 'home',
        title: '',
        image_url: '',
        note: '',
    });

    useEffect(() => {
        const init = async () => {
            const status = await getStatus();
            if (status.coupleId) {
                setCoupleId(status.coupleId);
                const { data } = await supabase
                    .from('vision_boards')
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
        if (!coupleId || !newItem.title) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('vision_boards')
            .insert({
                couple_id: coupleId,
                created_by: user.id,
                category: newItem.category,
                title: newItem.title,
                image_url: newItem.image_url || null,
                note: newItem.note || null,
            })
            .select()
            .single();

        if (data) {
            setItems(prev => [data, ...prev]);
            setNewItem({ category: 'home', title: '', image_url: '', note: '' });
            setShowAddModal(false);
        }
    };

    const handleDeleteItem = async (id: string) => {
        const { error } = await supabase
            .from('vision_boards')
            .delete()
            .eq('id', id);

        if (!error) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const getCategoryItems = (catId: string) => items.filter(i => i.category === catId);

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
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl" />
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
                    <h1 className="text-xl font-bold">{isArabic ? 'رؤيتنا المستقبلية' : 'Our Vision Board'}</h1>
                    <div className="w-10" />
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? `bg-gradient-to-r ${cat.color} text-white`
                                : theme === 'light'
                                    ? 'bg-white/60 text-slate-600'
                                    : 'bg-surface-800/50 text-surface-300'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{isArabic ? cat.title : cat.titleEn}</span>
                        </button>
                    ))}
                </div>

                {/* Vision Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {getCategoryItems(selectedCategory).map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`rounded-2xl overflow-hidden backdrop-blur-xl border relative group ${theme === 'light' ? 'bg-white/60 border-white/50' : 'bg-surface-800/50 border-surface-700/30'}`}
                        >
                            {/* Image or Placeholder */}
                            {item.image_url ? (
                                <div className="aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                            ) : (
                                <div className={`aspect-square flex items-center justify-center ${theme === 'light' ? 'bg-slate-100' : 'bg-surface-700'}`}>
                                    <ImageIcon className={`w-12 h-12 ${theme === 'light' ? 'text-slate-300' : 'text-surface-500'}`} />
                                </div>
                            )}

                            {/* Title Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                                <p className="text-white text-sm font-medium truncate">{item.title}</p>
                                {item.note && (
                                    <p className="text-white/70 text-xs truncate">{item.note}</p>
                                )}
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}

                    {/* Add New Card */}
                    <motion.button
                        onClick={() => {
                            setNewItem(prev => ({ ...prev, category: selectedCategory }));
                            setShowAddModal(true);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${theme === 'light'
                            ? 'border-slate-300 hover:border-primary-500 text-slate-400 hover:text-primary-500'
                            : 'border-surface-600 hover:border-primary-500 text-surface-500 hover:text-primary-400'
                            }`}
                    >
                        <Plus className="w-8 h-8" />
                        <span className="text-sm font-medium">{isArabic ? 'أضف حلم' : 'Add Dream'}</span>
                    </motion.button>
                </div>

                {getCategoryItems(selectedCategory).length === 0 && (
                    <div className="text-center py-12 col-span-2">
                        <Sparkles className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-slate-300' : 'text-surface-600'}`} />
                        <p className={theme === 'light' ? 'text-slate-500' : 'text-surface-400'}>
                            {isArabic ? 'شاركوا أحلامكم هنا!' : 'Share your dreams here!'}
                        </p>
                    </div>
                )}
            </div>

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
                            <h2 className="text-xl font-bold mb-6">{isArabic ? 'أضف حلم جديد' : 'Add New Dream'}</h2>

                            {/* Title */}
                            <div className="mb-4">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'العنوان' : 'Title'}
                                </label>
                                <input
                                    type="text"
                                    value={newItem.title}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder={isArabic ? 'مثال: فيلا بحديقة' : 'e.g., Villa with garden'}
                                    className={`w-full p-3 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-700 border-surface-600'}`}
                                />
                            </div>

                            {/* Image URL */}
                            <div className="mb-4">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'رابط الصورة (اختياري)' : 'Image URL (optional)'}
                                </label>
                                <input
                                    type="url"
                                    value={newItem.image_url}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, image_url: e.target.value }))}
                                    placeholder="https://..."
                                    className={`w-full p-3 rounded-xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-700 border-surface-600'}`}
                                />
                            </div>

                            {/* Note */}
                            <div className="mb-6">
                                <label className={`text-sm mb-2 block ${theme === 'light' ? 'text-slate-600' : 'text-surface-400'}`}>
                                    {isArabic ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                                </label>
                                <textarea
                                    value={newItem.note}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, note: e.target.value }))}
                                    rows={2}
                                    className={`w-full p-3 rounded-xl border resize-none ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-surface-700 border-surface-600'}`}
                                />
                            </div>

                            <button
                                onClick={handleAddItem}
                                disabled={!newItem.title}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold disabled:opacity-50"
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
