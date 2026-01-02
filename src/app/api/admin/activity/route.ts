import { createClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin/middleware';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/activity - Fetch recent activity log
export async function GET(request: NextRequest) {
    const { isAdmin, error } = await verifyAdmin(request);

    if (!isAdmin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const { data: auditLogs, error: auditError } = await supabase
            .from('admin_audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        // Fetch recent user signups
        const { data: recentUsers, error: usersError } = await supabase
            .from('profiles')
            .select('id, display_name, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        // Fetch recent payments
        const { data: recentPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, amount, currency, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

        // Combine into activity feed
        const activities: any[] = [];

        // Add user signups
        if (recentUsers) {
            recentUsers.forEach(user => {
                activities.push({
                    id: `user-${user.id}`,
                    type: 'user_signup',
                    message: `New user registered: ${user.display_name || 'Unknown'}`,
                    timestamp: user.created_at,
                    icon: 'user',
                    color: 'blue'
                });
            });
        }

        // Add payments
        if (recentPayments) {
            recentPayments.forEach(payment => {
                activities.push({
                    id: `payment-${payment.id}`,
                    type: 'payment',
                    message: `Payment received: ${payment.currency} ${payment.amount}`,
                    status: payment.status,
                    timestamp: payment.created_at,
                    icon: 'dollar',
                    color: payment.status === 'completed' ? 'green' : 'yellow'
                });
            });
        }

        // Add admin actions
        if (auditLogs) {
            auditLogs.forEach(log => {
                activities.push({
                    id: `admin-${log.id}`,
                    type: 'admin_action',
                    message: `Admin: ${log.action}`,
                    details: log.details,
                    timestamp: log.created_at,
                    icon: 'shield',
                    color: 'purple'
                });
            });
        }

        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            activities: activities.slice(0, limit),
            total: activities.length
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        return NextResponse.json({
            activities: [],
            total: 0
        });
    }
}
