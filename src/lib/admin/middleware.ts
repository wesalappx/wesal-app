import { getAdminSession, isAdminEmail } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Admin permission types
export type AdminPermission =
    | 'users'        // View and manage users
    | 'couples'      // View and manage couples
    | 'finance'      // View financial data and transactions
    | 'content'      // Manage games, journeys, content
    | 'settings'     // Manage app settings
    | 'logs'         // View audit logs
    | 'subscriptions' // Manage subscriptions
    | '*';           // Super admin - all permissions

export interface AdminInfo {
    id: string;
    user_id: string;
    email: string;
    permissions: AdminPermission[];
    role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
}

// Role-based permission mappings
const ROLE_PERMISSIONS: Record<AdminInfo['role'], AdminPermission[]> = {
    super_admin: ['*'],
    admin: ['users', 'couples', 'finance', 'content', 'settings', 'logs', 'subscriptions'],
    moderator: ['users', 'couples', 'content', 'logs'],
    viewer: ['users', 'couples', 'logs'],
};

// Admin role assignments (in production, this would be from database)
const ADMIN_ROLES: Record<string, AdminInfo['role']> = {
    'wesalapp.x@gmail.com': 'super_admin',
    'admin@wesal.app': 'super_admin',
};

function getAdminRole(email: string): AdminInfo['role'] {
    return ADMIN_ROLES[email.toLowerCase()] || 'viewer';
}

function getPermissionsForRole(role: AdminInfo['role']): AdminPermission[] {
    return ROLE_PERMISSIONS[role] || [];
}

// Simple in-memory rate limiter for admin routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const ADMIN_RATE_LIMIT = 30; // 30 requests per minute for admin routes
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkAdminRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    // Clean old entries periodically
    if (rateLimitMap.size > 1000) {
        for (const [key, value] of rateLimitMap.entries()) {
            if (now > value.resetTime + RATE_LIMIT_WINDOW) {
                rateLimitMap.delete(key);
            }
        }
    }

    if (!record || now > record.resetTime + RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, resetTime: now });
        return { allowed: true, remaining: ADMIN_RATE_LIMIT - 1 };
    }

    record.count++;
    const allowed = record.count <= ADMIN_RATE_LIMIT;
    return { allowed, remaining: Math.max(0, ADMIN_RATE_LIMIT - record.count) };
}

export async function verifyAdmin(request?: Request): Promise<{
    isAdmin: boolean;
    admin?: AdminInfo;
    email?: string;
    error: string | null;
    rateLimited?: boolean;
}> {
    try {
        // Check rate limit first
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headersList.get('x-real-ip') ||
            'unknown';

        const { allowed, remaining } = checkAdminRateLimit(ip);
        if (!allowed) {
            console.warn(`Admin rate limit exceeded for IP: ${ip}`);
            return { isAdmin: false, error: 'Rate limit exceeded. Please try again later.', rateLimited: true };
        }

        const session = await getAdminSession();

        if (!session) {
            return { isAdmin: false, error: 'Not authenticated' };
        }

        if (!isAdminEmail(session.email)) {
            return { isAdmin: false, error: 'Not authorized' };
        }

        // Get role and permissions for this admin
        const role = getAdminRole(session.email);
        const permissions = getPermissionsForRole(role);

        // Create admin info object with role-based permissions
        const admin: AdminInfo = {
            id: session.email,
            user_id: session.email,
            email: session.email,
            permissions,
            role,
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

export function rateLimitedResponse() {
    return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
    );
}

/**
 * Check if admin has specific permission
 * Super admins with '*' permission have access to everything
 */
export function hasPermission(admin: AdminInfo | undefined, permission: AdminPermission): boolean {
    if (!admin) return false;

    // Super admin has all permissions
    if (admin.permissions.includes('*')) {
        return true;
    }

    // Check specific permission
    return admin.permissions.includes(permission);
}

/**
 * Check if admin has ANY of the specified permissions
 */
export function hasAnyPermission(admin: AdminInfo | undefined, permissions: AdminPermission[]): boolean {
    if (!admin) return false;

    if (admin.permissions.includes('*')) {
        return true;
    }

    return permissions.some(p => admin.permissions.includes(p));
}

/**
 * Check if admin has ALL of the specified permissions
 */
export function hasAllPermissions(admin: AdminInfo | undefined, permissions: AdminPermission[]): boolean {
    if (!admin) return false;

    if (admin.permissions.includes('*')) {
        return true;
    }

    return permissions.every(p => admin.permissions.includes(p));
}

/**
 * Get human-readable role name for display
 */
export function getRoleDisplayName(role: AdminInfo['role'], language: 'ar' | 'en' = 'en'): string {
    const names: Record<AdminInfo['role'], { ar: string; en: string }> = {
        super_admin: { ar: 'مدير عام', en: 'Super Admin' },
        admin: { ar: 'مدير', en: 'Admin' },
        moderator: { ar: 'مشرف', en: 'Moderator' },
        viewer: { ar: 'مشاهد', en: 'Viewer' },
    };

    return names[role]?.[language] || role;
}
