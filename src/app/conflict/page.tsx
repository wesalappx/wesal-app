'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    Gavel,
    Heart,
    Shield,
    ArrowRight,
    ArrowLeft,
    Mic,
    Check,
    AlertCircle,
    Sparkles,
    ThumbsUp,
    MessageCircle,
    User
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { generateConflictAdvice } from '@/lib/ai';
import { useSettingsStore } from '@/stores/settings-store';
import { useTranslation } from '@/hooks/useTranslation';
import Confetti from '@/components/Confetti';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePairing } from '@/hooks/usePairing';

// Types
type Step = 'intro' | 'rules' | 'topic' | 'perspective-1' | 'perspective-2' | 'analysis' | 'verdict' | 'waiting_partner' | 'joint_input';

interface Perspective {
    text: string;
    emotion: string;
    needs: string[];
}

const rules = [
    { icon: Mic, ar: "نسمع بعض للآخر وما نقاطع", en: "Listen without interrupting" },
    { icon: Heart, ar: "نتكلم باحترام وبدون تجريح", en: "Speak with respect" },
    { icon: Shield, ar: "هدفنا الحل مو المغالبة", en: "Goal is resolution, not winning" },
    { icon: ThumbsUp, ar: "موافقين نطلع بحل يرضينا", en: "Agree to find a mutual solution" }
];

// Helper function to render AI response with proper formatting
const renderFormattedText = (text: string) => {
    // First, clean up the text - remove --- dividers
    const cleanedText = text.replace(/^---+$/gm, '').replace(/---/g, '');
    const lines = cleanedText.split('\n');

    return lines.map((line, i) => {
        let trimmedLine = line.trim();

        // Empty line = spacing
        if (!trimmedLine) return <div key={i} className="h-2" />;

        // Remove any remaining --- 
        trimmedLine = trimmedLine.replace(/---/g, '');

        // Emoji headers (📋, ⚖️, 💡, ✅, 💬, etc.)
        if (/^[📋⚖️💡✅💬🎯📌🔍💭🤝🔴🟡🟢⭐🌟💫✨🔷🔶]/.test(trimmedLine)) {
            // Clean any ** from the header
            const cleanHeader = trimmedLine.replace(/\*\*/g, '');
            return (
                <h3 key={i} className="text-base font-bold text-white mt-5 mb-2 pb-1 border-b border-purple-500/20">
                    {cleanHeader}
                </h3>
            );
        }

        // ## or # Markdown headers - convert to styled headers
        if (trimmedLine.startsWith('#')) {
            const cleanHeader = trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            return (
                <h3 key={i} className="text-base font-bold text-purple-200 mt-4 mb-2">
                    {cleanHeader}
                </h3>
            );
        }

        // Bullet points (-, •, *, or Arabic numbers ١. ٢. ٣.)
        if (/^[-•*]/.test(trimmedLine) || /^[١٢٣٤٥٦٧٨٩\d]+[\.\)]/.test(trimmedLine)) {
            const content = trimmedLine
                .replace(/^[-•*]\s*/, '')
                .replace(/^[١٢٣٤٥٦٧٨٩\d]+[\.\)]\s*/, '');
            return (
                <div key={i} className="flex gap-3 items-start py-1 mr-2">
                    <span className="text-purple-400 mt-1 text-sm">◆</span>
                    <span className="text-surface-200 leading-relaxed">{renderInlineFormatting(content)}</span>
                </div>
            );
        }

        // Labels like "الطرف الأول:" or "من المسؤول:"
        if (trimmedLine.includes(':') && trimmedLine.indexOf(':') < 30) {
            const colonIndex = trimmedLine.indexOf(':');
            const label = trimmedLine.substring(0, colonIndex + 1).replace(/\*\*/g, '');
            const value = trimmedLine.substring(colonIndex + 1).trim();
            return (
                <p key={i} className="text-surface-200 py-1 leading-relaxed">
                    <strong className="text-purple-300">{label}</strong> {renderInlineFormatting(value)}
                </p>
            );
        }

        // Regular paragraph with inline formatting
        return <p key={i} className="text-surface-200 py-1 leading-relaxed">{renderInlineFormatting(trimmedLine)}</p>;
    });
};

