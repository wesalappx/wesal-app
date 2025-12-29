'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X, Minimize2, Heart, Smile, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';

interface Message {
    id: string;
    role: 'user' | 'partner' | 'system';
    content: string;
    timestamp: number;
    sender_id?: string;
}

interface SessionChatProps {
    sessionId: string;
    userId: string;
    partnerName?: string;
    compact?: boolean;
}

// Quick reactions
const quickReactions = ['❤️', '😊', '😍', '👏', '🎉', '💕'];

export default function SessionChat({ sessionId, userId, partnerName, compact = false }: SessionChatProps) {
    const supabase = createClient();
    const { language } = useSettingsStore();
    const isRTL = language === 'ar';

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [showReactions, setShowReactions] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load initial history
    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('active_sessions')
                .select('chat_history')
                .eq('id', sessionId)
                .single();

            if (data?.chat_history && Array.isArray(data.chat_history)) {
                setMessages(data.chat_history as Message[]);
            }
        };
        if (sessionId) fetchHistory();
    }, [sessionId]);

    // Subscribe to updates
    useEffect(() => {
        if (!sessionId) return;

        const channel = supabase.channel(`chat-${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'active_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                const newData = payload.new;
                if (newData.chat_history && Array.isArray(newData.chat_history)) {
                    const newMsgs = newData.chat_history as Message[];
                    setMessages(newMsgs);

                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.sender_id !== userId && !isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, isOpen, userId]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const handleSend = async (content?: string) => {
        const messageContent = content || input.trim();
        if (!messageContent) return;

        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: messageContent,
            timestamp: Date.now(),
            sender_id: userId
        };

        const updatedMessages = [...messages, newMessage];

        // Optimistic update
        setMessages(updatedMessages);
        setInput('');
        setShowReactions(false);

        // Persist
        await supabase.from('active_sessions')
            .update({ chat_history: updatedMessages })
            .eq('id', sessionId);
    };

    const handleReaction = (emoji: string) => {
        handleSend(emoji);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className={`fixed bottom-24 z-50 pointer-events-none flex flex-col items-end ${isRTL ? 'left-4' : 'right-4'}`}>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto overflow-hidden flex flex-col mb-3"
                        style={{ width: '320px', height: '450px' }}
                    >
                        {/* Glass Card Container */}
                        <div className="h-full rounded-2xl overflow-hidden bg-surface-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 flex flex-col">

                            {/* Premium Header */}
                            <div className="relative overflow-hidden">
                                {/* Gradient Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500" />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

                                <div className="relative p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                            {partnerName?.charAt(0) || '💬'}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm">
                                                {partnerName || (isRTL ? 'الدردشة' : 'Chat')}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-white/70 text-xs">
                                                    {isRTL ? 'متصل الآن' : 'Online'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <Minimize2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-surface-900 to-surface-950">
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/20 flex items-center justify-center">
                                            <Heart className="w-8 h-8 text-primary-400" />
                                        </div>
                                        <p className="text-surface-400 text-sm">
                                            {isRTL ? 'ابدأ المحادثة مع شريكك! 💕' : 'Start chatting with your partner! 💕'}
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isMe = msg.sender_id === userId;
                                    const isEmoji = msg.content.length <= 4 && /\p{Emoji}/u.test(msg.content);

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex ${isMe ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                                        >
                                            <div className={`max-w-[80%] ${isEmoji ? '' : 'space-y-1'}`}>
                                                {isEmoji ? (
                                                    <span className="text-4xl">{msg.content}</span>
                                                ) : (
                                                    <div className={`
                                                        rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                                                        ${isMe
                                                            ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-md shadow-lg shadow-primary-500/20'
                                                            : 'bg-surface-800 text-surface-100 rounded-bl-md border border-white/5'}
                                                    `}>
                                                        {msg.content}
                                                    </div>
                                                )}
                                                {!isEmoji && (
                                                    <p className={`text-[10px] text-surface-500 ${isMe ? '' : ''}`}>
                                                        {formatTime(msg.timestamp)}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Reactions */}
                            <AnimatePresence>
                                {showReactions && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="px-4 py-2 bg-surface-800/50 border-t border-white/5 flex justify-center gap-2"
                                    >
                                        {quickReactions.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(emoji)}
                                                className="text-2xl hover:scale-125 transition-transform p-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input Area */}
                            <div className="p-3 bg-surface-900 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    {/* Reactions Toggle */}
                                    <button
                                        onClick={() => setShowReactions(!showReactions)}
                                        className={`p-2 rounded-xl transition-colors ${showReactions
                                            ? 'bg-primary-500/20 text-primary-400'
                                            : 'text-surface-400 hover:bg-surface-800'
                                            }`}
                                    >
                                        <Smile className="w-5 h-5" />
                                    </button>

                                    {/* Input */}
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                                        className="flex-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    />

                                    {/* Send Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleSend()}
                                        disabled={!input.trim()}
                                        className="p-2.5 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
                                    >
                                        <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button - Premium Design */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto relative group"
                >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />

                    {/* Button */}
                    <div className="relative p-4 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full shadow-xl text-white">
                        <MessageCircle className="w-6 h-6" />

                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-surface-900 shadow-lg"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </div>

                    {/* Pulse Animation */}
                    {unreadCount > 0 && (
                        <motion.div
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-primary-500 rounded-full"
                        />
                    )}
                </motion.button>
            )}
        </div>
    );
}
