'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import WhisperNotification from '@/components/WhisperNotification';
import { AuthProvider } from '@/hooks/useAuth';
import { useSettingsStore, initializeSettings } from '@/stores/settings-store';

function SettingsInitializer() {
    const { theme, language } = useSettingsStore();

    useEffect(() => {
        // Apply theme
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);

        // Apply language direction
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [theme, language]);

    return null;
}

// Global whisper listener component
function GlobalWhisperListener() {
    const { language } = useSettingsStore();
    return <WhisperNotification language={language as 'ar' | 'en'} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SettingsInitializer />
                <GlobalWhisperListener />
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}

