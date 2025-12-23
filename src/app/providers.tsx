'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
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

// Pages where navbar should be hidden
const HIDE_NAV_ROUTES = ['/journey-exercise', '/game-session', '/admin'];

function ConditionalBottomNav() {
    const pathname = usePathname();
    const shouldHide = HIDE_NAV_ROUTES.some(route => pathname?.startsWith(route));

    if (shouldHide) return null;
    return <BottomNav />;
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
                {children}
                <ConditionalBottomNav />
            </AuthProvider>
        </QueryClientProvider>
    );
}
