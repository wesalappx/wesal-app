import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createAdminClient } from '@/lib/supabase/server';

// This should match the store in send-otp
declare global {
    var adminOtpStore: Map<string, { otp: string; expires: number }> | undefined;
}

// Use global store to persist across hot reloads in development
const otpStore = global.adminOtpStore || new Map<string, { otp: string; expires: number }>();
if (process.env.NODE_ENV === 'development') {
    global.adminOtpStore = otpStore;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        // Get stored OTP
        const stored = otpStore.get(email.toLowerCase());

        if (!stored) {
            return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
        }

        // Check if OTP is expired
        if (stored.expires < Date.now()) {
            otpStore.delete(email.toLowerCase());
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
        }

        // Verify OTP
        if (stored.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // OTP is valid - delete it
        otpStore.delete(email.toLowerCase());

        // Get User ID from Supabase Auth
        const supabase = await createAdminClient();
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            console.error('Error fetching users list:', userError);
            return NextResponse.json({ error: 'System error resolving user' }, { status: 500 });
        }

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!user) {
            return NextResponse.json({ error: 'User account not found' }, { status: 404 });
        }

        // Create JWT token
        const token = await new SignJWT({
            email,
            role: 'admin',
            sub: user.id // Store User ID in subject
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(new TextEncoder().encode(JWT_SECRET));

        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
        });

        // Set HTTP-only cookie for entire site
        response.cookies.set('admin_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
