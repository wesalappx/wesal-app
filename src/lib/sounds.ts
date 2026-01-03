// Sound Manager - Global sound system for the app
class SoundManager {
    private enabled: boolean = true;
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private volume: number = 0.5;

    constructor() {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('soundEnabled');
            this.enabled = stored !== 'false';
            const storedVolume = localStorage.getItem('soundVolume');
            this.volume = storedVolume ? parseFloat(storedVolume) : 0.5;
            this.loadSounds();
        }
    }

    private loadSounds() {
        // Sound files to be added to /public/sounds/
        // Note: Add these files to your project or use web audio API
        const soundFiles = {
            click: '/sounds/click.mp3',
            success: '/sounds/success.mp3',
            error: '/sounds/error.mp3',
            swipe: '/sounds/swipe.mp3',
            pop: '/sounds/pop.mp3'
        };

        Object.entries(soundFiles).forEach(([name, url]) => {
            try {
                const audio = new Audio(url);
                audio.preload = 'auto';
                audio.volume = this.volume;
                this.sounds.set(name, audio);
            } catch (error) {
                console.warn(`Failed to load sound: ${name}`, error);
            }
        });
    }

    play(name: string, customVolume?: number) {
        if (!this.enabled) return;

        const sound = this.sounds.get(name);
        if (sound) {
            try {
                sound.currentTime = 0;
                sound.volume = customVolume !== undefined ? customVolume : this.volume;
                sound.play().catch(() => {
                    // Silently fail - user might not have interacted with page yet
                });
            } catch (error) {
                console.warn(`Failed to play sound: ${name}`, error);
            }
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('soundEnabled', String(enabled));
        }
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        if (typeof window !== 'undefined') {
            localStorage.setItem('soundVolume', String(this.volume));
        }
        // Update all loaded sounds
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getVolume(): number {
        return this.volume;
    }
}

// Export singleton instance
export const soundManager = new SoundManager();
