'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Quote,
    Lightbulb,
    MapPin
} from 'lucide-react';

interface ContentBlock {
    id: string;
    type: 'daily_tip' | 'quote' | 'journey_content' | 'notification_template';
    title_ar: string | null;
    title_en: string | null;
    content_ar: string;
    content_en: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

const contentTypes = [
    { value: 'daily_tip', label: 'Daily Tips', icon: Lightbulb, color: 'text-yellow-400' },
    { value: 'quote', label: 'Quotes', icon: Quote, color: 'text-blue-400' },
    { value: 'journey_content', label: 'Journey Content', icon: MapPin, color: 'text-green-400' },
    { value: 'notification_template', label: 'Notifications', icon: FileText, color: 'text-purple-400' },
];

export default function AdminContentPage() {
    const [content, setContent] = useState<ContentBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('daily_tip');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: 'daily_tip',
        title_ar: '',
        title_en: '',
        content_ar: '',
        content_en: '',
        is_active: true,
    });

    useEffect(() => {
        fetchContent();
    }, [activeType]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/content?type=${activeType}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data.content);
            }
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PATCH' : 'POST';
            const body = editingId ? { id: editingId, ...formData } : { ...formData, type: activeType };

            const res = await fetch('/api/admin/content', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                fetchContent();
                resetForm();
            }
        } catch (err) {
            console.error('Error saving content:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            const res = await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchContent();
            }
        } catch (err) {
            console.error('Error deleting content:', err);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            type: activeType,
            title_ar: '',
            title_en: '',
            content_ar: '',
            content_en: '',
            is_active: true,
        });
    };

    const startEdit = (item: ContentBlock) => {
        setEditingId(item.id);
        setFormData({
            type: item.type,
            title_ar: item.title_ar || '',
            title_en: item.title_en || '',
            content_ar: item.content_ar,
            content_en: item.content_en || '',
            is_active: item.is_active,
        });
        setShowForm(true);
    };

    const activeTypeInfo = contentTypes.find(t => t.value === activeType);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Content Management</h1>
                    <p className="text-slate-400 mt-1">Manage tips, quotes, and app content</p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content
                </Button>
            </div>

            {/* Content Type Tabs */}
            <div className="flex gap-2 flex-wrap">
                {contentTypes.map((type) => (
                    <Button
                        key={type.value}
                        variant={activeType === type.value ? 'default' : 'outline'}
                        onClick={() => setActiveType(type.value)}
                        className={activeType === type.value
                            ? 'bg-slate-800 text-white'
                            : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                        }
                        size="sm"
                    >
                        <type.icon className={`w-4 h-4 mr-2 ${type.color}`} />
                        {type.label}
                    </Button>
                ))}
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <span>{editingId ? 'Edit Content' : 'Add New Content'}</span>
                            <Button variant="ghost" size="icon" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Title (Arabic)</label>
                                    <Input
                                        value={formData.title_ar}
                                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Title (English)</label>
                                    <Input
                                        value={formData.title_en}
                                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Content (Arabic) *</label>
                                    <textarea
                                        value={formData.content_ar}
                                        onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                                        className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white resize-none"
                                        required
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Content (English)</label>
                                    <textarea
                                        value={formData.content_en}
                                        onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                                        className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white">
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingId ? 'Update' : 'Create'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm} className="border-slate-700 text-slate-400">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Content List */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        {activeTypeInfo && <activeTypeInfo.icon className={`w-5 h-5 ${activeTypeInfo.color}`} />}
                        {activeTypeInfo?.label || 'Content'}
                        <Badge variant="secondary" className="ml-2">{content.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                        </div>
                    ) : content.length === 0 ? (
                        <p className="text-center text-slate-500 py-12">No content found. Add some!</p>
                    ) : (
                        <div className="space-y-4">
                            {content.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-lg border transition-colors ${item.is_active
                                            ? 'bg-slate-800/50 border-slate-700'
                                            : 'bg-slate-900/50 border-slate-800 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {item.title_ar && (
                                                <h4 className="text-white font-medium mb-1" dir="rtl">{item.title_ar}</h4>
                                            )}
                                            <p className="text-slate-400 text-sm" dir="rtl">{item.content_ar}</p>
                                            {item.content_en && (
                                                <p className="text-slate-500 text-xs mt-2">{item.content_en}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant={item.is_active ? 'success' : 'secondary'}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEdit(item)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-slate-400 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
