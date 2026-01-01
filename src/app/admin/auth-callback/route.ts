import { createClient } from '@/lib/supabase/server';
import { createAdminSession, isAdminEmail } from '@/lib/admin/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user?.email) {
            console.error('Auth exchange error:', error);
            return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
        }

        const email = data.user.email.toLowerCase();

        // Check if email is in whitelist
        if (!isAdminEmail(email)) {
            console.error('Unauthorized admin access attempt:', email);
            return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
        }

        // Create admin session
        await createAdminSession(email, data.user.id);

        // Redirect to dashboard
        return NextResponse.redirect(`${origin}/admin`);
    } catch (err) {
        console.error('Admin auth callback error:', err);
        return NextResponse.redirect(`${origin}/admin/login?error=server_error`);
    }
}
