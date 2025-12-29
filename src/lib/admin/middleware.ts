import { createAdminClient } from '@/lib/supabase/server';
import { getAdminSession } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export interface AdminUser {
    id: string;
    user_id: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
    permissions: {
        users: boolean;
        couples: boolean;
        content: boolean;
        settings: boolean;
    };
}

export async function verifyAdmin(request: Request): Promise<{
    isAdmin: boolean;
    admin: AdminUser | null;
    error: string | null;
}> {
    try {
        // 1. Verify Session Token (Cookie)
        const session = await getAdminSession();
        if (!session || !session.userId) {
            return { isAdmin: false, admin: null, error: 'Not authenticated' };
        }

        // 2. Fetch Admin Profile using Service Role (Bypass RLS)
        const supabase = await createAdminClient();
        const { data: adminUser, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.userId)
            .single();

        if (adminError || !adminUser) {
            return { isAdmin: false, admin: null, error: 'Not authorized as admin' };
        }

        return { isAdmin: true, admin: adminUser as AdminUser, error: null };
    } catch (err) {
        console.error('Verify Admin Error:', err);
        return { isAdmin: false, admin: null, error: 'Server error' };
    }
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
    return NextResponse.json({ error: message }, { status: 403 });
}

export function hasPermission(admin: AdminUser, permission: keyof AdminUser['permissions']): boolean {
    if (admin.role === 'super_admin') return true;
    return admin.permissions[permission] === true;
}
