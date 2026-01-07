import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to reset couple streak
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { coupleId } = await req.json();

        if (!coupleId) {
            return NextResponse.json({ error: 'Couple ID required' }, { status: 400 });
        }

        // Reset streak in couple_streaks table
        const { error } = await supabase
            .from('couple_streaks')
            .update({ current_streak: 0, last_activity_date: new Date().toISOString() })
            .eq('couple_id', coupleId);

        if (error) {
            console.error('Error resetting streak:', error);
            return NextResponse.json({ error: 'Failed to reset streak' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'RESET_STREAK',
            target_id: coupleId,
            target_type: 'couple',
            details: {},
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reset streak error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
