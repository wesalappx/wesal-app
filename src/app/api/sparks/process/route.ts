import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function callGemini(prompt: string) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content in Gemini response');

    return JSON.parse(text.replace(/```json|```/g, '').trim());
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check for sparks that need Response Analysis (PARTNER_REPLIED)
        const { data: responseSparks, error: responseError } = await supabase
            .from('secret_sparks')
            .select('*')
            .eq('status', 'PARTNER_REPLIED')
            .limit(5);

        if (responseError) throw responseError;

        if (responseSparks && responseSparks.length > 0) {
            for (const spark of responseSparks) {
                await analyzeResponse(supabase, spark);
            }
            return NextResponse.json({ processed: responseSparks.length, type: 'responses' });
        }

        // Check for NEW sparks (Initial Mediation)
        const { data: newSparks, error: newSparksError } = await supabase
            .from('secret_sparks')
            .select('*')
            .eq('status', 'NEW')
            .limit(5);

        if (newSparksError) throw newSparksError;

        if (newSparks && newSparks.length > 0) {
            for (const spark of newSparks) {
                await processSpark(supabase, spark);
            }
            return NextResponse.json({ processed: newSparks.length, type: 'new_sparks' });
        }

        return NextResponse.json({ processed: 0, type: 'none' });

    } catch (error) {
        console.error('Spark processing error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function processSpark(supabase: any, spark: any) {
    try {
        const prompt = `
            You are a relationship mediator AI. 
            User (Partner A) has a secret/desire: "${spark.content}"
            Category: ${spark.category}
            
            Your goal is to formulate a gentle, non-threatening question to ask Partner B to gauge their receptiveness to this topic, without revealing the exact secret yet.
            
            Return ONLY a JSON object:
            {
                "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "RISKY",
                "risk_score": 0-100,
                "ai_question": "The question to ask Partner B",
                "advice": "Advice for Partner A if it's too risky"
            }
        `;

        const analysis = await callGemini(prompt);

        if (analysis.risk_score > 80) {
            await supabase
                .from('secret_sparks')
                .update({
                    status: 'SOFT_REJECTED',
                    ai_analysis: analysis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', spark.id);
        } else {
            await supabase
                .from('secret_sparks')
                .update({
                    status: 'AI_PROPOSING',
                    ai_probe_question: analysis.ai_question,
                    ai_analysis: analysis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', spark.id);
        }

    } catch (error) {
        console.error(`Error processing spark ${spark.id}:`, error);
    }
}

async function analyzeResponse(supabase: any, spark: any) {
    try {
        const prompt = `
            You are a relationship mediator AI.
            Original Secret (Partner A): "${spark.content}"
            AI Probe Question: "${spark.ai_probe_question}"
            Partner B's Response: "${spark.partner_response}"
            
            Analyze Partner B's response. Is it safe and positive enough to reveal the original secret to them?
            
            Return ONLY a JSON object:
            {
                "receptiveness": "HIGH" | "MEDIUM" | "LOW",
                "reveal_decision": true | false,
                "reasoning": "Why you made this decision",
                "summary_for_partner_a": "Summary of B's response to show A (gentle phrasing)"
            }
        `;

        const analysis = await callGemini(prompt);

        if (analysis.reveal_decision) {
            await supabase
                .from('secret_sparks')
                .update({
                    status: 'REVEALED',
                    final_verdict: analysis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', spark.id);
        } else {
            await supabase
                .from('secret_sparks')
                .update({
                    status: 'SOFT_REJECTED',
                    final_verdict: analysis,
                    updated_at: new Date().toISOString()
                })
                .eq('id', spark.id);
        }

    } catch (error) {
        console.error(`Error analyzing response for spark ${spark.id}:`, error);
    }
}
