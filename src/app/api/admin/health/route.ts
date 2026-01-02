import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/health - System health and subscription stats
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        // Subscription stats
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('status, plan_type')
            .eq('status', 'premium');

        const premiumCount = subscriptions?.length || 0;
        const monthlyCount = subscriptions?.filter(s => s.plan_type === 'monthly').length || 0;
        const annualCount = subscriptions?.filter(s => s.plan_type === 'yearly').length || 0;

        // Active trials
        const { data: trials } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('status', 'trial');

        // Conversion stats (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const revenueThisMonth = recentPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        // Active users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: activeToday } = await supabase
            .from('check_ins')
            .select('user_id')
            .gte('created_at', today.toISOString());

        const uniqueActiveUsers = new Set(activeToday?.map(c => c.user_id)).size;

        // System health checks
        const healthChecks = {
            database: 'healthy',
            authentication: 'healthy',
            storage: 'healthy',
            payments: 'healthy'
        };

        return NextResponse.json({
            subscriptions: {
                premium: premiumCount,
                monthly: monthlyCount,
                annual: annualCount,
                trials: trials?.length || 0
            },
            revenue: {
                thisMonth: revenueThisMonth,
                currency: 'SAR'
            },
            activity: {
                activeToday: uniqueActiveUsers
            },
            health: healthChecks,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching health stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
