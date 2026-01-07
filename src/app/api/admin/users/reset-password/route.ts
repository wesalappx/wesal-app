import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to send password reset email
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

        // Get user's email from auth
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData.user?.email) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Send password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(userData.user.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password`,
        });

        if (resetError) {
            console.error('Error sending reset email:', resetError);
            return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'PASSWORD_RESET_SENT',
            target_id: userId,
            target_type: 'user',
            details: { email: userData.user.email },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
