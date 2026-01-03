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

    // Session Mode Preference
    preferredSessionMode: 'local' | 'remote' | null;
    setPreferredSessionMode: (mode: 'local' | 'remote' | null) => void;

    // Privacy: Show/Hide Last Seen
    showLastSeen: boolean;
    setShowLastSeen: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Theme
            theme: 'dark',
            setTheme: (theme: 'dark' | 'light') => {
                if (typeof window !== 'undefined') {
                    const root = document.documentElement;
                    root.classList.remove('light', 'dark');
                    root.classList.add(theme);
                }
                set({ theme });
            },

            // Language - PERMANENTLY LOCKED TO ARABIC
            language: 'ar' as const,

            // Notifications
            notificationsEnabled: true,
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

            // Sound
            soundEnabled: true,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

            // Session Mode Preference (Persistent)
            preferredSessionMode: null,
            setPreferredSessionMode: (mode) => set({ preferredSessionMode: mode }),

            // Privacy: Show Last Seen (default: true)
            showLastSeen: true,
            setShowLastSeen: (show) => set({ showLastSeen: show }),
        }),
        {
            name: 'wesal-settings',
            partialize: (state) => ({
                theme: state.theme,
                notificationsEnabled: state.notificationsEnabled,
                soundEnabled: state.soundEnabled,
                preferredSessionMode: state.preferredSessionMode,
                showLastSeen: state.showLastSeen,
            }),
        }
    )
);

// Initialize settings on load
export function initializeSettings() {
    if (typeof window !== 'undefined') {
        const state = useSettingsStore.getState();
        const root = document.documentElement;

        // Apply saved theme
        root.classList.remove('light', 'dark');
        root.classList.add(state.theme);

        // Ensure Arabic
        root.lang = 'ar';
        root.dir = 'rtl';
    }
}
