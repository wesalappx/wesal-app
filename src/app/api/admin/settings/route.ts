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

        for (const update of updates) {
            const { key, value } = update;

            console.log(`Attempting to update setting: ${key} = ${JSON.stringify(value)}`);

            // First try to update existing row
            const { data: updateData, error: updateError } = await supabase
                .from('app_settings')
                .update({
                    value: value,
                    updated_at: new Date().toISOString(),
                })
                .eq('key', key)
                .select()
                .single();

            if (updateError && updateError.code === 'PGRST116') {
                // Row doesn't exist, insert it
                console.log(`Key ${key} doesn't exist, inserting...`);
                const { data: insertData, error: insertError } = await supabase
                    .from('app_settings')
                    .insert({
                        key,
                        value: value,
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error(`Error inserting ${key}:`, insertError);
                    errors.push({ key, error: insertError.message });
                } else {
                    console.log(`Successfully inserted ${key}:`, insertData);
                    results.push(insertData);
                }
            } else if (updateError) {
                console.error(`Error updating ${key}:`, updateError);
                errors.push({ key, error: updateError.message });
            } else {
                console.log(`Successfully updated ${key}:`, updateData);
                results.push(updateData);
            }
        }

        if (errors.length > 0 && results.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'All updates failed',
                errors
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            updated: results.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Admin settings update error:', err);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

