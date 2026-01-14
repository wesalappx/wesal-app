import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// GET: Fetch all beta users
export async function GET(request: NextRequest) {
    try {
        const supabase = await createAdminClient();

        // Get all subscriptions with beta/premium status
        const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select(`
                id,
                couple_id,
                plan_id,
                status,
                starts_at,
                ends_at,
                created_at,
                couples:couple_id (
                    id,
                    partner1_id,
                    partner2_id
                )
            `)
            .in('plan_id', ['beta_access', 'premium_monthly', 'premium_annual'])
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching beta users:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get user emails for each subscription
        const usersWithEmails = await Promise.all((subscriptions || []).map(async (sub: any) => {
            const couple = sub.couples;
            if (!couple) return { ...sub, partner1_email: null, partner2_email: null };

            // Get partner emails
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, display_name')
                .in('id', [couple.partner1_id, couple.partner2_id].filter(Boolean));

            const p1 = profiles?.find((p: any) => p.id === couple.partner1_id);
            const p2 = profiles?.find((p: any) => p.id === couple.partner2_id);

            return {
                id: sub.id,
                couple_id: sub.couple_id,
                plan_id: sub.plan_id,
                status: sub.status,
                starts_at: sub.starts_at,
                ends_at: sub.ends_at,
                created_at: sub.created_at,
                partner1_email: p1?.email || p1?.display_name || 'Unknown',
                partner2_email: p2?.email || p2?.display_name || 'Partner'
            };
        }));

        // Calculate stats
        const now = new Date();
        const active = usersWithEmails.filter(u =>
            u.status === 'premium' && (!u.ends_at || new Date(u.ends_at) > now)
        ).length;
        const expired = usersWithEmails.filter(u =>
            u.ends_at && new Date(u.ends_at) <= now
        ).length;

        return NextResponse.json({
            users: usersWithEmails,
            stats: {
                total: usersWithEmails.length,
                active,
                expired
            }
        });

    } catch (error: any) {
        console.error('Beta users API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Revoke beta access
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'cancelled',
                ends_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Extend beta access
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { subscriptionId, extendMonths } = body;

        if (!subscriptionId || !extendMonths) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get current subscription
        const { data: sub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('ends_at')
            .eq('id', subscriptionId)
            .single();

        if (fetchError || !sub) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Calculate new end date
        const currentEnd = sub.ends_at ? new Date(sub.ends_at) : new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + extendMonths);

        const { error } = await supabase
            .from('subscriptions')
            .update({
                ends_at: newEnd.toISOString(),
                status: 'premium',
                updated_at: new Date().toISOString()
            })
            .eq('id', subscriptionId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, newEndsAt: newEnd.toISOString() });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
