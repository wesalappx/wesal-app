import { useCallback } from 'react';
import { soundManager } from '@/lib/sounds';

// Sound types matching the soundManager
export type SoundType = 'click' | 'success' | 'error' | 'swipe' | 'notification' | 'pop' | 'whoosh' | 'romantic';

export function useSound() {
    const playSound = useCallback((type: SoundType) => {
        // Map some aliases to actual sound files
        const soundMap: Record<SoundType, string> = {
            click: 'click',
            success: 'success',
            error: 'error',
            swipe: 'swipe',
            notification: 'notification',
            pop: 'click',      // Alias for click
            whoosh: 'swipe',   // Alias for swipe
            romantic: 'notification', // Alias for notification
        };

        const soundName = soundMap[type] || 'click';
        soundManager.play(soundName);
    }, []);

    return { playSound };
}
