import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createAdminClient } from '@/lib/supabase/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get stored OTP from database
        const { data: storedOtp, error: fetchError } = await supabase
            .from('admin_otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (fetchError || !storedOtp) {
            return NextResponse.json({ error: 'OTP not found. Please request a new one.' }, { status: 400 });
        }

        // Check if OTP is expired
        if (new Date(storedOtp.expires_at) < new Date()) {
            // Delete expired OTP
            await supabase
                .from('admin_otps')
                .delete()
                .eq('email', email.toLowerCase());
            return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
        }

        // Verify OTP
        if (storedOtp.otp_hash !== otp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        // OTP is valid - delete it
        await supabase
            .from('admin_otps')
            .delete()
            .eq('email', email.toLowerCase());

        // Get User ID from Supabase Auth
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
