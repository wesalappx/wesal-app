'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface Partner {
    id: string;
    display_name: string;
    email?: string;
    avatar_url?: string;
    is_online?: boolean;
}

export interface Couple {
    id: string;
    partner1_id: string;
    partner2_id: string;
    status: 'ACTIVE' | 'PAUSED' | 'UNPAIRED';
    paired_at: string;
}

export function usePairing() {
    const supabase = createClient();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate a 6-digit pairing code with collision detection
    const generateCode = async () => {
        if (!user) return { code: null, error: 'غير مصرح. يُرجى تسجيل الدخول أولاً.' };

        setIsLoading(true);
        setError(null);

        try {
            // Delete any existing codes from this user first
            await supabase
                .from('pairing_codes')
                .delete()
                .eq('created_by', user.id);

            let code: string | null = null;
            let attempts = 0;
            const maxAttempts = 10;

            // Try to generate a unique code (with retry for collisions)
            while (attempts < maxAttempts && !code) {
                const candidateCode = Math.floor(100000 + Math.random() * 900000).toString();

                // Check if code already exists and is still valid
                const { data: existingCode } = await supabase
                    .from('pairing_codes')
                    .select('code')
                    .eq('code', candidateCode)
                    .is('used_at', null)
                    .gt('expires_at', new Date().toISOString())
                    .maybeSingle();

                if (!existingCode) {
                    code = candidateCode; // Code is unique
                    break;
                }

                attempts++;
            }

            if (!code) {
                throw new Error('فشل إنشاء رمز فريد. يُرجى المحاولة مرة أخرى.');
            }

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

            // Insert new code
            const { data, error: insertError } = await supabase
                .from('pairing_codes')
                .insert({
                    code,
                    created_by: user.id,
                    expires_at: expiresAt.toISOString(),
                })
                .select()
                .single();

            if (insertError) {
                console.error('Code insertion error:', insertError);
                throw new Error('فشل حفظ الرمز. يُرجى المحاولة مرة أخرى.');
            }

            return { code: data.code, expiresAt: data.expires_at, error: null };
        } catch (err: any) {
            const errorMessage = err.message || 'حدث خطأ غير متوقع';
            setError(errorMessage);
            return { code: null, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    // Get current user's active code
    const getMyCode = async () => {
        if (!user) return { code: null, error: 'Not authenticated' };

        try {
            const { data, error: fetchError } = await supabase
                .from('pairing_codes')
                .select('*')
                .eq('created_by', user.id)
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            return { code: data?.code || null, expiresAt: data?.expires_at, error: null };
        } catch (err: any) {
            return { code: null, error: err.message };
        }
    };

    // Accept a pairing code and create couple
    const acceptCode = async (code: string) => {
        if (!user) return { success: false, error: 'Not authenticated' };

        setIsLoading(true);
        setError(null);

        try {
            const trimmedCode = code.trim();


            // Find the code - no uppercase needed since codes are numeric
            const { data: pairingCode, error: findError } = await supabase
                .from('pairing_codes')
                .select('*')
                .eq('code', trimmedCode)
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .maybeSingle();



            if (findError) {
                console.error('Database error:', findError);
                throw new Error('حدث خطأ في البحث عن الرمز');
            }

            if (!pairingCode) {
                throw new Error('الرمز غير صالح أو منتهي الصلاحية');
            }

            if (pairingCode.created_by === user.id) {
                throw new Error('لا يمكنك استخدام رمزك الخاص');
            }

            // Check if either user is already paired
            const { data: existingCouple } = await supabase
                .from('couples')
                .select('id')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id},partner1_id.eq.${pairingCode.created_by},partner2_id.eq.${pairingCode.created_by}`)
                .eq('status', 'ACTIVE')
                .single();

            if (existingCouple) {
                throw new Error('أحد الطرفين مرتبط بالفعل');
            }

            // Create the couple
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({
                    partner1_id: pairingCode.created_by,
                    partner2_id: user.id,
                    status: 'ACTIVE',
                })
                .select()
                .single();

            if (coupleError) throw coupleError;

            // Mark the code as used
            await supabase
                .from('pairing_codes')
                .update({
                    used_at: new Date().toISOString(),
                    used_by: user.id,
                })
                .eq('id', pairingCode.id);

            // Create initial streak record
            await supabase
                .from('streaks')
                .insert({
                    couple_id: couple.id,
                    current_streak: 0,
                    longest_streak: 0,
                });

            // Create success notifications for both partners
            const currentUserName = user?.user_metadata?.display_name || 'شريكك';

            // Notification for code creator (partner who generated the code)
            await supabase
                .from('notifications')
                .insert({
                    user_id: pairingCode.created_by,
                    type: 'PAIRING_ACCEPTED',
                    title_ar: 'تم قبول الربط!',
                    title_en: 'Pairing Accepted!',
                    body_ar: `${currentUserName} قبل طلب الربط معك`,
                    body_en: `${currentUserName} accepted your pairing request`,
                    is_read: false,
                });

            // Notification for current user (code acceptor)
            await supabase
                .from('notifications')
                .insert({
                    user_id: user.id,
                    type: 'PAIRING_ACCEPTED',
                    title_ar: 'تم الربط بنجاح!',
                    title_en: 'Successfully Paired!',
                    body_ar: 'أنتما الآن مرتبطان. ابدءا رحلتكما معاً!',
                    body_en: 'You are now paired. Start your journey together!',
                    is_read: false,
                });

            return { success: true, couple, error: null };
        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Get pairing status
    const getStatus = async () => {
        if (!user) return { isPaired: false, partner: null, error: 'Not authenticated' };

        try {
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .select('*')
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .eq('status', 'ACTIVE')
                .maybeSingle();

            if (coupleError) throw coupleError;

            if (!couple) {
                return { isPaired: false, partner: null, coupleId: null, error: null };
            }

            // Get partner info
            const partnerId = couple.partner1_id === user.id ? couple.partner2_id : couple.partner1_id;
            const { data: partner } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', partnerId)
                .single();

            // Add fallback if display_name is empty
            const partnerWithFallback = partner ? {
                ...partner,
                display_name: partner.display_name || 'شريكك'
            } : null;

            return {
                isPaired: true,
                partner: partnerWithFallback as Partner,
                coupleId: couple.id,
                error: null,
            };
        } catch (err: any) {
            return { isPaired: false, partner: null, coupleId: null, error: err.message };
        }
    };

    // Unpair from partner
    const unpair = async () => {
        if (!user) return { success: false, error: 'Not authenticated' };

        setIsLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('couples')
                .update({
                    status: 'UNPAIRED',
                    unpaired_at: new Date().toISOString(),
                })
                .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
                .eq('status', 'ACTIVE');

            if (updateError) throw updateError;

            return { success: true, error: null };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        generateCode,
        getMyCode,
        acceptCode,
        getStatus,
        unpair,
        isLoading,
        error,
    };
}
