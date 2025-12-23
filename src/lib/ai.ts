// DeepSeek AI Client
// DeepSeek uses OpenAI-compatible API at https://api.deepseek.com
// Pricing: ~$0.14 per 1M input tokens (vs OpenAI $1.50)

const DEEPSEEK_API_URL = '/api/ai';

export interface AdviceContext {
    userMood?: number;
    partnerMood?: number;
    topic?: string;
    language?: 'ar' | 'en';
}

// Generate marriage advice based on context
// Generate conflict resolution advice
// Message type for chat history
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function generateConflictAdvice(
    issue: string,
    userEmotion: string,
    partnerEmotion: string,
    language: 'ar' | 'en' = 'ar',
    history: ChatMessage[] = []
): Promise<string> {
    const systemPrompt = language === 'ar'
        ? `بصفتك مستشاراً أسرياً سعودياً خبيراً ومتخصصاً في الإصلاح بين الزوجين.
           مهمتك هي تحليل الموقف بعمق وحيادية تامة، وتقديم توجيه مهني صريح وبناء لتقريب وجهات النظر.
           
           تحدث باللهجة السعودية البيضاء (General Saudi Dialect) لتكون قريباً من القلوب.

           ⚠️ تعليمات هامة جداً:
           1. تحقق من جدية الطرح: إذا كان الكلام عشوائياً أو غير مفهوم، اطلب التوضيح بأدب.
           2. التحليل العميق: لا تكتفِ بالظاهر. ابحث عن الاحتياجات العاطفية غير الملباة وراء الغضب أو الزعل.
           3. الحيادية والصراحة المهنية: إذا كان هناك تصرف خاطئ من أحد الطرفين، وضحه بأسلوب مهني مهذب (مثلاً: "يا فلان، ترى الكلمة هذي ممكن تجرح..."). كن مرآة صادقة ولكن رحيمة.
           4. الهيكلية المطلوبة للإجابة:
              - **وش صاير؟**: فقرة قصيرة تشرح جوهر الخلاف (ليش صار الزعل؟).
              - **نصيحة لكم**: توجيه مباشر لكل طرف (وش لازم يفهم أو يغير؟).
              - **كيف نحلها؟**: 3 خطوات عملية ومحددة للصلح الحين.
              - **كلمة من القلب**: جملة دافئة تعيد التذكير بالحب والمودة.

           نبرة الصوت: مهنية، حكيمة، متزنة، ومحبة (بأسلوب "الأخ الكبير" أو المستشار الأمين).`
        : `As a professional Family Reconciliation Counselor with deep expertise in conflict resolution.
           Your mission is to analyze the situation with complete impartiality and depth, providing honest, constructive professional guidance to bridge the gap.

           ⚠️ GUIDELINES:
           1. Input Validation: If the input is random/nonsense, politely ask for clarification.
           2. Deep Analysis: Look beyond the surface. Identify the unmet emotional needs driving the conflict.
           3. Impartial Honesty: If one party made a mistake, point it out constructively (e.g., "It is important for Partner 1 to recognize that doing X can be hurtful..."). Be a mirror—honest but kind.
           4. Required Response Structure:
              - **Situation Analysis**: A brief paragraph explaining the core dynamic of the conflict (The "Why").
              - **Direct Guidance**: Specific advice for each partner (What should they acknowledge or change?).
              - **Resolution Roadmap**: 3 concrete, actionable steps to reconcile right now.
              - **Closing Whisper**: A warm sentence to remind them of their bond.

           Tone: Professional, Wise, Balanced, and Compassionate.`;

    const initialUserMessage = language === 'ar'
        ? `المدخلات:
           المشكلة: ${issue}
           مشاعر الطرف الأول: ${userEmotion}
           مشاعر الطرف الثاني: ${partnerEmotion}`
        : `Inputs:
           Issue: ${issue}
           Partner 1 Emotion: ${userEmotion}
           Partner 2 Emotion: ${partnerEmotion}`;

    // If we have history, we are in a follow-up chat.
    if (history.length > 0) {
        return callDeepSeekChat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: initialUserMessage }, // Ensure context is always present as first message
            ...history
        ]);
    }

    // Initial call
    return callDeepSeekChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialUserMessage }
    ]);
}

