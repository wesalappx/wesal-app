import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Admin-only endpoint to grant/revoke premium for a user's couple
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

        const { userId, grant } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Find user's couple
        const { data: coupleData, error: coupleError } = await supabase
            .from('couples')
            .select('id')
            .or(`partner1_id.eq.${userId},partner2_id.eq.${userId}`)
            .eq('status', 'ACTIVE')
            .single();

        if (coupleError || !coupleData) {
            return NextResponse.json({ error: 'User is not paired' }, { status: 400 });
        }

        if (grant) {
            // Grant premium - create or update subscription
            const endsAt = new Date();
            endsAt.setFullYear(endsAt.getFullYear() + 1);

            const { error } = await supabase
                .from('subscriptions')
                .upsert({
                    couple_id: coupleData.id,
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
        } else {
            // Revoke premium - cancel subscription
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'cancelled', ends_at: new Date().toISOString() })
                .eq('couple_id', coupleData.id);

            if (error) {
                console.error('Error revoking premium:', error);
            }
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: grant ? 'GRANT_PREMIUM' : 'REVOKE_PREMIUM',
            target_id: userId,
            target_type: 'user',
            details: { granted: grant, couple_id: coupleData.id },
        });

        return NextResponse.json({ success: true, premium: grant });

    } catch (error: any) {
        console.error('Premium error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
