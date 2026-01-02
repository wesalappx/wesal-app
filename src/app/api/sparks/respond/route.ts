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

        // Trigger AI processing for the final verdict
        // We can do this asynchronously or simply rely on the background job
        // For better UX, let's try to trigger it immediately via an internal fetch call if possible
        // But for now, we'll just return success and let the client assume it's being processed
        // Ideally, we should call the process API here.

        // TODO: Call /api/sparks/process to analyze the response immediately

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Spark response error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
