import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to invalidate all user sessions
export async function POST(req: Request) {
    try {
        // Verify admin session
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Invalidate all user sessions using admin API
        const { error } = await supabase.auth.admin.signOut(userId, 'global');

        if (error) {
            console.error('Error forcing logout:', error);
            return NextResponse.json({ error: 'Failed to invalidate sessions' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'FORCE_LOGOUT',
            target_id: userId,
            target_type: 'user',
            details: {},
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Force logout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
