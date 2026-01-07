import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to ban/unban users
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

        const { userId, ban } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Update user's banned status in profiles table
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: ban, banned_at: ban ? new Date().toISOString() : null })
            .eq('id', userId);

        if (error) {
            console.error('Error updating ban status:', error);
            return NextResponse.json({ error: 'Failed to update ban status' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: ban ? 'BAN_USER' : 'UNBAN_USER',
            target_id: userId,
            target_type: 'user',
            details: { banned: ban },
        });

        return NextResponse.json({ success: true, banned: ban });

    } catch (error: any) {
        console.error('Ban user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