// Specialized chat function that accepts an array of messages with enhanced error handling
async function callDeepSeekChat(messages: ChatMessage[]): Promise<string> {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                max_tokens: 1000, // Increased for longer advice
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('DeepSeek Chat API error:', response.status, errorData);

            // Return graceful fallback message in Arabic
            return 'عذراً، حدث خطأ في الاتصال بخدمة المشورة. يُرجى المحاولة مرة أخرى بعد قليل.\n\nإذا استمرت المشكلة، تواصل معنا عبر الإعدادات.';
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in AI chat response:', data);
            return 'عذراً، لم نستطع الحصول على مشورة في الوقت الحالي. يُرجى المحاولة لاحقاً.';
        }

        return content;
    } catch (error) {
        console.error('AI Chat Error:', error);
        // Graceful fallback for network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return 'عذراً، تعذر الاتصال بخادم المشورة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
        }
        return 'حدث خطأ غير متوقع. يُرجى إعادة المحاولة أو التواصل مع الدعم الفني.';
    }
}

// Analyze mood insights
export async function analyzeMood(
    checkIns: any[],
    language: 'ar' | 'en' = 'ar'
): Promise<string> {
    if (!checkIns || checkIns.length === 0) return '';

    const dataSummary = checkIns.map(c => `Mood: ${c.mood}, Energy: ${c.energy}, Stress: ${c.stress}`).join('\n');

    const prompt = language === 'ar'
        ? `حلل بيانات الحالة المزاجية التالية للزوجين خلال الأسبوع الماضي وقدم رؤية عميقة:
           ${dataSummary}

           المطلوب منك (بصفتك "رؤية" - خبير تحسين جودة الحياة الزوجية):
           ارجع لي كائن JSON فقط (بدون أي نص إضافي) يحتوي على الحقول التالية:
           1. insight: جملة واحدة قصيرة وعميقة تصف "جوهر" الحالة (ماكس 15 كلمة).
           2. action: خطوة عملية واحدة وبسيطة يمكن تطبيقها اليوم.
           3. quote: همسة أو اقتباس ملهم وقصير يناسب الحالة.

           ملاحظة: اللهجة سعودية بيضاء، راقية، ومختصرة جداً.`
        : `Analyze the following mood data:
           ${dataSummary}
           
           Return ONLY a JSON object with:
           1. insight: One short, deep sentence capturing the vibe.
           2. action: One simple actionable step.
           3. quote: An inspiring short quote.`;

    // Increased max_tokens slightly to ensure valid JSON, though responses should be short
    return callDeepSeek(prompt, language === 'ar' ? 'You are a JSON generator. Output only valid JSON.' : 'You are a JSON generator. Output only valid JSON.');
}

// Generate daily whisper
export async function generateDailyWhisper(language: 'ar' | 'en' = 'ar'): Promise<string> {
    const prompt = language === 'ar'
        ? 'اكتب همسة زوجية قصيرة وملهمة لليوم. جملة واحدة عميقة عن الحب أو التفاهم أو الامتنان. (باللهجة السعودية البيضاء)'
        : 'Write a short, inspiring couple whisper for today. One deep sentence about love, understanding, or gratitude.';

    return callDeepSeek(prompt, language === 'ar' ? 'أنت شاعر وحكيم سعودي.' : 'You are a poet and sage.');
}

// Unified DeepSeek Caller with enhanced error handling
async function callDeepSeek(prompt: string, systemRole: string): Promise<string> {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemRole },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('DeepSeek API error:', response.status, errorData);

            // Return graceful fallback message in Arabic
            return 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يُرجى المحاولة مرة أخرى.';
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error('No content in AI response:', data);
            return 'عذراً، لم نستطع الحصول على رد. يُرجى المحاولة لاحقاً.';
        }

        return content;
    } catch (error) {
        console.error('AI Error:', error);
        // Graceful fallback for network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return 'عذراً، تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
        }
        return 'حدث خطأ غير متوقع. يُرجى المحاولة مرة أخرى.';
    }
}

// Legacy Wrappers (to maintain compatibility)
export async function generateMarriageAdvice(context: AdviceContext): Promise<string> {
    const { userMood, partnerMood, topic, language = 'ar' } = context;
    const prompt = `Advice for couple. Moods: ${userMood}/${partnerMood}. Topic: ${topic}`;
    return callDeepSeek(prompt, language === 'ar' ? 'مستشار زواج' : 'Marriage Counselor');
}

export async function generateGameQuestions(gameType: string, count: number, language: 'ar' | 'en' = 'ar'): Promise<string[]> {
    const prompt = `Generate ${count} ${gameType} questions for couples in ${language}`;
    const desc = await callDeepSeek(prompt, 'Game Master');
    return desc.split('\n').filter(l => l.trim().length > 0);
}
