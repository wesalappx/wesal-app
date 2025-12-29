'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
    id: string;
    type: string;
    title_ar: string;
    title_en?: string;
    body_ar: string;
    body_en?: string;
    is_read: boolean;
    created_at: string;
    data?: Record<string, any>;
}

export function useNotifications() {
    const supabase = createClient();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        if (!user) return;

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user) return;

        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Create a notification (for internal use)
    const createNotification = async (data: {
        type: string;
        title_ar: string;
        body_ar: string;
        title_en?: string;
        body_en?: string;
        extra_data?: Record<string, any>;
    }) => {
        if (!user) return;

        try {
            await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    type: data.type,
                    title_ar: data.title_ar,
                    title_en: data.title_en,
                    body_ar: data.body_ar,
                    body_en: data.body_en,
                    data: data.extra_data,
                });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Real-time subscription
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        createNotification,
        refetch: fetchNotifications,
    };
}
