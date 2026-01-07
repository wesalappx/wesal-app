import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to grant premium to a couple
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

        // Grant premium - create or update subscription
        const endsAt = new Date();
        endsAt.setFullYear(endsAt.getFullYear() + 1);

        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                couple_id: coupleId,
                plan_id: 'premium_monthly',
                status: 'active',
                started_at: new Date().toISOString(),
                ends_at: endsAt.toISOString(),
                payment_id: 'ADMIN_GRANTED',
            }, { onConflict: 'couple_id' });

        if (error) {
            console.error('Error granting premium:', error);
            return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'GRANT_PREMIUM_COUPLE',
            target_id: coupleId,
            target_type: 'couple',
            details: {},
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Grant premium error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
