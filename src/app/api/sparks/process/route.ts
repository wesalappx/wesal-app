import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Ensure this is set

export async function POST(request: Request) {
    try {
        const { sparkId } = await request.json();
        const supabase = await createClient();

        // 1. Fetch the spark
        const { data: spark } = await supabase
            .from('secret_sparks')
            .select('*')
            .eq('id', sparkId)
            .single();

        if (!spark) return NextResponse.json({ error: 'Spark not found' }, { status: 404 });

        // 2. Prepare Gemini Prompt
        const prompt = `
            You are a relationship counselor AI. 
            User A has a secret desire they want to share with User B, but they are afraid of rejection.
            
            Secret Desire: "${spark.content}"
            Category: "${spark.category}"

            Your Goal: Create a "Soft Probe" question to ask User B. 
            - It should NOT reveal the specific secret yet.
            - It should test User B's openness to this *type* of activity.
            - It should be phrased as a fun or hypothetical question.

            Output JSON only:
            {
                "probe_question": "...",
                "reasoning": "..."
            }
        `;

        // 3. Call Gemini
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const geminiData = await geminiRes.json();
        const aiResponseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponseText) throw new Error('AI generation failed');

        const aiResult = JSON.parse(aiResponseText);

        // 4. Update Database
        const { error } = await supabase
            .from('secret_sparks')
            .update({
                status: 'AI_PROPOSING',
                ai_probe_question: aiResult.probe_question,
                ai_verdict_reasoning: aiResult.reasoning
            })
            .eq('id', sparkId);

        if (error) throw error;

        return NextResponse.json({ success: true, probe: aiResult.probe_question });

    } catch (error) {
        console.error('Spark AI processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
