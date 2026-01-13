'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import WhisperNotification from '@/components/WhisperNotification';
import { AuthProvider } from '@/hooks/useAuth';
import { useSettingsStore, initializeSettings } from '@/stores/settings-store';
import { usePresence } from '@/hooks/usePresence';
import { useActionLogger } from '@/hooks/useActionLogger';

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

// Global presence tracker - tracks user online status across all pages
function PresenceTracker() {
    usePresence(); // This hook handles everything internally
    return null;
}

// Global action logger - tracks page views and user activity
function GlobalActionLogger() {
    const pathname = usePathname();
    const { logPageView } = useActionLogger();

    useEffect(() => {
        // Log page view when pathname changes
        if (pathname) {
            logPageView(pathname);
        }
    }, [pathname, logPageView]);

    return null;
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
                <PresenceTracker />
                <GlobalActionLogger />
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}

