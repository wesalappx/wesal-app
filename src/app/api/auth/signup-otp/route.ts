import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
    try {
        const { email, displayName } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Delete any existing OTP for this email first
        await supabase
            .from('signup_otps')
            .delete()
            .eq('email', email.toLowerCase());

        // Insert new OTP
        const { error: insertError } = await supabase
            .from('signup_otps')
            .insert({
                email: email.toLowerCase(),
                otp_hash: otp,
                expires_at: expiresAt,
            });

        if (insertError) {
            console.error('Failed to store signup OTP:', insertError);
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // Send OTP via email using Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'Wesal <onboarding@resend.dev>',
                    to: email,
                    subject: 'رمز التحقق - Wesal Verification Code',
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%); border-radius: 16px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #fff; font-size: 32px; margin: 0;">وصال</h1>
                                <p style="color: #a78bfa; font-size: 14px; margin-top: 8px;">Welcome ${displayName || ''}! 💜</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.08); border-radius: 16px; padding: 32px; text-align: center;">
                                <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 24px;">Your verification code is:</p>
                                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-radius: 12px; padding: 24px; margin: 20px 0;">
                                    <span style="color: #fff; font-size: 42px; font-weight: bold; letter-spacing: 12px; font-family: monospace;">${otp}</span>
                                </div>
                                <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">⏱️ Valid for 10 minutes</p>
                            </div>
                            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
                                If you didn't create an account, please ignore this email.
                            </p>
                        </div>
                    `,
                });
                console.log(`✅ Signup OTP email sent to ${email}`);
            } catch (emailError) {
                console.error('Failed to send signup email:', emailError);
                // Still return success since OTP is stored - they can resend
            }
        } else {
            console.log(`⚠️ RESEND_API_KEY not configured. OTP for ${email}: ${otp}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent',
        });
    } catch (error) {
        console.error('Signup OTP error:', error);
        return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }
}
