'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, UserPlus } from 'lucide-react';

interface PartnerInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    inviteCode: string;
}

export default function PartnerInviteModal({ isOpen, onClose, inviteCode }: PartnerInviteModalProps) {
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm bg-surface-800 border border-surface-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-surface-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Icon */}
                    <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserPlus className="w-8 h-8 text-rose-400" />
                    </div>

                    <h2 className="text-xl font-serif text-center text-white mb-2">
                        Invite Your Partner
                    </h2>
                    <p className="text-center text-surface-400 text-sm mb-8">
                        Share this code with your partner to link your accounts and start your journey.
                    </p>

                    {/* Code Display */}
                    <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 mb-6 text-center relative group">
                        <span className="text-3xl font-mono text-white tracking-[0.2em] font-bold">
                            {inviteCode}
                        </span>
                        <div className="absolute inset-x-0 bottom-2 text-[10px] text-surface-500 uppercase tracking-wider">
                            Expires in 24h
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 py-3 bg-surface-700 hover:bg-surface-600 text-white rounded-xl font-medium transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors"
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
