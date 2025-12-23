import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

export async function GET(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    // Check if user has permission (we'll reuse 'settings' permission for finance for now, or 'super_admin' role)
    const isSuperAdmin = admin.role === 'super_admin';
    if (!isSuperAdmin && !hasPermission(admin, 'settings')) {
        return NextResponse.json({ error: 'No permission to view finance stats' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();

        // 1. Get Summary Stats from View
        const { data: stats, error: statsError } = await supabase
            .from('admin_finance_stats')
            .select('*')
            .single();

        if (statsError) throw statsError;

        // 2. Get Recent Transactions (limit 10)
        const { data: transactions, error: txError } = await supabase
            .from('payments')
            .select(`
                *,
                user:profiles(display_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txError) throw txError;

        // 3. Get Revenue History (Last 12 months) - simplified aggregation
        // Note: For a real production app with massive data, this should be a pre-calculated materialized view
        // For now, we'll fetch completed payments from last year and aggregate in JS
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const { data: historyData, error: historyError } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('status', 'completed')
            .gte('created_at', oneYearAgo.toISOString());

        if (historyError) throw historyError;

        // Aggregate by month
        const revenueByMonth: Record<string, number> = {};
        historyData?.forEach(tx => {
            const date = new Date(tx.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(tx.amount);
        });

        // Convert to array and sort
        const monthlyRevenue = Object.entries(revenueByMonth)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return NextResponse.json({
            summary: stats,
            transactions,
            monthlyRevenue
        });

    } catch (err) {
        console.error('Admin finance error:', err);
        return NextResponse.json({ error: 'Failed to fetch finance stats' }, { status: 500 });
    }
}
