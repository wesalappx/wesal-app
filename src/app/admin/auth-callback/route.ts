import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Allowed admin emails - must be synced with login page
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            const email = data.user.email?.toLowerCase();

            // Verify this user is an allowed admin
            if (email && ALLOWED_ADMIN_EMAILS.includes(email)) {
                // Create admin session JWT
                const token = await new SignJWT({
                    email,
                    role: 'admin',
                    sub: data.user.id,
                })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('24h')
                    .sign(new TextEncoder().encode(JWT_SECRET));

                // Create response with redirect to admin dashboard
                const response = NextResponse.redirect(`${origin}/admin`);

                // Set admin session cookie
                response.cookies.set('admin_session', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24, // 24 hours
                    path: '/',
                });

                return response;
            } else {
                // Email not in allowed list - redirect to login with error
                console.error('Unauthorized admin access attempt:', email);
                return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
            }
        }
    }

    // Auth failed - redirect to login
    return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
