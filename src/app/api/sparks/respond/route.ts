import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { sparkId, response } = await req.json();

        if (!sparkId || !response) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // update the spark with the partner's response
        const { error } = await supabase
            .from('secret_sparks')
            .update({
                partner_response: response,
                status: 'PARTNER_REPLIED',
                updated_at: new Date().toISOString()
            })
            .eq('id', sparkId)
            .eq('partner_id', user.id); // Ensure the responder is the target partner

        if (error) {
            console.error('Error updating spark:', error);
            return new NextResponse('Failed to record response', { status: 500 });
        }

        // Trigger AI processing for the final verdict immediately
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/sparks/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (processError) {
            // Don't fail the response if processing fails - it can be picked up later
            console.error('Error triggering spark processing:', processError);
        }

        return NextResponse.json({ success: true, message: 'Response recorded, AI is analyzing...' });

    } catch (error) {
        console.error('Spark response error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

