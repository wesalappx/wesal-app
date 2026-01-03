import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Globe, Users, Wifi } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/stores/settings-store';

interface SessionModeModalProps {
    isOpen: boolean;
    onSelectMode: (mode: 'local' | 'remote') => void;
    onClose: () => void;
    isSharedAvailable?: boolean;
}

export default function SessionModeModal({ isOpen, onSelectMode, onClose, isSharedAvailable = true }: SessionModeModalProps) {
    const { t, language } = useTranslation();
    const { theme, setPreferredSessionMode } = useSettingsStore();
    const [rememberChoice, setRememberChoice] = React.useState(false);

    const handleSelect = (mode: 'local' | 'remote') => {
        if (rememberChoice) {
            setPreferredSessionMode(mode);
        }
        onSelectMode(mode);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className={`fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-sm ${theme === 'light' ? 'bg-slate-900/40' : 'bg-black/60'
                    }`}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-lg overflow-hidden relative rounded-3xl border shadow-2xl ${theme === 'light'
                        ? 'bg-white border-slate-100 shadow-slate-200/50'
                        : 'glass-card bg-surface-900/95 border-surface-700'
                        }`}
                >
                    <div className="p-8 text-center">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-indigo-50 text-indigo-500' : 'bg-primary-500/20 text-primary-500'
                            }`}>
                            <Users className="w-10 h-10" />
                        </div>

                        <h2 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            {language === 'ar' ? 'كيف تودان اللعب؟' : 'How would you like to play?'}
                        </h2>
                        <p className={`mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                            {language === 'ar'
                                ? 'اختر الطريقة التي تناسبكما الآن'
                                : 'Choose the mode that suits you best right now'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Local Mode */}
                            <button
                                onClick={() => handleSelect('local')}
                                className={`group relative p-6 rounded-2xl border transition-all text-left ${theme === 'light'
                                    ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200'
                                    : 'bg-surface-800/50 border-white/5 hover:bg-surface-800 hover:border-primary-500/30'
                                    }`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity ${theme === 'light' ? 'bg-gradient-to-br from-indigo-500/5 to-transparent' : 'bg-gradient-to-br from-primary-500/5 to-transparent'
                                    }`} />
                                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-surface-700'
                                        }`}>
                                        <Smartphone className={`w-6 h-6 ${theme === 'light' ? 'text-slate-400 group-hover:text-indigo-500' : 'text-surface-300 group-hover:text-primary-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                                            {language === 'ar' ? 'جهاز واحد' : 'Shared Device'}
                                        </h3>
                                        <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-surface-400'}`}>
                                            {language === 'ar' ? 'نلعب مع بعض بنفس الجوال' : 'Play together on one phone'}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Remote Mode */}
                            <button
                                onClick={() => isSharedAvailable && handleSelect('remote')}
                                disabled={!isSharedAvailable}
                                className={`group relative p-6 rounded-2xl border transition-all text-left ${!isSharedAvailable
                                    ? theme === 'light'
                                        ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                        : 'bg-surface-900/30 border-white/5 opacity-50 cursor-not-allowed'
                                    : theme === 'light'
                                        ? 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl hover:shadow-pink-500/5 hover:border-pink-200'
                                        : 'bg-surface-800/50 border-white/5 hover:bg-surface-800 hover:border-accent-500/30'
                                    }`}
                            >
                                {isSharedAvailable && (
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity ${theme === 'light' ? 'bg-gradient-to-br from-pink-500/5 to-transparent' : 'bg-gradient-to-br from-accent-500/5 to-transparent'
                                        }`} />
                                )}
                                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${isSharedAvailable ? 'group-hover:scale-110' : ''} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-surface-700'
                                        }`}>
                                        <Globe className={`w-6 h-6 ${theme === 'light'
                                            ? isSharedAvailable ? 'text-slate-400 group-hover:text-pink-500' : 'text-slate-300'
                                            : isSharedAvailable ? 'text-surface-300 group-hover:text-accent-400' : 'text-surface-600'
                                            }`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                                            {language === 'ar' ? 'عن بعد' : 'Remote Play'}
                                        </h3>
                                        <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-surface-300'}`}>
                                            {!isSharedAvailable
                                                ? (language === 'ar' ? 'يتطلب ربط شريك' : 'Requires Pairing')
                                                : (language === 'ar' ? 'كل واحد بجواله (اونلاين)' : 'Each on their own phone (Online)')
                                            }
                                        </p>
                                    </div>
                                    {isSharedAvailable && (
                                        <div className="absolute top-0 right-0 m-2">
                                            <span className="flex h-3 w-3">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme === 'light' ? 'bg-pink-400' : 'bg-accent-400'
                                                    }`}></span>
                                                <span className={`relative inline-flex rounded-full h-3 w-3 ${theme === 'light' ? 'bg-pink-500' : 'bg-accent-500'
                                                    }`}></span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Remember Choice Checkbox */}
                        <div className="flex items-center justify-center gap-2">
                            <input
                                type="checkbox"
                                id="remember-mode"
                                checked={rememberChoice}
                                onChange={(e) => setRememberChoice(e.target.checked)}
                                className={`w-4 h-4 rounded border ${theme === 'light'
                                    ? 'border-slate-300 text-indigo-500 focus:ring-indigo-500'
                                    : 'border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500'
                                    }`}
                            />
                            <label
                                htmlFor="remember-mode"
                                className={`text-sm cursor-pointer ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}
                            >
                                {language === 'ar'
                                    ? 'تذكر خياري للمرات القادمة'
                                    : 'Remember my choice for future sessions'}
                            </label>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
