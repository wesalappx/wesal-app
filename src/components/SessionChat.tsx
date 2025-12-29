import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, MessageCircle, X, Minimize2, Heart, Smile, Sparkles } from 'lucide-react';
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
        <>
            {/* Overlay Container - Covers logic for positioning */}
            <div className={`fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:items-end sm:p-6`}>

                {/* Chat Window (Bottom Sheet on Mobile, Sidebar on Desktop) */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop for mobile */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto sm:hidden"
                            />

                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="pointer-events-auto w-full sm:w-[380px] h-[70vh] sm:h-[600px] bg-surface-900/95 backdrop-blur-2xl border-t sm:border border-white/15 sm:rounded-3xl rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col relative z-50"
                            >
                                {/* Premium Header */}
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold shadow-inner">
                                            {partnerName?.charAt(0) || '💬'}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-sm">
                                                {partnerName || (isRTL ? 'الدردشة' : 'Chat')}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                                <span className="text-emerald-400/80 text-xs font-medium">
                                                    {isRTL ? 'متصل الآن' : 'Online'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-surface-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-900/50">
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                                            <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center">
                                                <MessageCircle className="w-10 h-10 text-primary-400" />
                                            </div>
                                            <p className="text-surface-400 text-sm max-w-[200px]">
                                                {isRTL ? 'مساحتكم الخاصة للمحادثة أثناء اللعب' : 'Your private space to chat while playing'}
                                            </p>
                                        </div>
                                    )}

                                    {messages.map((msg, index) => {
                                        const isMe = msg.sender_id === userId;
                                        const isEmoji = msg.content.length <= 4 && /\p{Emoji}/u.test(msg.content);

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`flex ${isMe ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                                            >
                                                <div className={`max-w-[85%] ${isEmoji ? '' : 'space-y-1'}`}>
                                                    {isEmoji ? (
                                                        <span className="text-5xl drop-shadow-lg block p-2">{msg.content}</span>
                                                    ) : (
                                                        <div className={`
                                                            rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                                                            ${isMe
                                                                ? 'bg-primary-600 text-white rounded-br-sm'
                                                                : 'bg-surface-800 text-surface-100 rounded-bl-sm border border-white/5'}
                                                        `}>
                                                            {msg.content}
                                                        </div>
                                                    )}
                                                    {!isEmoji && (
                                                        <p className={`text-[10px] text-surface-500 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(msg.timestamp)}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-surface-800/80 backdrop-blur-md border-t border-white/10 pb-8 sm:pb-4">
                                    <div className="flex items-end gap-2">
                                        {/* Reactions */}
                                        <div className="relative">
                                            <AnimatePresence>
                                                {showReactions && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                                        className="absolute bottom-full mb-3 left-0 bg-surface-800 border border-white/10 rounded-2xl p-2 shadow-xl flex flex-wrap gap-1 w-64 z-50"
                                                    >
                                                        {quickReactions.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(emoji)}
                                                                className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-xl"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <button
                                                onClick={() => setShowReactions(!showReactions)}
                                                className={`p-3 rounded-2xl transition-all ${showReactions
                                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                                    : 'bg-surface-700/50 text-surface-400 hover:text-white hover:bg-surface-700'
                                                    }`}
                                            >
                                                <Smile className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {/* Input Field */}
                                        <div className="flex-1 bg-surface-700/30 border border-white/10 rounded-2xl p-1 flex items-center focus-within:bg-surface-700/50 focus-within:border-primary-500/50 transition-all">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
                                                className="flex-1 bg-transparent px-4 py-3 text-white placeholder-surface-500 focus:outline-none text-sm"
                                                dir={isRTL ? 'rtl' : 'ltr'}
                                            />
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!input.trim()}
                                                className="p-3 bg-primary-500 rounded-xl text-white disabled:opacity-0 disabled:scale-75 transition-all shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95"
                                            >
                                                <ArrowUp className={`w-5 h-5 ${isRTL ? '' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Toggle Button - Only visible when closed */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ x: isRTL ? -100 : 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? -100 : 100, opacity: 0 }}
                        whileHover={{ x: isRTL ? 5 : -5 }}
                        onClick={() => setIsOpen(true)}
                        className={`fixed bottom-24 ${isRTL ? 'left-0 rounded-r-2xl pr-4 pl-3' : 'right-0 rounded-l-2xl pl-4 pr-3'} z-40 py-3 bg-gradient-to-r from-primary-600 to-accent-600 shadow-xl shadow-black/20 flex items-center gap-3 text-white border-y border-white/10 ${isRTL ? 'border-r' : 'border-l'}`}
                    >
                        {/* Unread Badge */}
                        <AnimatePresence>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="bg-red-500 text-[10px] font-bold h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center border border-white/10 shadow-sm"
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        <span className="text-sm font-bold tracking-wide hidden sm:inline">
                            {isRTL ? 'المحادثة' : 'Chat'}
                        </span>
                        <MessageCircle className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
