import { NextResponse } from 'next/server';

// Gemini 3 Flash API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        // Validate API key
        if (!apiKey) {
            console.error('Google AI API Key not configured in environment variables');
            return NextResponse.json(
                {
                    error: 'AI service not configured',
                    message: 'خدمة الذكاء الاصطناعي غير متوفرة حالياً. يُرجى المحاولة لاحقاً.'
                },
                { status: 500 }
            );
        }

        // Convert OpenAI-style messages to Gemini format
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
                temperature: body.temperature || 0.7,
                maxOutputTokens: body.max_tokens || 2048,
                topP: 0.95,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        // Call Gemini API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for complex analysis

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiRequest),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('Gemini API Error:', response.status, errorText);

            // Provide user-friendly error messages
            let userMessage = 'حدث خطأ في خدمة الذكاء الاصطناعي.';

            if (response.status === 400) {
                userMessage = 'طلب غير صالح. يُرجى التحقق من المدخلات.';
            } else if (response.status === 401 || response.status === 403) {
                userMessage = 'خطأ في المصادقة مع خدمة AI.';
                console.error('Invalid API key or authentication issue');
            } else if (response.status === 429) {
                userMessage = 'تم تجاوز حد الاستخدام. يُرجى المحاولة بعد دقيقة.';
            } else if (response.status >= 500) {
                userMessage = 'خدمة AI غير متاحة مؤقتاً. يُرجى المحاولة لاحقاً.';
            }

            return NextResponse.json(
                {
                    error: `Gemini API error: ${response.status}`,
                    message: userMessage,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Validate response structure
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid response structure from Gemini:', data);

            // Check for safety block
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                return NextResponse.json(
                    {
                        error: 'Content filtered',
                        message: 'تم تصفية المحتوى. يُرجى إعادة صياغة السؤال.'
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                {
                    error: 'Invalid AI response',
                    message: 'لم نحصل على رد صالح من خدمة AI.'
                },
                { status: 500 }
            );
        }

        // Convert Gemini response to OpenAI format (for compatibility with existing frontend)
        const geminiContent = data.candidates[0].content.parts[0].text;
        const openAIFormatResponse = {
            choices: [
                {
                    message: {
                        role: 'assistant',
                        content: geminiContent
                    },
                    finish_reason: data.candidates[0].finishReason?.toLowerCase() || 'stop'
                }
            ],
            usage: {
                prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
                completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: data.usageMetadata?.totalTokenCount || 0
            },
            model: 'gemini-2.0-flash'
        };

        return NextResponse.json(openAIFormatResponse);

    } catch (error: any) {
        console.error('Proxy Error:', error);

        // Handle specific error types
        if (error.name === 'AbortError') {
            return NextResponse.json(
                {
                    error: 'Request timeout',
                    message: 'انتهت مهلة الطلب. يُرجى المحاولة مرة أخرى.'
                },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: 'حدث خطأ غير متوقع. يُرجى المحاولة مرة أخرى.',
                details: error.message
            },
            { status: 500 }
        );
    }
}
