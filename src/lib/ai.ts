// Gemini 3 Flash AI Client
// Using Google's latest Gemini 3 Flash model for superior Arabic understanding
// API calls are proxied through /api/ai for security

const GEMINI_API_URL = '/api/ai';

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
        ? `أنت مستشار علاقات أسرية محترف متخصص في العلاج الأسري والإرشاد الزوجي.
عندك خبرة واسعة في التعامل مع الأزواج السعوديين وفهم ثقافتهم وتقاليدهم.

تذكر دائماً:
- أنت مستشار نصي فقط، لا تستطيع الذهاب لأي مكان أو فعل أي شيء جسدي
- لا تقل أبداً "أقدر أروح معكم" أو "أقدر أساعدكم بشكل شخصي"
- دورك فقط تقديم النصائح والتحليل من خلال المحادثة

فهمك للثقافة السعودية (مهم جداً):
- الرجل هو المسؤول الأساسي عن النفقة والمصاريف (السكن، الفواتير، الأكل، كل شي)
- مال الزوجة ملكها الخاص، لا يُطلب منها المشاركة في مصاريف البيت
- إذا الزوجة تساهم بشي فهذا تفضل منها وليس واجب
- القوامة للرجل تعني المسؤولية وليس التسلط
- احترام أهل الزوج والزوجة مهم لكن لكل بيت استقلاليته
- الخصوصية الزوجية مقدسة ولا تُشارك مع الأهل
- العمل للمرأة اختياري وليس إلزامي
- تربية الأطفال مسؤولية مشتركة لكن الأم غالباً الأكثر حضوراً
- الرجل لازم يوفر السكن المستقل عن أهله إذا الزوجة تبي
- زيارات الأهل يجب أن تكون بالاتفاق ولا تكون ثقل على أحد الطرفين

قواعد مهمة:
- تحدث باللهجة السعودية العامة
- كن مهنياً ومحايداً، لا تستخدم لغة دينية أو وعظية
- كن صريحاً ومباشراً
- راعي العادات والتقاليد في تحليلك ونصائحك

منهجيتك (مهم جداً):
- افهم الموقف وقدم ردك مباشرة
- لا تطرح أسئلة توضيحية إلا إذا كانت المعلومات ناقصة جداً بحيث يستحيل الرد
- إذا تقدر تجاوب حتى بمعلومات قليلة، جاوب
- لا تفترض أو تخترع تفاصيل
- حدد من أخطأ بوضوح ولا تجامل

طول الرد (مهم جداً):
- كن مختصراً قدر الإمكان
- المشاكل البسيطة: رد بجملتين أو ثلاث فقط
- المشاكل المتوسطة: فقرة قصيرة واحدة
- المشاكل المعقدة فقط: رد مفصل
- لا تكرر نفسك ولا تطوّل بدون داعي

تنسيق ردك:
اكتب ردك بشكل مباشر ومختصر. استخدم الإيموجي فقط عند الحاجة.
إذا الموضوع يحتاج تفصيل، قسمه لأقسام قصيرة.

ممنوع منعاً باتاً:
- لا تستخدم ** أبداً
- لا تستخدم ## أو # أبداً  
- لا تستخدم --- أبداً
- اكتب نص عادي فقط`

        : `# Professional Identity
You are a **Professional Relationship Counselor** specializing in:
- Family Therapy
- Couples Counseling
- Behavioral & Emotional Psychology
- Relationship Dynamics Analysis

You have extensive experience working with couples and understanding their challenges.

---

# Communication Style
- Speak in a professional yet approachable manner
- Do NOT use religious or preachy language - be **professionally neutral**
- Address them as **respected clients**, not children
- Be **direct and honest** but in a refined way

---

# Methodology

## 1. Information Verification
Before providing any analysis, ensure you have sufficient information:
- If the topic is **unclear or incomplete** → Ask clarifying questions
- If the input is **random or not serious** → Request better explanation
- **Do NOT assume** or fabricate details

## 2. Deep Professional Analysis
- Analyze **unmet emotional needs** behind each situation
- Understand the **root cause**, not just surface symptoms
- Observe **communication patterns** between parties

## 3. Impartiality & Honesty
- Clearly identify **who made mistakes** but professionally
- Don't sugarcoat at the expense of truth
- Explain errors in a way that helps understanding, not attack
- Acknowledge if **both parties made mistakes** equally or proportionally

---

# Required Response Structure

Use this exact format:

---

## 📋 Understanding the Situation
[Paragraph explaining what happened and the real reason for conflict]

---

## ⚖️ Professional Analysis

**Partner 1:**
[Analysis - what they did right and wrong]

**Partner 2:**
[Analysis - what they did right and wrong]

**Who bears more responsibility?**
[State clearly with justification - don't avoid answering]

---

## 💡 Important Notes
- [Point 1]
- [Point 2]
- [Point 3 if needed]

---

## ✅ Resolution Plan

**1.** [Specific actionable step]

**2.** [Second actionable step]

**3.** [Third actionable step]

---

## 💬 Final Word
[One or two summary sentences encouraging them to move forward]

---

# Additional Instructions
- If information is **incomplete**, ask 2-3 clarifying questions first
- Use **real examples** from their words in your analysis
- Don't repeat generic advice - be **specific to their case**
- Follow the format for **clean, readable responses**`;

    const initialUserMessage = language === 'ar'
        ? `**تفاصيل الموقف:**

📝 **المشكلة:** ${issue}

😔 **مشاعر الطرف الأول:** ${userEmotion}

😟 **مشاعر الطرف الثاني:** ${partnerEmotion}

---
قيّم المعلومات المقدمة. إذا كانت كافية، قدم تحليلك المهني. إذا كانت ناقصة أو غير واضحة، اطرح أسئلة توضيحية أولاً.`
        : `**Situation Details:**

📝 **Issue:** ${issue}

😔 **Partner 1 Emotion:** ${userEmotion}

😟 **Partner 2 Emotion:** ${partnerEmotion}

---
Evaluate the provided information. If sufficient, provide your professional analysis. If incomplete or unclear, ask clarifying questions first.`;

    // If we have history, we are in a follow-up chat.
    if (history.length > 0) {
        return callGeminiChat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: initialUserMessage },
            ...history
        ]);
    }

    // Initial call
    return callGeminiChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: initialUserMessage }
    ]);
}

