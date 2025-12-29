'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, User, Mail, Calendar, Check, Loader2, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export default function ProfileEditPage() {
    const { user, updateProfile } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Load user data on mount
    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.display_name || '');
            setEmail(user.email || '');
            setBio(user.user_metadata?.bio || '');
            setDateOfBirth(user.user_metadata?.date_of_birth || '');
            setGender(user.user_metadata?.gender || '');
            setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
    }, [user]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'الاسم مطلوب';
        } else if (name.length < 2) {
            newErrors.name = 'الاسم يجب أن يكون حرفين على الأقل';
        } else if (name.length > 50) {
            newErrors.name = 'الاسم طويل جداً';
        }

        if (bio.length > 200) {
            newErrors.bio = 'النبذة يجب أن تكون أقل من 200 حرف';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setErrors({ ...errors, photo: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrors({ ...errors, photo: 'الرجاء اختيار صورة صالحة' });
            return;
        }

        setAvatarFile(file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);
        setErrors({ ...errors, photo: '' });
    };

    const uploadPhoto = async (): Promise<string | null> => {
        if (!avatarFile || !user) return null;

        setUploadingPhoto(true);

        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Photo upload error:', error);
            setErrors({ ...errors, photo: 'فشل رفع الصورة. يُرجى المحاولة مرة أخرى.' });
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            let newAvatarUrl = user?.user_metadata?.avatar_url;
            if (avatarFile) {
                const uploadedUrl = await uploadPhoto();
                if (uploadedUrl) {
                    newAvatarUrl = uploadedUrl;
                } else {
                    setIsLoading(false);
                    return;
                }
            }

            const { error } = await updateProfile({
                displayName: name,
                avatarUrl: newAvatarUrl,
                bio,
                dateOfBirth,
                gender,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/settings');
            }, 1500);

        } catch (error: any) {
            console.error('Profile update error:', error);
            setErrors({ submit: error.message || 'حدث خطأ أثناء حفظ البيانات' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">تعديل الملف الشخصي</h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6 border-surface-700/50"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {avatarUrl ? (
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-primary-500/30 transition-all relative">
                                        <img
                                            src={avatarUrl}
                                            alt={name}
                                            className="w-full h-full object-cover"
                                        />
                                        {uploadingPhoto && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl group-hover:shadow-primary-500/30 transition-all">
                                        {name.charAt(0) || 'U'}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    disabled={uploadingPhoto}
                                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-surface-800 border border-surface-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploadingPhoto ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Camera className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-surface-400 text-sm mt-3">اضغط لتغيير الصورة</p>
                            {errors.photo && (
                                <p className="text-red-400 text-sm mt-2">{errors.photo}</p>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                            />
                        </div>

                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-surface-300 text-right">
                                الاسم المعروض
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-surface-900/50 border text-white text-right placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all
                      ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-surface-600 focus:border-primary-500'}`}
                                    placeholder="أدخل اسمك"
                                    dir="rtl"
                                />
                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            </div>
                            {errors.name && (
                                <p className="text-red-400 text-sm text-right">{errors.name}</p>
                            )}
                        </div>

                        {/* Bio Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-surface-300 text-right">
                                نبذة عنك
                            </label>
                            <div className="relative">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    maxLength={200}
                                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-surface-900/50 border text-white text-right placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none
                      ${errors.bio ? 'border-red-500/50 focus:border-red-500' : 'border-surface-600 focus:border-primary-500'}`}
                                    placeholder="اكتب شيئاً عن نفسك... (اختياري)"
                                    dir="rtl"
                                />
                                <FileText className="absolute right-3 top-3 w-5 h-5 text-surface-400" />
                            </div>
                            <p className="text-surface-500 text-xs text-left">{bio.length}/200</p>
                            {errors.bio && (
                                <p className="text-red-400 text-sm text-right">{errors.bio}</p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-surface-300 text-right">
                                تاريخ الميلاد
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-surface-900/50 border border-surface-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-surface-300 text-right">
                                الجنس
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setGender('male')}
                                    className={`py-3 rounded-xl border font-medium transition-all flex items-center justify-center gap-2 ${gender === 'male'
                                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                            : 'bg-surface-800/50 border-surface-600 text-surface-300 hover:bg-surface-700/50'
                                        }`}
                                >
                                    👨 ذكر
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('female')}
                                    className={`py-3 rounded-xl border font-medium transition-all flex items-center justify-center gap-2 ${gender === 'female'
                                            ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                                            : 'bg-surface-800/50 border-surface-600 text-surface-300 hover:bg-surface-700/50'
                                        }`}
                                >
                                    👩 أنثى
                                </button>
                            </div>
                        </div>

                        {/* Email Field - Read Only */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-surface-300 text-right">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    readOnly
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-surface-900/30 border border-surface-700 text-surface-400 text-right cursor-not-allowed"
                                    dir="ltr"
                                />
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                            </div>
                            <p className="text-surface-500 text-xs text-right">لا يمكن تغيير البريد الإلكتروني</p>
                        </div>

                        {/* Submit Error Message */}
                        {errors.submit && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-red-400 text-sm">{errors.submit}</span>
                            </motion.div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3"
                            >
                                <Check className="w-5 h-5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">تم حفظ التعديلات بنجاح</span>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || uploadingPhoto}
                            className="w-full py-4 mt-8 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {uploadingPhoto ? 'جاري رفع الصورة...' : 'جاري الحفظ...'}
                                </>
                            ) : (
                                'حفظ التغييرات'
                            )}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}
