'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/stores/settings-store';

interface Message {
    id: string;
    role: 'user' | 'partner' | 'system';
    content: string;
    timestamp: number;
}

interface SessionChatProps {
    sessionId: string;
    userId: string;
    partnerName?: string;
    compact?: boolean; // If true, shows as a floating bubbles overlay? Or just smaller.
}

export default function SessionChat({ sessionId, userId, partnerName, compact = false }: SessionChatProps) {
    const supabase = createClient();
    const { language } = useSettingsStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
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

                    // Check if last message is from partner and we are closed
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg && lastMsg.role !== 'user' && !isOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, isOpen]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user', // We map this later to actual user IDs if needed, but 'role' is enough for local logic? 
            // Better to store sender_id in the message for clarity, but for this simplified chat:
            // Actually, we must distinguish 'Me' vs 'Partner'.
            // In the DB we store sender_id.
            // Let's refine the type to store sender_id.
            content: input.trim(),
            timestamp: Date.now()
        };

        // We need to fetch current history first to append safely? 
        // Or Optimistic update?
        // Let's do optimistic + DB append. 
        // NOTE: Realtime race conditions exist. For this scale, array append via RPC is best, 
        // but for simplicity we read-write or assume low frequency.
        // Better: Just update the JSONB column.

        const updatedMessages = [...messages, { ...newMessage, sender_id: userId }]; // Add sender_id to actual object

        // Optimistic
        setMessages(updatedMessages as any);
        setInput('');

        // Persist
        await supabase.from('active_sessions')
            .update({ chat_history: updatedMessages })
            .eq('id', sessionId);
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-end sm:items-center px-4 pb-4`}>
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-surface-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden flex flex-col"
                        style={{ height: '50vh', maxHeight: '500px' }}
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-primary-400" />
                                {partnerName ? `Chat with ${partnerName}` : 'Live Chat'}
                            </span>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-surface-400">
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <p className="text-center text-xs text-surface-500 mt-4">No messages yet. Say hi! 👋</p>
                            )}
                            {messages.map((msg: any) => {
                                const isMe = msg.sender_id === userId;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed
                                            ${isMe
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-surface-700 text-surface-100 rounded-bl-none'}
                                        `}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={language === 'ar' ? "اكتب رسالة..." : "Type a message..."}
                                className="flex-1 bg-surface-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 bg-primary-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-500 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto relative p-4 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full shadow-lg shadow-primary-500/30 text-white group"
                >
                    <MessageCircle className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-surface-950">
                            {unreadCount}
                        </span>
                    )}
                </motion.button>
            )}
        </div>
    );
}
