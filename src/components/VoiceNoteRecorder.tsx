'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Check, X } from 'lucide-react';

interface VoiceNoteRecorderProps {
    onSave: (audioBlob: Blob, duration: number) => void;
    maxDuration?: number; // seconds
}

export default function VoiceNoteRecorder({
    onSave,
    maxDuration = 120 // 2 minutes default
}: VoiceNoteRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= maxDuration) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('لم نتمكن من الوصول للميكروفون. يرجى التحقق من الأذونات.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const playRecording = () => {
        if (audioBlob && !isPlaying) {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                setPlaybackTime(0);
            };

            audio.ontimeupdate = () => {
                setPlaybackTime(Math.floor(audio.currentTime));
            };

            audio.play();
            setIsPlaying(true);
        } else if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        setPlaybackTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    const saveRecording = () => {
        if (audioBlob) {
            onSave(audioBlob, recordingTime);
            deleteRecording();
        }
    };

    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <AnimatePresence mode="wait">
                {!audioBlob ? (
                    // Recording Mode
                    <motion.div
                        key="recording"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        {/* Waveform Animation */}
                        <div className="h-16 flex items-center justify-center gap-1 mb-4">
                            {isRecording ? (
                                Array.from({ length: 20 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: [10, 30 + Math.random() * 20, 10],
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.05,
                                        }}
                                        className="w-1 bg-gradient-to-t from-primary-500 to-accent-500 rounded-full"
                                    />
                                ))
                            ) : (
                                <Mic className="w-10 h-10 text-surface-500" />
                            )}
                        </div>

                        {/* Timer */}
                        <p className={`text-2xl font-mono mb-4 ${isRecording ? 'text-primary-400' : 'text-surface-500'}`}>
                            {formatTime(recordingTime)} / {formatTime(maxDuration)}
                        </p>

                        {/* Progress Bar */}
                        {isRecording && (
                            <div className="h-1 bg-surface-700 rounded-full mb-4 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${(recordingTime / maxDuration) * 100}%` }}
                                />
                            </div>
                        )}

                        {/* Record Button */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg
                ${isRecording
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-gradient-to-br from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600'
                                }`}
                        >
                            {isRecording ? (
                                <Square className="w-6 h-6 text-white" />
                            ) : (
                                <Mic className="w-7 h-7 text-white" />
                            )}
                        </button>

                        <p className="text-sm text-surface-500 mt-3">
                            {isRecording ? 'اضغط للإيقاف' : 'اضغط للتسجيل'}
                        </p>
                    </motion.div>
                ) : (
                    // Playback Mode
                    <motion.div
                        key="playback"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center"
                    >
                        {/* Playback Info */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button
                                onClick={playRecording}
                                className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors shadow-lg"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white mr-[-2px]" />
                                )}
                            </button>
                            <div className="text-right">
                                <p className="text-lg font-mono text-white">
                                    {formatTime(playbackTime)} / {formatTime(recordingTime)}
                                </p>
                                <p className="text-sm text-surface-400">رسالة صوتية</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-surface-700 rounded-full mb-6 overflow-hidden">
                            <motion.div
                                className="h-full bg-primary-500"
                                style={{ width: `${(playbackTime / recordingTime) * 100}%` }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={deleteRecording}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                حذف
                            </button>
                            <button
                                onClick={saveRecording}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                            >
                                <Check className="w-5 h-5" />
                                حفظ
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Mini Voice Note Player Component
export function VoiceNotePlayer({
    audioUrl,
    duration,
    onDelete
}: {
    audioUrl: string;
    duration: number;
    onDelete?: () => void;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl);
            audioRef.current.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };
            audioRef.current.ontimeupdate = () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            };
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors"
            >
                {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                ) : (
                    <Play className="w-4 h-4 text-white mr-[-1px]" />
                )}
            </button>

            <div className="flex-1">
                <div className="h-1 bg-surface-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            </div>

            <span className="text-sm text-primary-300 font-mono min-w-[40px]">
                {formatTime(isPlaying ? currentTime : duration)}
            </span>

            {onDelete && (
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
