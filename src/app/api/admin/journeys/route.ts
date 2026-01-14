import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';


export const dynamic = 'force-dynamic';
// GET - Fetch journeys configuration
export async function GET() {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch journeys from app_settings
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'journeys_config')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching journeys:', error);
        }

        // Default journeys
        const defaultJourneys = [
            { id: 'basics', title: { ar: 'أساسيات العلاقة', en: 'Relationship Basics' }, description: { ar: 'بناء الأساس', en: 'Build the foundation' }, totalSteps: 5, completedByCount: 0, isEnabled: true, isPremium: false },
            { id: 'communication', title: { ar: 'فن التواصل', en: 'Art of Communication' }, description: { ar: 'تعلم التواصل الفعال', en: 'Learn effective communication' }, totalSteps: 5, completedByCount: 0, isEnabled: true, isPremium: false },
            { id: 'future', title: { ar: 'تخطيط المستقبل', en: 'Future Planning' }, description: { ar: 'خططوا معاً', en: 'Plan together' }, totalSteps: 5, completedByCount: 0, isEnabled: true, isPremium: true },
        ];

        // Merge saved config with defaults
        let journeys = defaultJourneys;
        if (data?.value && Array.isArray(data.value)) {
            const savedMap = new Map(data.value.map((j: any) => [j.id, j]));
            journeys = defaultJourneys.map(defaultJourney => {
                const saved = savedMap.get(defaultJourney.id);
                return saved ? { ...defaultJourney, ...saved } : defaultJourney;
            });
        }

        // Fetch actual completion counts from user_journey_progress table
        const { data: progressCounts } = await supabase
            .from('user_journey_progress')
            .select('journey_id')
            .eq('completed', true);

        if (progressCounts) {
            const countMap: Record<string, number> = {};
            progressCounts.forEach((p: { journey_id: string }) => {
                countMap[p.journey_id] = (countMap[p.journey_id] || 0) + 1;
            });

            journeys = journeys.map(journey => ({
                ...journey,
                completedByCount: countMap[journey.id] || journey.completedByCount || 0
            }));
        }

        return NextResponse.json({ journeys });

    } catch (error: any) {
        console.error('Journeys fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Update journeys configuration
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const adminToken = cookieStore.get('admin_session')?.value;
        if (!adminToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { journeys } = await req.json();

        // Upsert journeys config
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'journeys_config',
                value: journeys,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error saving journeys:', error);
            return NextResponse.json({ error: 'Failed to save journeys config' }, { status: 500 });
        }

        // Log admin action
        await supabase.from('admin_audit_log').insert({
            admin_email: adminToken.split(':')[0],
            action: 'UPDATE_JOURNEYS_CONFIG',
            target_id: 'journeys_config',
            target_type: 'settings',
            details: { journeys_count: journeys.length },
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Journeys save error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
