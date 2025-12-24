// Whisper Cards Data - Romantic invitation messages
// These messages are tasteful and use Saudi dialect

export interface WhisperCard {
    id: string;
    emoji: string;
    text_ar: string;
    text_en: string;
    mood: 'romantic' | 'longing' | 'subtle' | 'direct' | 'casual' | 'playful';
}

export const whisperCards: WhisperCard[] = [
    {
        id: 'w1',
        emoji: '🌙',
        text_ar: 'ودي نكون قريبين الليلة...',
        text_en: 'I want us to be close tonight...',
        mood: 'romantic'
    },
    {
        id: 'w2',
        emoji: '💫',
        text_ar: 'أشتاقلك... متى نختلي؟',
        text_en: 'I miss you... when can we be alone?',
        mood: 'longing'
    },
    {
        id: 'w3',
        emoji: '🕯️',
        text_ar: 'الليلة خاصة لنا؟',
        text_en: 'Tonight is ours?',
        mood: 'subtle'
    },
    {
        id: 'w4',
        emoji: '🌹',
        text_ar: 'أبيك قريب مني...',
        text_en: 'I want you near me...',
        mood: 'direct'
    },
    {
        id: 'w5',
        emoji: '✨',
        text_ar: 'وقت لنا بس؟',
        text_en: 'Time just for us?',
        mood: 'casual'
    },
    {
        id: 'w6',
        emoji: '💕',
        text_ar: 'قلبي يناديك...',
        text_en: 'My heart is calling you...',
        mood: 'romantic'
    },
    {
        id: 'w7',
        emoji: '🌺',
        text_ar: 'تعال نسهر سوا...',
        text_en: 'Come stay up with me...',
        mood: 'playful'
    },
    {
        id: 'w8',
        emoji: '🔥',
        text_ar: 'اشتقت لدفاك...',
        text_en: 'I miss your warmth...',
        mood: 'direct'
    }
];

export interface ResponseOption {
    id: 'accept' | 'later' | 'not_now';
    emoji: string;
    text_ar: string;
    text_en: string;
    color: string;
}

export const responseOptions: ResponseOption[] = [
    {
        id: 'accept',
        emoji: '💕',
        text_ar: 'بانتظارك',
        text_en: 'Waiting for you',
        color: 'from-pink-500 to-rose-600'
    },
    {
        id: 'later',
        emoji: '⏰',
        text_ar: 'لاحقاً',
        text_en: 'Later',
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'not_now',
        emoji: '🌸',
        text_ar: 'مو الحين',
        text_en: 'Not now',
        color: 'from-surface-600 to-surface-700'
    }
];

export const timeOptions = [
    { id: 'now', text_ar: 'الحين', text_en: 'Now' },
    { id: 'tonight', text_ar: 'الليلة', text_en: 'Tonight' },
    { id: 'tomorrow', text_ar: 'بكرة', text_en: 'Tomorrow' },
    { id: 'weekend', text_ar: 'نهاية الأسبوع', text_en: 'Weekend' }
];