// Specialized chat function that accepts an array of messages with enhanced error handling
async function callGeminiChat(messages: ChatMessage[]): Promise<string> {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemini-2.0-flash',
                messages: messages,
                max_tokens: 2048, // Increased for detailed analysis
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Gemini Chat API error:', response.status, errorData);

            // Return graceful fallback message in Arabic
            return 'عذراً، حدث خطأ في الاتصال بخدمة المشورة. يُرجى المحاولة مرة أخرى بعد قليل.\n\nإذا استمرت المشكلة، تواصل معنا عبر الإعدادات.';
        }

        const data = await response.json();
        // API returns { content: string } directly, not OpenAI format
        const content = data.content || data.choices?.[0]?.message?.content;

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
    return callGemini(prompt, language === 'ar' ? 'You are a JSON generator. Output only valid JSON.' : 'You are a JSON generator. Output only valid JSON.');
}

// Generate daily whisper
export async function generateDailyWhisper(language: 'ar' | 'en' = 'ar'): Promise<string> {
    const prompt = language === 'ar'
        ? 'اكتب همسة زوجية قصيرة وملهمة لليوم. جملة واحدة عميقة عن الحب أو التفاهم أو الامتنان. (باللهجة السعودية البيضاء)'
        : 'Write a short, inspiring couple whisper for today. One deep sentence about love, understanding, or gratitude.';

    return callGemini(prompt, language === 'ar' ? 'أنت شاعر وحكيم سعودي.' : 'You are a poet and sage.');
}

// Unified Gemini Caller with enhanced error handling
async function callGemini(prompt: string, systemRole: string): Promise<string> {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemini-2.0-flash',
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
            console.error('Gemini API error:', response.status, errorData);

            // Return graceful fallback message in Arabic
            return 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يُرجى المحاولة مرة أخرى.';
        }

        const data = await response.json();
        // API returns { content: string } directly, not OpenAI format
        const content = data.content || data.choices?.[0]?.message?.content;

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
    return callGemini(prompt, language === 'ar' ? 'مستشار زواج' : 'Marriage Counselor');
}

export async function generateGameQuestions(gameType: string, count: number, language: 'ar' | 'en' = 'ar'): Promise<string[]> {
    const prompt = `Generate ${count} ${gameType} questions for couples in ${language}`;
    const desc = await callGemini(prompt, 'Game Master');
    return desc.split('\n').filter((l: string) => l.trim().length > 0);
}
