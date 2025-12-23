'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (data: { displayName?: string; avatarUrl?: string }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);

                if (event === 'SIGNED_OUT') {
                    router.push('/');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const signUp = async (email: string, password: string, displayName: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName,
                    },
                },
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push('/dashboard');
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signInWithPhone = async (phone: string) => {
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone,
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const verifyOtp = async (phone: string, token: string) => {
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone,
                token,
                type: 'sms',
            });

            if (error) throw error;

            router.push('/dashboard');
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const updateProfile = async (data: { displayName?: string; avatarUrl?: string }) => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    display_name: data.displayName,
                    avatar_url: data.avatarUrl,
                },
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                isLoading,
                signUp,
                signIn,
                signInWithPhone,
                verifyOtp,
                signOut,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
