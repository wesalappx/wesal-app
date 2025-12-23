import { NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const apiKey = process.env.DEEPSEEK_API_KEY;

        // Validate API key
        if (!apiKey) {
            console.error('DeepSeek API Key not configured in environment variables');
            return NextResponse.json(
                {
                    error: 'AI service not configured',
                    message: 'خدمة الذكاء الاصطناعي غير متوفرة حالياً. يُرجى المحاولة لاحقاً.'
                },
                { status: 500 }
            );
        }

        // Call DeepSeek API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('DeepSeek API Error:', response.status, errorText);

            // Provide user-friendly error messages
            let userMessage = 'حدث خطأ في خدمة الذكاء الاصطناعي.';

            if (response.status === 401) {
                userMessage = 'خطأ في المصادقة مع خدمة AI.';
                console.error('Invalid API key or authentication issue');
            } else if (response.status === 429) {
                userMessage = 'تم تجاوز حد الاستخدام. يُرجى المحاولة بعد دقيقة.';
            } else if (response.status >= 500) {
                userMessage = 'خدمة AI غير متاحة مؤقتاً. يُرجى المحاولة لاحقاً.';
            }

            return NextResponse.json(
                {
                    error: `DeepSeek API error: ${response.status}`,
                    message: userMessage,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Validate response structure
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid response structure from DeepSeek:', data);
            return NextResponse.json(
                {
                    error: 'Invalid AI response',
                    message: 'لم نحصل على رد صالح من خدمة AI.'
                },
                { status: 500 }
            );
        }

        return NextResponse.json(data);

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
