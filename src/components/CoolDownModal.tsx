import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Clock, CheckCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

interface CoolDownModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CoolDownModal({ isOpen, onClose }: CoolDownModalProps) {
    const { theme } = useSettingsStore();
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [sessionActive, setSessionActive] = useState(false);

    // Timer Logic
    useEffect(() => {
        if (!isOpen) {
            setSessionActive(false);
            setTimeLeft(600); // Reset to 10 mins
            return;
        }

        setSessionActive(true);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    // Breathing Logic (4-7-8 Technique)
    useEffect(() => {
        if (!isOpen) return;

        const cycleBreathing = async () => {
            // Start Inhale (4s)
            setPhase('inhale');
            await new Promise(r => setTimeout(r, 4000));

            // Start Hold (7s)
            if (!isOpen) return;
            setPhase('hold');
            await new Promise(r => setTimeout(r, 7000));

            // Start Exhale (8s)
            if (!isOpen) return;
            setPhase('exhale');
            await new Promise(r => setTimeout(r, 8000));
        };

        cycleBreathing(); // Initial run
        const breathingInterval = setInterval(cycleBreathing, 19000); // 4+7+8 = 19s total cycle

        return () => clearInterval(breathingInterval);
    }, [isOpen]);

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Premium Ripple Animation Variants - Adjusted for Mobile/Safety
    const rippleVariants = {
        inhale: { scale: 1.35, opacity: 0.4, transition: { duration: 4, ease: "easeInOut" } },
        hold: { scale: 1.45, opacity: 0.5, transition: { duration: 7, repeat: Infinity, repeatType: "reverse" as const } },
        exhale: { scale: 1.2, opacity: 0.1, transition: { duration: 8, ease: "easeInOut" } }
    };

    const coreVariants = {
        inhale: { scale: 1.15, transition: { duration: 4, ease: "easeInOut" } },
        hold: { scale: 1.2, transition: { duration: 7, repeat: Infinity, repeatType: "reverse" as const } },
        exhale: { scale: 1, transition: { duration: 8, ease: "easeInOut" } }
    };

    const textVariants = {
        initial: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 1, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.1, filter: "blur(10px)", transition: { duration: 0.5 } }
    };

    const getInstructionText = () => {
        switch (phase) {
            case 'inhale': return "شهيــــــــق";
            case 'hold': return "حبس النفس";
            case 'exhale': return "زفيـــــــــر";
        }
    };

    const getInstructionSubtext = () => {
        switch (phase) {
            case 'inhale': return "املأ رئتيك بهدوء...";
            case 'hold': return "استشعر السكون...";
            case 'exhale': return "تخلص من كل التوتر...";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                // Outer Container: Fixed, Z-Index, Scrollable
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={`fixed inset-0 backdrop-blur-3xl ${theme === 'light' ? 'bg-white/90' : 'bg-black/95'
                            }`}
                    />

                    {/* Modal Content - Scrollable & Flexible, but optimized to FIT */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-lg min-h-screen md:min-h-0 md:h-auto flex flex-col justify-between py-6 px-6 z-10"
                    >
                        {/* Header */}
                        <div className="w-full flex justify-between items-center mb-4">
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md ${theme === 'light'
                                    ? 'bg-white/50 border-slate-200 shadow-sm'
                                    : 'bg-white/5 border-white/10'
                                }`}>
                                <Clock className={`w-4 h-4 ${theme === 'light' ? 'text-primary-600' : 'text-primary-300'}`} />
                                <span className={`font-mono text-sm tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-white/90'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors border ${theme === 'light'
                                        ? 'bg-white/50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Central Breathing Visualization - Compacted */}
                        <div className="flex-1 flex flex-col items-center justify-center my-2">
                            {/* Ambient Light Orb */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full blur-[80px] animate-pulse pointer-events-none ${theme === 'light' ? 'bg-indigo-300/30' : 'bg-indigo-500/20'
                                }`} />

                            <div className="relative flex items-center justify-center mb-8">
                                {/* Ripple Layers */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={phase}
                                        variants={rippleVariants}
                                        transition={{ delay: i * 0.2 }}
                                        className={`absolute w-56 h-56 md:w-64 md:h-64 border rounded-full ${theme === 'light'
                                                ? 'border-indigo-200/50 bg-indigo-50/30'
                                                : 'border-white/10 bg-white/5'
                                            }`}
                                        style={{ zIndex: 0 }}
                                    />
                                ))}

                                {/* Core Breathing Orb */}
                                <motion.div
                                    animate={phase}
                                    variants={coreVariants}
                                    className={`relative z-10 w-40 h-40 md:w-48 md:h-48 rounded-full shadow-2xl
                                        flex items-center justify-center backdrop-blur-md border border-white/20
                                        ${phase === 'inhale' ? 'bg-gradient-to-b from-cyan-400 to-blue-600' :
                                            phase === 'hold' ? 'bg-gradient-to-b from-violet-400 to-purple-600' :
                                                'bg-gradient-to-b from-indigo-400 to-slate-700'}`}
                                >
                                    <Wind className="w-14 h-14 md:w-16 md:h-16 text-white/95 drop-shadow-lg" />

                                    {/* Inner Shine */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                </motion.div>
                            </div>

                            {/* Typography - Positioned Lower */}
                            <div className="text-center space-y-2 min-h-[6rem] relative z-20 mt-28">
                                <AnimatePresence mode="wait">
                                    <motion.h2
                                        key={phase}
                                        variants={textVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className={`text-4xl md:text-5xl font-black bg-clip-text text-transparent tracking-tight ${theme === 'light'
                                                ? 'bg-gradient-to-b from-slate-900 to-slate-600'
                                                : 'bg-gradient-to-b from-white to-white/60'
                                            }`}
                                    >
                                        {getInstructionText()}
                                    </motion.h2>
                                </AnimatePresence>

                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={`${phase}-sub`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={`text-base md:text-lg font-medium tracking-wide ${theme === 'light' ? 'text-slate-600' : 'text-primary-100/70'
                                            }`}
                                    >
                                        {getInstructionSubtext()}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="w-full mt-auto pt-4">
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2 }}
                                onClick={onClose}
                                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all group backdrop-blur-md border ${theme === 'light'
                                        ? 'bg-white/80 hover:bg-white border-slate-200 shadow-xl shadow-indigo-500/10'
                                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                                    }`}
                            >
                                <span className={`font-bold text-lg group-hover:text-current ${theme === 'light' ? 'text-slate-700' : 'text-white/90 group-hover:text-white'
                                    }`}>أشعر بالهدوء الآن</span>
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
