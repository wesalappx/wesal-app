import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    // Theme
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;

    // Language - LOCKED TO ARABIC (future feature: English)
    // Keeping infrastructure for future expansion but not exposed in UI
    language: 'ar';

    // Notifications
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;

    // Sound
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Theme
            theme: 'dark' as const,
            setTheme: (theme: 'dark' | 'light') => set({ theme }),

            // Language - PERMANENTLY LOCKED TO ARABIC
            language: 'ar' as const,

            // Notifications
            notificationsEnabled: true,
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            // Sound
            soundEnabled: true,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
        }),
        {
            name: 'wesal-settings',
            // Only persist these fields (theme and language locked, no need to persist)
            partialize: (state) => ({
                notificationsEnabled: state.notificationsEnabled,
                soundEnabled: state.soundEnabled,
            }),
        }
    )
);

// Initialize settings on load
export function initializeSettings() {
    // Apply dark theme (locked) and Arabic language (locked)
    if (typeof window !== 'undefined') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    }
}
