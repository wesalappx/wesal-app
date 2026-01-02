'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, UserPlus } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

interface PartnerInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteCode: string;
}

export default function PartnerInviteModal({ isOpen, onClose, inviteCode }: PartnerInviteModalProps) {
    const { theme } = useSettingsStore();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on Couples Game',
                    text: `Let's connect deeper. Use my code: ${inviteCode}`,
                    url: window.location.origin,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            handleCopy();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${theme === 'light' ? 'bg-slate-900/40' : 'bg-black/80'
                    }`}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden border ${theme === 'light'
                            ? 'bg-white/95 border-white/40 shadow-xl shadow-rose-500/10'
                            : 'bg-surface-800 border-surface-700'
                        }`}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 transition-colors ${theme === 'light'
                                ? 'text-slate-400 hover:text-slate-600'
                                : 'text-surface-400 hover:text-white'
                            }`}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === 'light' ? 'bg-rose-100 text-rose-500' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                        <UserPlus className="w-8 h-8" />
                    </div>

                    <h2 className={`text-xl font-serif text-center mb-2 font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                        Invite Your Partner
                    </h2>
                    <p className={`text-center text-sm mb-8 ${theme === 'light' ? 'text-slate-500' : 'text-surface-400'}`}>
                        Share this code with your partner to link your accounts and start your journey.
                    </p>

                    {/* Code Display */}
                    <div className={`rounded-2xl p-6 mb-6 text-center relative group border ${theme === 'light'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-surface-900 border-surface-700'
                        }`}>
                        <span className={`text-3xl font-mono tracking-[0.2em] font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'
                            }`}>
                            {inviteCode}
                        </span>
                        <div className={`absolute inset-x-0 bottom-2 text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-slate-400' : 'text-surface-500'
                            }`}>
                            Expires in 24h
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${theme === 'light'
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-surface-700 hover:bg-surface-600 text-white'
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            onClick={handleShare}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${theme === 'light'
                                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/20'
                                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                                }`}
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
