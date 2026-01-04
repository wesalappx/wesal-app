import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAdmin, unauthorizedResponse, hasPermission } from '@/lib/admin/middleware';

export async function GET(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'settings')) {
        return NextResponse.json({ error: 'No permission to view settings' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();

        const { data: settings, error: fetchError } = await supabase
            .from('app_settings')
            .select('*');

        if (fetchError) throw fetchError;

        // Convert array to object for easier frontend consumption
        const settingsMap: Record<string, any> = {};
        settings?.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        return NextResponse.json({ settings: settingsMap });
    } catch (err) {
        console.error('Admin settings error:', err);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { isAdmin, admin, error } = await verifyAdmin(request);

    if (!isAdmin || !admin) {
        return unauthorizedResponse(error || 'Unauthorized');
    }

    if (!hasPermission(admin, 'settings')) {
        return NextResponse.json({ error: 'No permission to update settings' }, { status: 403 });
    }

    try {
        const supabase = await createAdminClient();
        const body = await request.json();
        const { updates } = body;

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
        }

        const results = [];
        const errors = [];

        // Process updates
        for (const update of updates) {
            const { key, value } = update;

            console.log(`Updating setting: ${key} = ${value}`);

            const { data, error: updateError } = await supabase
                .from('app_settings')
                .upsert(
                    {
                        key,
                        value,
                        updated_by: admin.user_id,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'key' }
                )
                .select()
                .single();

            if (updateError) {
                console.error(`Error updating ${key}:`, updateError);
                errors.push({ key, error: updateError.message });
            } else {
                console.log(`Successfully updated ${key}:`, data);
                results.push(data);

                // Log action (ignore errors here)
                await supabase.from('admin_audit_log').insert({
                    admin_id: admin.id,
                    action: 'update',
                    entity_type: 'settings',
                    entity_id: data?.id,
                    new_data: { key, value },
                }).catch(() => { });
            }
        }

        return NextResponse.json({
            success: true,
            updated: results.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Admin settings update error:', err);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
