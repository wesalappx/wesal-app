import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export async function getAdminSession() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;

        if (!token) {
            return null;
        }

        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );

        return {
            email: payload.email as string,
            role: payload.role as string,
            userId: payload.sub as string,
        };
    } catch (error) {
        return null;
    }
}

export async function requireAdminSession() {
    const session = await getAdminSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}
