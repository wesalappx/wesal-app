import { getAdminSession, isAdminEmail } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function verifyAdmin(): Promise<{
    isAdmin: boolean;
    email?: string;
    error: string | null;
}> {
    try {
        const session = await getAdminSession();

        if (!session) {
            return { isAdmin: false, error: 'Not authenticated' };
        }

        if (!isAdminEmail(session.email)) {
            return { isAdmin: false, error: 'Not authorized' };
        }

        return { isAdmin: true, email: session.email, error: null };
    } catch (err) {
        console.error('Verify Admin Error:', err);
        return { isAdmin: false, error: 'Server error' };
    }
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
    return NextResponse.json({ error: message }, { status: 403 });
}