// Helper to render inline bold text - strips ** and renders as bold
const renderInlineFormatting = (text: string): React.ReactNode => {
    if (!text) return null;

    // Split by **bold** pattern
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Extract text between ** and render as bold
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        // Also handle any stray * that might be left
        return part.replace(/\*/g, '');
    });
};

export default function ConflictPage() {
    const supabase = createClient();
    const { user } = useAuth();
    const { getStatus } = usePairing();

    const { language } = useSettingsStore();
    const { t } = useTranslation();
    const isRTL = language === 'ar';

    const [coupleId, setCoupleId] = useState<string | null>(null);
    const [isInitiator, setIsInitiator] = useState(false);
    const [mode, setMode] = useState<'solo' | 'joint'>('solo');

    // Joint Mode State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [partnerStatus, setPartnerStatus] = useState<'waiting' | 'joined' | 'submitted'>('waiting');
    const [myInput, setMyInput] = useState('');

    const [step, setStep] = useState<Step>('intro');
    const [topic, setTopic] = useState('');
    const [p1Data, setP1Data] = useState<Perspective>({ text: '', emotion: '', needs: [] });
    const [p2Data, setP2Data] = useState<Perspective>({ text: '', emotion: '', needs: [] });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [aiVerdict, setAiVerdict] = useState<string>('');
    const { playSound } = useSound();

    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Pending session that requires user confirmation before restoring
    const [pendingSession, setPendingSession] = useState<any | null>(null);

    // Chat & Verdict State
    const [messages, setMessages] = useState<any[]>([]); // Deprecated? No using chatHistory
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll when new messages are added
    useEffect(() => {
        if (chatHistory.length > 0) {
            setTimeout(scrollToBottom, 150);
        }
    }, [chatHistory]);

    // Check for existing active session on mount
    useEffect(() => {
        async function checkActiveSession() {
            if (!user) return;
            const status = await getStatus();
            if (status.isPaired && status.coupleId) {
                setCoupleId(status.coupleId);
                if (status.partner?.id) setPartnerId(status.partner.id);

                // Look for active session
                const { data } = await supabase
                    .from('conflict_sessions')
                    .select('*')
                    .eq('couple_id', status.coupleId)
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    // Always require manual confirmation/action
                    setPendingSession(data);
                }
            }
        }
        checkActiveSession();
    }, [user]);

    // Realtime Subscription
    const stepRef = useRef(step);
    stepRef.current = step;

    useEffect(() => {
        if (!sessionId || mode !== 'joint') return;

        const channel = supabase
            .channel(`conflict-${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'conflict_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                const newData = payload.new;

                // Update basic state
                if (newData.topic) setTopic(newData.topic);
                if (newData.chat_history) setChatHistory(newData.chat_history || []);

                // Status transitions - use ref to avoid dependency
                const currentStep = stepRef.current;

                if (newData.status === 'joined' && currentStep === 'waiting_partner') {
                    setStep('joint_input');
                    playSound('pop');
                }

                if (newData.status === 'verdict' && currentStep !== 'verdict') {
                    setStep('verdict');
                    playSound('success');
                    setShowConfetti(true);
                }

                if (newData.status === 'analyzing' && currentStep !== 'analysis') {
                    setStep('analysis');
                }

                // Check submission status
                if (isInitiator) {
                    if (newData.p2_submitted) {
                        setPartnerStatus('submitted');
                        // REMOVED AUTO-ANALYSIS: Wait for user to click button
                    }
                } else {
                    if (newData.p1_submitted) setPartnerStatus('submitted');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, mode, isInitiator]);

    const triggerJointAnalysis = async (sessionData: any) => {
        setIsAnalyzing(true);
        // Set update to analyzing
        await supabase.from('conflict_sessions').update({ status: 'analyzing' }).eq('id', sessionData.id);

        try {
            const p1Text = sessionData.p1_input;
            const p2Text = sessionData.p2_input;

            // Set these locally for the chat context later
            setP1Data({ text: p1Text, emotion: '', needs: [] });
            setP2Data({ text: p2Text, emotion: '', needs: [] });

            const advice = await generateConflictAdvice(
                sessionData.topic,
                p1Text,
                p2Text,
                language === 'ar' ? 'ar' : 'en'
            );

            const initialChat = [{ role: 'assistant', content: advice }];

            // Save verdict and chat to DB - this triggers 'verdict' state for both via RLS
            await supabase.from('conflict_sessions').update({
                status: 'verdict',
                verdict: advice,
                chat_history: initialChat
            }).eq('id', sessionData.id);

        } catch (error) {
            console.error('Joint Analysis Error', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualAnalysisTrigger = async () => {
        if (!sessionId) return;
        setIsAnalyzing(true);
        playSound('whoosh');

        try {
            // Fetch the latest session data to ensure we have both inputs
            const { data: sessionData, error } = await supabase
                .from('conflict_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error || !sessionData) throw error || new Error('Session data not found');

            await triggerJointAnalysis(sessionData);

        } catch (error) {
            console.error('Manual Joint Analysis Error', error);
            alert(language === 'ar' ? 'حدث خطأ أثناء تحليل المشكلة.' : 'Error analyzing conflict.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateJointSession = async () => {
        if (!user) {
            alert(language === 'ar' ? 'عفواً، يجب عليك تسجيل الدخول أولاً' : 'Please login first');
            return;
        }
        if (!coupleId) {
            alert(language === 'ar' ? 'عفواً، يجب عليك الارتباط بشريك أولاً' : 'Please pair with a partner first');
            return;
        }

        playSound('click');
        try {
            // Create session
            const { data, error } = await supabase
                .from('conflict_sessions')
                .insert({
                    couple_id: coupleId,
                    initiator_id: user.id,
                    status: 'created',
                    topic: '' // Topic set later? Or we should ask for it? Current flow asks topic set later.
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setSessionId(data.id);
                setIsInitiator(true);
                setMode('joint');
                setStep('waiting_partner'); // Flow: Intro -> Waiting -> Partner Joins -> Rules -> Topic

                // Notify partner? 
                if (partnerId) {
                    await supabase.from('notifications').insert({
                        user_id: partnerId, // Partner needs to receive this
                        type: 'conflict_invite',
                        title_ar: 'شريكك دعاك لجلسة "المستشار"',
                        title_en: 'Partner invited you to "The Consultant"',
                        body_ar: 'هناك موضوع يحتاج نقاش هادئ، انقر للدخول.',
                        body_en: 'There is a topic to discuss calmly. Click to join.',
                        data: { session_id: data.id, url: '/conflict' }
                    });
                }
            }
        } catch (err: any) {
            console.error('Failed to create joint session', err);
            // Show visible error to user
            alert(language === 'ar'
                ? `حدث خطأ: ${err.message || 'تأكد من إعداد قاعدة البيانات'}`
                : `Error: ${err.message || 'Check database setup'}`
            );
        }
    };

    const handleStart = () => {
        playSound('click');
        setStep('rules');
    };

    const handleRulesAgreed = () => {
        playSound('success');
        setStep('topic');
    };

    const handleTopicSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            if (mode === 'joint' && sessionId) {
                // Update topic in DB for joint mode
                supabase.from('conflict_sessions').update({ topic: topic }).eq('id', sessionId);
                // We don't advance step here locally for valid joint flow, we wait for partner? 
                // Actually design says: Rules -> Topic -> Waiting.
                // So Initiator sets topic THEN waits.
                // Actually the logic is: Intro -> Create Session -> Waiting Partner -> Partner Joins -> Rules -> Topic?
                // No, currently: Call Partner -> Create Session -> Waiting -> Partner Joins -> Joint Input.
                // Wait, topic is needed!
                // Let's assume Topic is set by Initiator BEFORE calling partner? Or during joint input?
                // Current flow in UI: Intro -> Call Partner.
                // We are skipping Rules and Topic in Joint Mode currently! That's a gap!
                // Correction: Let's assume for now we jump to input. But ideally we want Topic.
                // Let's stick to the simple flow implemented: Jump to Joint Input where users enter their "Perspective". 
                // There is a 'topic' input in joint_input? No it displays topic.
                // The 'topic' logic is currently missing in the joint flow I built.
                // Let's allow Topic input inside the "Joint Input" screen if it's empty? Or simpler: Initiator inputs topic before calling?
                // Let's just fix the handlers first.
            } else {
                setStep('perspective-1');
            }
            playSound('pop');
        }
    };

    const handlePerspectiveSubmit = (role: 'p1' | 'p2', text: string) => {
        if (!text.trim()) return;
        playSound('pop');
        if (role === 'p1') {
            setP1Data({ ...p1Data, text });
            setStep('perspective-2');
        } else {
            setP2Data({ ...p2Data, text });
            setStep('analysis');
            startAnalysis(text);
        }
    };


    // Chat State Update (for database syncing in Joint Mode)
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const userMsg = newMessage;
        setNewMessage('');
        const newHistory = [...chatHistory, { role: 'user' as const, content: userMsg }];
        setChatHistory(newHistory);
        setIsTyping(true);
        setTimeout(scrollToBottom, 100);

        try {
            // Joint Mode Sync: Save user message to DB
            if (mode === 'joint' && sessionId) {
                await supabase.from('conflict_sessions').update({ chat_history: newHistory }).eq('id', sessionId);
            }

            const apiHistory = newHistory.map(h => ({ role: h.role, content: h.content }));

            const aiResponse = await generateConflictAdvice(
                topic,
                p1Data.text,
                p2Data.text,
                language === 'ar' ? 'ar' : 'en',
                apiHistory
            );

            const finalHistory = [...newHistory, { role: 'assistant' as const, content: aiResponse }];
            setChatHistory(finalHistory);

            // Joint Mode Sync: Save AI response
            if (mode === 'joint' && sessionId) {
                await supabase.from('conflict_sessions').update({ chat_history: finalHistory }).eq('id', sessionId);
            }

            playSound('pop');
        } catch (error) {
            console.error('Chat Error', error);
        } finally {
            setIsTyping(false);
            setTimeout(scrollToBottom, 100);
        }
    };


    const startAnalysis = async (p2Text: string) => {
        // Solo Mode Analysis
        setIsAnalyzing(true);
        playSound('whoosh');

        try {
            const advice = await generateConflictAdvice(
                topic,
                p1Data.text,
                p2Text,
                language === 'ar' ? 'ar' : 'en'
            );

            setChatHistory([{ role: 'assistant', content: advice }]);
            setStep('verdict');
            playSound('success');
            setShowConfetti(true);
        } catch (error) {
            console.error('AI Error', error);
            const errorMsg = language === 'ar' ? 'حدث خطأ في الاتصال بالمستشار. حاول مرة أخرى.' : 'Error connecting to consultant.';
            setChatHistory([{ role: 'assistant', content: errorMsg }]);
            setStep('verdict');
        } finally {
            setIsAnalyzing(false);
        }
    };


    return (
        <main className="min-h-screen p-4 pb-44 relative overflow-hidden font-sans">
            <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

            {/* Background */}
            <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md mx-auto pt-4 relative z-10">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6"
                >
                    {isRTL ? <ArrowRight className="w-5 h-5 transform rotate-180" /> : <ArrowLeft className="w-5 h-5" />}
                    {t('nav.home') || (language === 'ar' ? 'الرئيسية' : 'Home')}
                </Link>

                <AnimatePresence mode="wait">
                    {/* WAITING FOR PARTNER STEP */}
                    {step === 'waiting_partner' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center pt-12 flex flex-col items-center justify-center h-[50vh]"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-ping" />
                                <div className="w-24 h-24 relative bg-surface-800 border-2 border-purple-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                    <MessageCircle className="w-10 h-10 text-white animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mt-8 mb-4">
                                {language === 'ar' ? 'في انتظار انضمام الشريك...' : 'Waiting for Partner...'}
                            </h2>
                            <div className="bg-surface-800/80 p-6 rounded-2xl border border-surface-700 max-w-sm">
                                <p className="text-surface-300 leading-relaxed">
                                    {language === 'ar'
                                        ? 'اطلب من شريكك فتح صفحة "المستشار" في جواله الآن.'
                                        : 'Ask your partner to open the "Consultant" page on their phone now.'}
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-400 font-medium">
                                    <Sparkles className="w-4 h-4" />
                                    {language === 'ar' ? 'سيتم الربط تلقائياً' : 'Auto-connecting...'}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* JOINT INPUT STEP */}
                    {step === 'joint_input' && (
                        <motion.div
                            key="joint_input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col"
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold mb-1">
                                    {topic}
                                </h2>
                                <p className="text-xs text-surface-400">
                                    {language === 'ar' ? 'اكتب وجهة نظرك بكل صراحة.' : 'Write your perspective honestly.'}
                                </p>
                            </div>

                            {hasSubmitted ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                        <Check className="w-10 h-10 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">
                                        {language === 'ar' ? 'وصلت وجهة نظرك!' : 'Perspective Received!'}
                                    </h3>

                                    {partnerStatus === 'submitted' && isInitiator ? (
                                        <div className="animate-in fade-in zoom-in duration-300">
                                            <p className="text-purple-300 mb-6 font-medium">
                                                {language === 'ar' ? 'وصل رد الشريك! جاهز للتحليل؟' : 'Partner responded! Ready to analyze?'}
                                            </p>
                                            <button
                                                onClick={handleManualAnalysisTrigger}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 animate-pulse hover:animate-none transform hover:scale-105 transition-all"
                                            >
                                                {language === 'ar' ? 'تحليل المشكلة الآن ✨' : 'Analyze Conflict Now ✨'}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-surface-400 mb-8 animate-pulse">
                                            {language === 'ar' ? 'ننتظر الشريك يخلص كتابة...' : 'Waiting for partner to finish typing...'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        className="w-full h-48 bg-surface-800/50 border border-surface-700 rounded-2xl p-4 text-base focus:border-purple-500 focus:outline-none resize-none mb-4"
                                        placeholder={language === 'ar' ? "اشرح مشاعرك من زاويتك.." : "Explain your feelings..."}
                                        value={myInput}
                                        onChange={(e) => setMyInput(e.target.value)}
                                    />

                                    <div className="mt-auto">
                                        <button
                                            onClick={async () => {
                                                if (!myInput.trim() || !sessionId) return;
                                                setHasSubmitted(true);
                                                // Submit my input
                                                const update = isInitiator
                                                    ? { p1_input: myInput, p1_submitted: true }
                                                    : { p2_input: myInput, p2_submitted: true };

                                                await supabase.from('conflict_sessions').update(update).eq('id', sessionId);
                                            }}
                                            disabled={!myInput.trim()}
                                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all"
                                        >
                                            {language === 'ar' ? 'إرسال للمستشار' : 'Submit to Consultant'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                    {/* INTRO STEP */}
                    {step === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center pt-8"
                        >
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Gavel className="w-12 h-12 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                                {language === 'ar' ? 'المستشار ⚖️' : 'The Consultant ⚖️'}
                            </h1>
                            <p className="text-surface-300 mb-8 leading-relaxed">
                                {language === 'ar'
                                    ? 'عندكم اختلاف وتبون حل؟ المستشار يستخدم الذكاء الاصطناعي ليحكم بينكم بالعدل ويقرب وجهات النظر.'
                                    : 'Have a conflict? The Consultant uses AI to judge fairly and bring you closer together.'}
                            </p>

                            <div className="space-y-4">
                                {/* Resume Session Banner - shown when there's a pending session */}
                                {pendingSession && (
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
                                        <p className="text-amber-300 text-sm mb-3">
                                            {pendingSession.initiator_id === user?.id
                                                ? (language === 'ar' ? 'لديك جلسة سابقة لم تكتمل. هل تريد استكمالها؟' : 'You have an unfinished session. Resume?')
                                                : (language === 'ar' ? `دعوة من الشريك لنقاش موضوع "${pendingSession.topic || 'بدون عنوان'}"` : `Invitation from partner to discuss "${pendingSession.topic || 'Untitled'}"`)
                                            }
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={async () => {
                                                    // Resume the pending session
                                                    setMode('joint');
                                                    setSessionId(pendingSession.id);
                                                    setTopic(pendingSession.topic || '');

                                                    // Determine role
                                                    const amInitiator = pendingSession.initiator_id === user?.id;
                                                    setIsInitiator(amInitiator);

                                                    if (pendingSession.status === 'created') {
                                                        if (amInitiator) {
                                                            setStep('waiting_partner');
                                                        } else {
                                                            // Partner joining for first time
                                                            await supabase.from('conflict_sessions').update({ status: 'joined' }).eq('id', pendingSession.id);
                                                            setStep('rules'); // Or joint_input depending on flow preference
                                                        }
                                                    } else if (pendingSession.status === 'joined' || pendingSession.status === 'inputting') {
                                                        setStep('joint_input');
                                                        if (amInitiator ? pendingSession.p1_submitted : pendingSession.p2_submitted) {
                                                            setHasSubmitted(true);
                                                        }
                                                    } else if (pendingSession.status === 'analyzing') {
                                                        setStep('analysis');
                                                    } else if (pendingSession.status === 'verdict') {
                                                        setStep('verdict');
                                                        if (pendingSession.chat_history) setChatHistory(pendingSession.chat_history);
                                                    }
                                                    setPendingSession(null);
                                                    playSound('pop');
                                                }}
                                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all"
                                            >
                                                {pendingSession.initiator_id === user?.id
                                                    ? (language === 'ar' ? 'استكمال' : 'Resume')
                                                    : (language === 'ar' ? 'قبول الدعوة' : 'Accept Invite')
                                                }
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    // Discard the session
                                                    await supabase.from('conflict_sessions').update({ status: 'completed' }).eq('id', pendingSession.id);
                                                    setPendingSession(null);
                                                }}
                                                className="flex-1 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-xl transition-all"
                                            >
                                                {language === 'ar' ? 'تجاهل' : 'Discard'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setMode('solo');
                                        handleStart();
                                    }}
                                    className="w-full py-4 bg-surface-700 hover:bg-surface-600 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 border border-surface-600"
                                >
                                    <User className="w-5 h-5" />
                                    {language === 'ar' ? 'جلسة فردية (جهازي فقط)' : 'Solo Session (My Device)'}
                                </button>
                                <div className="text-xs text-surface-500">
                                    {language === 'ar' ? 'ممتازة إذا كنتم بجانب بعض وتستخدمون جوال واحد' : 'Best if you are together using one phone'}
                                </div>

                                <button
                                    onClick={() => handleCreateJointSession()}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    {language === 'ar' ? 'دعوة الشريك (عن بعد)' : 'Call Partner (Remote)'}
                                </button>
                                <div className="text-xs text-surface-500">
                                    {language === 'ar' ? 'كتابة منفصلة من الطرفين، وحل مشترك من المستشار.' : 'Separate input from both parties, joint resolution by The Consultant.'}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* RULES STEP */}
                    {step === 'rules' && (
                        <motion.div
                            key="rules"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">
                                {language === 'ar' ? 'اتفاقية الجلسة 🤝' : 'Session Rules 🤝'}
                            </h2>
                            <div className="space-y-4 mb-8">
                                {rules.map((rule, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-surface-800/80 p-4 rounded-2xl flex items-center gap-4 border border-surface-700"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                            <rule.icon className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <span className="font-medium text-surface-200">
                                            {language === 'ar' ? rule.ar : rule.en}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                            <button
                                onClick={handleRulesAgreed}
                                className="w-full py-4 bg-surface-700 hover:bg-surface-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                {language === 'ar' ? 'تم، موافقين' : 'Agreed'}
                            </button>
                        </motion.div>
                    )}

                    {/* TOPIC STEP */}
                    {step === 'topic' && (
                        <motion.div
                            key="topic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {language === 'ar' ? 'وش الموضوع؟' : 'What is the issue?'}
                                </h2>
                                <p className="text-surface-400">
                                    {language === 'ar' ? 'اكتبوا عنوان للمشكلة (مثلاً: المصاريف، ترتيب البيت..)' : 'Enter the topic (e.g., finances, chores...)'}
                                </p>
                            </div>

                            <form onSubmit={handleTopicSubmit}>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder={language === 'ar' ? "اكتب الموضوع هنا..." : "Type topic here..."}
                                    className="w-full bg-surface-800 border-2 border-surface-700 rounded-2xl p-4 text-lg text-center focus:border-purple-500 focus:outline-none transition-colors mb-6"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!topic.trim()}
                                    className="w-full py-4 bg-purple-600 disabled:bg-surface-700 disabled:text-surface-500 text-white rounded-2xl font-bold transition-all"
                                >
                                    {language === 'ar' ? 'التالي' : 'Next'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* PERSPECTIVE STEPS */}
                    {(step === 'perspective-1' || step === 'perspective-2') && (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${step === 'perspective-1' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                    {step === 'perspective-1' ? '1' : '2'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        {language === 'ar'
                                            ? (step === 'perspective-1' ? 'دور الطرف الأول' : 'دور الطرف الثاني')
                                            : (step === 'perspective-1' ? 'Partner 1' : 'Partner 2')}
                                    </h2>
                                    <p className="text-sm text-surface-400">
                                        {language === 'ar'
                                            ? (step === 'perspective-1' ? 'الطرف الآخر يغمض عيونه 🙈' : 'الآن دورك تتكلم')
                                            : (step === 'perspective-1' ? 'Other partner close eyes 🙈' : 'Your turn to speak')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <textarea
                                    className="w-full h-48 bg-surface-800/50 border border-surface-700 rounded-2xl p-4 text-base focus:border-purple-500 focus:outline-none resize-none mb-4"
                                    placeholder={language === 'ar' ? "اشرح وجهة نظرك.. ليش متضايق؟ وش اللي صار بالضبط؟ خذ راحتك.." : "Explain your perspective... Why are you upset? What happened?"}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePerspectiveSubmit(
                                                step === 'perspective-1' ? 'p1' : 'p2',
                                                (e.target as HTMLTextAreaElement).value
                                            );
                                        }
                                    }}
                                ></textarea>
                                <p className="text-xs text-surface-500 flex items-center gap-1 mb-6">
                                    <Shield className="w-3 h-3" />
                                    {language === 'ar' ? 'كلامك محفوظ وسري' : 'Your words are private'}
                                </p>
                            </div>

                            <button
                                onClick={(e) => {
                                    const textarea = document.querySelector('textarea');
                                    if (textarea) handlePerspectiveSubmit(step === 'perspective-1' ? 'p1' : 'p2', textarea.value);
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/20"
                            >
                                {language === 'ar'
                                    ? (step === 'perspective-1' ? 'تم، دور الطرف الثاني' : 'تم، نبي الحكم')
                                    : (step === 'perspective-1' ? 'Done, Next Partner' : 'Done, Get Verdict')}
                            </button>
                        </motion.div>
                    )}

                    {/* ANALYSIS STEP */}
                    {step === 'analysis' && (
                        <motion.div
                            key="analysis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                className="w-32 h-32 mx-auto mb-8 rounded-full bg-surface-800 flex items-center justify-center relative"
                            >
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <Scale className="w-12 h-12 text-purple-400" />
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-4 animate-pulse">
                                {language === 'ar' ? 'جاري التحليل والتشاور مع الذكاء الاصطناعي...' : 'Consulting AI Judge...'}
                            </h2>
                            <p className="text-surface-400">
                                {language === 'ar' ? 'المستشار يدرس القضية بكل حيادية...' : 'The Consultant is reviewing the case neutrally...'}
                            </p>
                        </motion.div>
                    )}

                    {/* VERDICT / CHAT STEP - Premium Redesign */}
                    {step === 'verdict' && (
                        <div className="fixed inset-0 bg-surface-950 z-50 flex flex-col font-sans">
                            {/* Decorative Background Mesh */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
                                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
                            </div>

                            {/* Top Header - Glassmorphic */}
                            <div className="relative shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/5 bg-surface-900/60 backdrop-blur-xl z-10">
                                <Link href="/dashboard" className="flex items-center gap-2 text-surface-400 hover:text-white transition-all group">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <ArrowLeft className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium">{language === 'ar' ? 'خروج' : 'Exit'}</span>
                                </Link>

                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2">
                                        <Gavel className="w-4 h-4 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                        <span className="text-sm font-bold text-white tracking-wide">
                                            {language === 'ar' ? 'المستشار' : 'CONSULTANT'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-purple-300/60 font-medium tracking-wider uppercase">
                                        {language === 'ar' ? 'تحكيم الذكاء الاصطناعي' : 'AI Mediation'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => {
                                        if (window.confirm(language === 'ar' ? 'هل أنت متأكد من إنهاء الجلسة؟' : 'Are you sure you want to end session?')) {
                                            setStep('intro');
                                            setChatHistory([]);
                                            setTopic('');
                                            setP1Data({ text: '', emotion: '', needs: [] });
                                            setP2Data({ text: '', emotion: '', needs: [] });
                                        }
                                    }}
                                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-full"
                                >
                                    {language === 'ar' ? 'إنهاء' : 'End'}
                                </button>
                            </div>

                            {/* Chat Messages - Scrollable Area */}
                            <div className="flex-1 overflow-y-auto px-4 py-6 relative z-0 custom-scrollbar">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    {chatHistory.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 30,
                                                delay: idx * 0.1
                                            }}
                                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20'
                                                : 'bg-gradient-to-br from-purple-600 to-fuchsia-700 shadow-purple-500/20'
                                                }`}>
                                                {msg.role === 'user'
                                                    ? <User className="w-5 h-5 text-white" />
                                                    : <Gavel className="w-5 h-5 text-white" />
                                                }
                                            </div>

                                            {/* Message Content */}
                                            {msg.role === 'assistant' && idx === 0 ? (
                                                // First AI response - Hero Verdict Card
                                                <div className="flex-1 max-w-[90%]">
                                                    <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-surface-800/80 border border-white/10 shadow-xl group hover:border-purple-500/30 transition-colors duration-500">
                                                        {/* Card Glow */}
                                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[50px] group-hover:bg-purple-500/30 transition-all duration-500" />

                                                        {/* Header */}
                                                        <div className="relative p-5 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30">
                                                                    <Scale className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-base font-bold text-white tracking-wide">
                                                                        {language === 'ar' ? 'حكم المستشار' : 'Official Verdict'}
                                                                    </h3>
                                                                    <p className="text-[10px] text-purple-200/60 uppercase tracking-wider font-semibold">
                                                                        {language === 'ar' ? 'تحليل محايد' : 'Neutral Analysis'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="relative p-5 text-surface-200 text-sm leading-relaxed">
                                                            {renderFormattedText(msg.content)}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="relative p-5 pt-0 mt-2 flex gap-3">
                                                            <button
                                                                onClick={async () => {
                                                                    if (!sessionId) return;
                                                                    await supabase.from('conflict_sessions').update({ status: 'completed' }).eq('id', sessionId);
                                                                    playSound('success');
                                                                    setStep('intro');
                                                                    setShowConfetti(true);
                                                                }}
                                                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 hover:from-emerald-600/30 hover:to-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                            >
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                                {language === 'ar' ? 'حل عادل' : 'Fair Solution'}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setNewMessage(language === 'ar' ? 'أحتاج توضيح أكثر...' : 'I need more clarification...');
                                                                }}
                                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-surface-300 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wide transition-all hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                                                            >
                                                                {language === 'ar' ? 'توضيح' : 'Clarification'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : msg.role === 'assistant' ? (
                                                // Follow-up AI responses - Same styled card as first
                                                <div className="flex-1 max-w-[90%]">
                                                    <div className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-surface-800/80 border border-white/10 shadow-xl">
                                                        {/* Card Glow */}
                                                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/15 rounded-full blur-[50px]" />

                                                        {/* Header */}
                                                        <div className="relative p-4 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-transparent">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                                                                    <MessageCircle className="w-4 h-4" />
                                                                </div>
                                                                <span className="text-sm font-semibold text-white">
                                                                    {language === 'ar' ? 'رد المستشار' : 'Consultant Reply'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="relative p-5 text-surface-200 text-sm leading-relaxed">
                                                            {renderFormattedText(msg.content)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // User messages - Simple bubble
                                                <div className="relative max-w-[85%] px-5 py-3.5 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
                                                    {msg.content}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                                <Gavel className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="px-5 py-4 rounded-2xl rounded-tl-none bg-surface-800/80 backdrop-blur-sm border border-white/5 flex gap-2 items-center">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Bar - Premium Float Effect */}
                            <div className="relative shrink-0 p-5 bg-gradient-to-t from-surface-950 via-surface-950/95 to-transparent z-10">
                                <div className="max-w-2xl mx-auto flex gap-3 relative">
                                    <div className="absolute inset-0 bg-purple-500/5 blur-xl rounded-full transform scale-x-110 translate-y-2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !isTyping && newMessage.trim()) handleSendMessage();
                                        }}
                                        placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                                        className="relative flex-1 bg-surface-800/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:bg-surface-800 transition-all shadow-xl"
                                        disabled={isTyping}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || isTyping}
                                        className="relative w-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg shadow-purple-500/25 active:scale-95 group"
                                    >
                                        <ArrowLeft className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'} group-hover:scale-110 transition-transform`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>
        </main>
    );
}
