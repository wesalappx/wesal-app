import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { isAdmin, error } = await verifyAdmin(request);

    if (!isAdmin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createAdminClient();

        // 1. Try to get summary stats - with fallback
        let summary = {
            total_revenue: 0,
            transactions_last_30d: 0,
            total_premium_couples: 0,
            active_trials: 0
        };

        // Try to get from payments table directly
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: payments } = await supabase
            .from('payments')
            .select('amount, status, created_at')
            .eq('status', 'completed');

        if (payments) {
            summary.total_revenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            summary.transactions_last_30d = payments.filter(
                p => new Date(p.created_at) >= thirtyDaysAgo
            ).length;
        }

        // Get premium couples count
        const { count: premiumCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        summary.total_premium_couples = premiumCount || 0;

        // Get trial count
        const { count: trialCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'trial');

        summary.active_trials = trialCount || 0;

        // 2. Get Recent Transactions (limit 10)
        const { data: transactions } = await supabase
            .from('payments')
            .select(`
                *,
                user:profiles(display_name)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        // 3. Get Revenue History (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: historyData } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('status', 'completed')
            .gte('created_at', sixMonthsAgo.toISOString());

        // Aggregate by month
        const revenueByMonth: Record<string, number> = {};
        historyData?.forEach(tx => {
            const date = new Date(tx.created_at);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const key = monthNames[date.getMonth()];
            revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(tx.amount);
        });

        // Convert to array with fallback for empty months
        const monthlyRevenue = Object.entries(revenueByMonth)
            .map(([month, amount]) => ({ month, amount }));

        // If no data, show placeholder
        if (monthlyRevenue.length === 0) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            months.forEach(m => monthlyRevenue.push({ month: m, amount: 0 }));
        }

        return NextResponse.json({
            summary,
            transactions: transactions || [],
            monthlyRevenue
        });

    } catch (err) {
        console.error('Admin finance error:', err);
        // Return empty stats instead of error
        return NextResponse.json({
            summary: {
                total_revenue: 0,
                transactions_last_30d: 0,
                total_premium_couples: 0,
                active_trials: 0
            },
            transactions: [],
            monthlyRevenue: []
        });
    }
}

