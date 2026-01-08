import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/server';
import { randomInt } from 'crypto';

// Allowed admin emails (in production, store in database or env)
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
    // Add more admin emails here
];

function generateOTP(): string {
    // Use cryptographically secure random number generation
    return randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if email is allowed
        if (!ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized email' }, { status: 403 });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Store OTP in database
        const supabase = await createAdminClient();

        // Delete any existing OTP for this email first
        await supabase
            .from('admin_otps')
            .delete()
            .eq('email', email.toLowerCase());

        // Insert new OTP
        const { error: insertError } = await supabase
            .from('admin_otps')
            .insert({
                email: email.toLowerCase(),
                otp_hash: otp, // In production, hash this
                expires_at: expiresAt,
            });

        if (insertError) {
            console.error('Failed to store OTP:', insertError);
            return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
        }

        // Always log to console (for Vercel logs)
        console.log(`🔐 Admin OTP for ${email}: ${otp}`);

        // Send OTP via email using Resend (only if API key is configured)
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            try {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'Wesal Admin <noreply@wesal.life>',
                    to: email,
                    subject: 'رمز الدخول - Wesal Admin OTP',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%); border-radius: 16px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #fff; font-size: 28px; margin: 0;">وصال</h1>
                                <p style="color: #a78bfa; font-size: 14px; margin-top: 5px;">Admin Login</p>
                            </div>
                            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
                                <p style="color: #e2e8f0; font-size: 16px; margin-bottom: 20px;">Your one-time password is:</p>
                                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <span style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
                                </div>
                                <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">Valid for 10 minutes</p>
                            </div>
                            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
                                If you didn't request this code, please ignore this email.
                            </p>
                        </div>
                    `,
                });
                console.log(`✅ OTP email sent to ${email}`);
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the request, OTP is still stored
            }
        } else {
            console.log('⚠️ RESEND_API_KEY not configured, email not sent');
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            // In development, return OTP for easier testing
            ...(process.env.NODE_ENV === 'development' && { otp }),
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
    }
}
