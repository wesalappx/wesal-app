import { getAdminSession, isAdminEmail } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

interface AdminInfo {
    id: string;
    user_id: string;
    email: string;
    permissions: string[];
}

export async function verifyAdmin(request?: Request): Promise<{
    isAdmin: boolean;
    admin?: AdminInfo;
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

        // Create admin info object that API routes expect
        const admin: AdminInfo = {
            id: session.email, // Use email as ID for audit logging
            user_id: session.email,
            email: session.email,
            permissions: ['*'], // Full permissions for whitelisted admins
        };

        return { isAdmin: true, admin, email: session.email, error: null };
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

// Simplified permission check - all whitelisted admins have full access
export function hasPermission(admin: AdminInfo | undefined, permission: string): boolean {
    if (!admin) return false;
    // Since we use simple email whitelist, all admins have all permissions
    return true;
}

