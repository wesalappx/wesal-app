import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get stored OTP from database
        const { data: storedOtp, error: fetchError } = await supabase
            .from('signup_otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (fetchError || !storedOtp) {
            return NextResponse.json({ error: 'Verification code not found. Please request a new one.' }, { status: 400 });
        }

        // Check if OTP is expired
        if (new Date(storedOtp.expires_at) < new Date()) {
            await supabase
                .from('signup_otps')
                .delete()
                .eq('email', email.toLowerCase());
            return NextResponse.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 });
        }

        // Verify OTP
        if (storedOtp.otp_hash !== otp) {
            return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
        }

        // OTP is valid - delete it
        await supabase
            .from('signup_otps')
            .delete()
            .eq('email', email.toLowerCase());

        // Mark user email as verified in Supabase Auth
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (!userError) {
            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (user && !user.email_confirmed_at) {
                await supabase.auth.admin.updateUserById(user.id, {
                    email_confirm: true
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            verified: true
        });
    } catch (error) {
        console.error('Verify signup OTP error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
