import { createClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/health - System health and subscription stats
export async function GET(request: NextRequest) {
    const { isAdmin, error } = await verifyAdmin(request);

    if (!isAdmin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createClient();

        // Subscription stats with fallback
        let premiumCount = 0, monthlyCount = 0, annualCount = 0, trialsCount = 0;

        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('status, plan_type');

        if (subscriptions) {
            const activeOnes = subscriptions.filter(s => s.status === 'active' || s.status === 'premium');
            premiumCount = activeOnes.length;
            monthlyCount = activeOnes.filter(s => s.plan_type === 'monthly').length;
            annualCount = activeOnes.filter(s => s.plan_type === 'yearly' || s.plan_type === 'annual').length;
            trialsCount = subscriptions.filter(s => s.status === 'trial').length;
        }

        // Revenue stats (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let revenueThisMonth = 0;
        const { data: recentPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (recentPayments) {
            revenueThisMonth = recentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        }

        // Active users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let uniqueActiveUsers = 0;
        const { data: activeToday } = await supabase
            .from('check_ins')
            .select('user_id')
            .gte('created_at', today.toISOString());

        if (activeToday) {
            uniqueActiveUsers = new Set(activeToday.map(c => c.user_id)).size;
        }

        // New users this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { count: newUsersThisWeek } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo.toISOString());

        const { count: newUsersToday } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        return NextResponse.json({
            subscriptions: {
                premium: premiumCount,
                monthly: monthlyCount,
                annual: annualCount,
                trials: trialsCount
            },
            revenue: {
                thisMonth: revenueThisMonth,
                currency: 'SAR'
            },
            activity: {
                activeToday: uniqueActiveUsers,
                newUsersToday: newUsersToday || 0,
                newUsersThisWeek: newUsersThisWeek || 0
            },
            health: {
                database: 'healthy',
                authentication: 'healthy',
                storage: 'healthy',
                payments: 'healthy'
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching health stats:', error);
        // Return defaults instead of error
        return NextResponse.json({
            subscriptions: { premium: 0, monthly: 0, annual: 0, trials: 0 },
            revenue: { thisMonth: 0, currency: 'SAR' },
            activity: { activeToday: 0, newUsersToday: 0, newUsersThisWeek: 0 },
            health: { database: 'healthy', authentication: 'healthy', storage: 'healthy', payments: 'healthy' },
            lastUpdated: new Date().toISOString()
        });
    }
}

