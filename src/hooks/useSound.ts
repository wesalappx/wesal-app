'use client';

import { useCallback, useRef } from 'react';

type SoundType = 'click' | 'success' | 'whoosh' | 'pop' | 'heartbeat' | 'romantic';

// Web Audio API based sound generation
export function useSound() {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    const playSound = useCallback((type: SoundType) => {
        try {
            const ctx = getAudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            switch (type) {
                case 'click':
                    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.1);
                    break;

                case 'success':
                    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
                    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.4);
                    break;

                case 'whoosh':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
                    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
                    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.3);
                    break;

                case 'pop':
                    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.05);
                    break;

                case 'heartbeat':
                    oscillator.frequency.setValueAtTime(80, ctx.currentTime);
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    oscillator.start(ctx.currentTime);
                    oscillator.stop(ctx.currentTime + 0.15);
                    // Second beat
                    setTimeout(() => {
                        const osc2 = ctx.createOscillator();
                        const gain2 = ctx.createGain();
                        osc2.connect(gain2);
                        gain2.connect(ctx.destination);
                        osc2.frequency.setValueAtTime(60, ctx.currentTime);
                        gain2.gain.setValueAtTime(0.25, ctx.currentTime);
                        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                        osc2.start(ctx.currentTime);
                        osc2.stop(ctx.currentTime + 0.15);
                    }, 150);
                    break;

                case 'romantic':
                    // Soft romantic chime - ascending melody
                    oscillator.type = 'sine';
                    const notes = [392, 440, 523.25, 659.25]; // G4, A4, C5, E5
                    notes.forEach((note, i) => {
                        setTimeout(() => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();
                            osc.type = 'sine';
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.frequency.setValueAtTime(note, ctx.currentTime);
                            gain.gain.setValueAtTime(0.12, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                            osc.start(ctx.currentTime);
                            osc.stop(ctx.currentTime + 0.4);
                        }, i * 120);
                    });
                    return; // Early return since we handle timing manually
            }
        } catch {
            // Audio not supported, fail silently
        }
    }, [getAudioContext]);

    return { playSound };
}
