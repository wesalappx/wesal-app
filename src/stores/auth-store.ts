import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email?: string;
    phone?: string;
    displayName: string;
    avatarUrl?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isMarriageAttested: boolean;
}

interface Partner {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isOnline?: boolean;
}

interface AuthState {
    user: User | null;
    partner: Partner | null;
    accessToken: string | null;
    refreshToken: string | null;
    isPaired: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setPartner: (partner: Partner | null) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setIsPaired: (isPaired: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            partner: null,
            accessToken: null,
            refreshToken: null,
            isPaired: false,
            isAuthenticated: false,

            setUser: (user) =>
                set({ user, isAuthenticated: !!user }),

            setPartner: (partner) =>
                set({ partner, isPaired: !!partner }),

            setTokens: (accessToken, refreshToken) =>
                set({ accessToken, refreshToken, isAuthenticated: true }),

            setIsPaired: (isPaired) =>
                set({ isPaired }),

            logout: () =>
                set({
                    user: null,
                    partner: null,
                    accessToken: null,
                    refreshToken: null,
                    isPaired: false,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
