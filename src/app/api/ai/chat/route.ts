import { NextResponse } from 'next/server';

// Gemini API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ content: 'AI service not configured' }, { status: 500 });
        }

        const messages = body.messages || [];
        const systemMessage = messages.find((m: any) => m.role === 'system');
        const conversationMessages = messages.filter((m: any) => m.role !== 'system');

        // Build Gemini request
        const geminiRequest = {
            contents: conversationMessages.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            })),
            systemInstruction: systemMessage ? {
                parts: [{ text: systemMessage.content }]
            } : undefined,
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1024,
                topP: 0.95,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiRequest),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('Gemini API Error:', response.status, errorText);
            return NextResponse.json({ content: 'AI service error' }, { status: response.status });
        }

        const data = await response.json();

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return NextResponse.json({ content: 'Invalid AI response' }, { status: 500 });
        }

        // Return simple format for chat
        return NextResponse.json({
            content: data.candidates[0].content.parts[0].text
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ content: 'An error occurred' }, { status: 500 });
    }
}
