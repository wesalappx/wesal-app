import { NextResponse } from 'next/server';

// In-memory OTP store (in production, use Redis or database)
declare global {
    var adminOtpStore: Map<string, { otp: string; expires: number }> | undefined;
}

// Use global store to persist across hot reloads in development
const otpStore = global.adminOtpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV === 'development') {
    global.adminOtpStore = otpStore;
}

// Allowed admin emails (in production, store in database or env)
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
    // Add more admin emails here
];

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
        const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP
        otpStore.set(email.toLowerCase(), { otp, expires });

        // Clean up expired OTPs
        for (const [key, value] of otpStore.entries()) {
            if (value.expires < Date.now()) {
                otpStore.delete(key);
            }
        }

        // In development, log OTP to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n🔐 Admin OTP for ${email}: ${otp}\n`);
        }

        // TODO: In production, send email via Resend or SMTP
        // await sendEmail({
        //     to: email,
        //     subject: 'Wesal Admin Login OTP',
        //     html: `Your OTP code is: <strong>${otp}</strong>. Valid for 10 minutes.`
        // });

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
