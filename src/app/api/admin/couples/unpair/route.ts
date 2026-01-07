import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to unpair a couple
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

        // Update couple status to UNPAIRED
        const { error } = await supabase
            .from('couples')
            .update({ status: 'UNPAIRED', unpaired_at: new Date().toISOString() })
            .eq('id', coupleId);

        if (error) {
            console.error('Error unpairing couple:', error);
            return NextResponse.json({ error: 'Failed to unpair couple' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'UNPAIR_COUPLE',
            target_id: coupleId,
            target_type: 'couple',
            details: {},
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Unpair error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
