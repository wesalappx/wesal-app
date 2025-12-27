import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Globe, Users, Wifi } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionModeModalProps {
    isOpen: boolean;
    onSelectMode: (mode: 'local' | 'remote') => void;
    onClose: () => void;
}

export default function SessionModeModal({ isOpen, onSelectMode, onClose }: SessionModeModalProps) {
    const { t, language } = useTranslation();
    const isRTL = language === 'ar';

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card w-full max-w-lg overflow-hidden relative"
                >
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <Users className="w-10 h-10 text-primary-500" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2 text-white">
                            {language === 'ar' ? 'كيف تودان اللعب؟' : 'How would you like to play?'}
                        </h2>
                        <p className="text-surface-400 mb-8">
                            {language === 'ar'
                                ? 'اختر الطريقة التي تناسبكما الآن'
                                : 'Choose the mode that suits you best right now'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Local Mode */}
                            <button
                                onClick={() => onSelectMode('local')}
                                className="group relative p-6 rounded-2xl bg-surface-800/50 border border-white/5 hover:bg-surface-800 hover:border-primary-500/30 transition-all text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Smartphone className="w-6 h-6 text-surface-300 group-hover:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{language === 'ar' ? 'جهاز واحد' : 'Shared Device'}</h3>
                                        <p className="text-xs text-surface-400">
                                            {language === 'ar' ? 'نلعب مع بعض بنفس الجوال' : 'Play together on one phone'}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Remote Mode */}
                            <button
                                onClick={() => onSelectMode('remote')}
                                className="group relative p-6 rounded-2xl bg-surface-800/50 border border-white/5 hover:bg-surface-800 hover:border-accent-500/30 transition-all text-left"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                                <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Globe className="w-6 h-6 text-surface-300 group-hover:text-accent-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{language === 'ar' ? 'عن بعد' : 'Remote Play'}</h3>
                                        <p className="text-xs text-surface-300">
                                            {language === 'ar' ? 'كل واحد بجواله (اونلاين)' : 'Each on their own phone (Online)'}
                                        </p>
                                    </div>
                                    <div className="absolute top-0 right-0 m-2">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
