import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

// Whitelist of allowed admin emails
const ALLOWED_ADMIN_EMAILS = [
    'wesalapp.x@gmail.com',
    'admin@wesal.app',
];

export function isAdminEmail(email: string): boolean {
    return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function createAdminSession(email: string, userId: string) {
    const token = await new SignJWT({ email, userId, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

    (await cookies()).set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    return token;
}

export async function getAdminSession() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;

        if (!token) {
            return null;
        }

        const { payload } = await jwtVerify(token, JWT_SECRET);

        return {
            email: payload.email as string,
            role: payload.role as string,
            userId: payload.sub as string,
        };
    } catch (error) {
        return null;
    }
}

export async function clearAdminSession() {
    (await cookies()).delete('admin_session');
}

export async function requireAdminSession() {
    const session = await getAdminSession();

    if (!session || !isAdminEmail(session.email)) {
        throw new Error('Unauthorized');
    }

    return session;
}
