import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, category } = body;

        // Get partner ID
        const { data: couple } = await supabase
            .from('couples')
            .select('partner1_id, partner2_id')
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .single();

        if (!couple) {
            return NextResponse.json({ error: 'No partner found' }, { status: 400 });
        }

        const partnerId = couple.partner1_id === user.id ? couple.partner2_id : couple.partner1_id;

        // Create the spark
        const { data: spark, error } = await supabase
            .from('secret_sparks')
            .insert({
                requester_id: user.id,
                partner_id: partnerId,
                content,
                category: category || 'General',
                status: 'PENDING_AI'
            })
            .select()
            .single();

        if (error) throw error;

        // Trigger AI processing immediately (asynchronously in a real queue, but direct here for MVP)
        // We'll call the process logic securely. For now, just return success.

        return NextResponse.json({ success: true, spark });

    } catch (error) {
        console.error('Spark creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
