import { Heart, Sparkles, Map, MessageCircle, PenTool, Clock, Shield, Star, Users, Briefcase } from 'lucide-react';

export interface JourneyStep {
    id: number;
    title: string;
    type: 'quiz' | 'session' | 'exercise' | 'challenge' | 'msg';
    duration: string;
    description: string;
    icon: any; // Lucide icon component
}

export interface Journey {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    totalSteps: number;
    steps: JourneyStep[];
    isPremium?: boolean; // true = requires subscription, undefined/false = free
}

export const journeysData: Journey[] = [
    {
        id: 'basics',
        title: 'أساسيات العلاقة',
        description: 'بداية الرحلة لفهم بعض أكثر وبناء أساس قوي.',
        icon: Heart,
        color: 'text-rose-400',
        bg: 'from-rose-500/20 to-pink-600/20',
        border: 'border-rose-500/30',
        totalSteps: 5,
        isPremium: false, // FREE
        steps: [
            {
                id: 1,
                title: "لغات الحب",
                type: "quiz",
                duration: "٥ دقايق",
                description: "اكتشفوا وش هي اللغة اللي يفضلها الشريك في التعبير عن المشاعر.",
                icon: Heart
            },
            {
                id: 2,
                title: "جلسة مصارحة",
                type: "session",
                duration: "١٠ دقايق",
                description: "أسئلة بسيطة تكسر الحواجز وتفتح القلب.",
                icon: MessageCircle
            },
            {
                id: 3,
                title: "قيمنا المشتركة",
                type: "exercise",
                duration: "١٥ دقيقة",
                description: "وش الأشياء اللي ما نقدر نتنازل عنها في حياتنا؟",
                icon: PenTool
            },
            {
                id: 4,
                title: "تحدي الامتنان",
                type: "challenge",
                duration: "يوم كامل",
                description: "سجل ٣ أشياء أعجبتك في الشريك اليوم.",
                icon: Sparkles
            },
            {
                id: 5,
                title: "رسالة للمستقبل",
                type: "msg",
                duration: "٥ دقايق",
                description: "اكتب رسالة يقراها الشريك بعد سنة.",
                icon: Clock
            }
        ]
    },
    {
        id: 'communication',
        title: 'فن التواصل',
        description: 'كيف نفهم بعض بدون ما نتكلم؟ وكيف نعبر صح؟',
        icon: Sparkles,
        color: 'text-amber-400',
        bg: 'from-amber-500/20 to-orange-600/20',
        border: 'border-amber-500/30',
        totalSteps: 7,
        isPremium: false, // FREE
        steps: [
            {
                id: 1,
                title: "المستمع الجيد",
                type: "quiz",
                duration: "٧ دقايق",
                description: "هل تسمع عشان تفهم، ولا عشان ترد؟ اكتشفوا ستايلكم.",
                icon: MessageCircle
            },
            {
                id: 2,
                title: "تمرين الصدى",
                type: "exercise",
                duration: "١٠ دقايق",
                description: "تكتيك بسيط يخلي الشريك يحس انك فاهمه ١٠٠٪.",
                icon: Users
            },
            {
                id: 3,
                title: "لغة الجسد",
                type: "session",
                duration: "١٥ دقيقة",
                description: "كيف تقرا عيون وحركات شريكك وتفهم اللي ما قاله؟",
                icon: Sparkles
            },
            {
                id: 4,
                title: "درس في التقدير",
                type: "session",
                duration: "١٠ دقايق",
                description: "كيف تثبت لشريكك ان مشاعره مسموعة ومقدرة؟",
                icon: Heart
            },
            {
                id: 5,
                title: "طرق الزعل",
                type: "quiz",
                duration: "٥ دقايق",
                description: "كل واحد فيكم كيف يتصرف اذا زعل؟ هل ينفجر ولا يسكت؟",
                icon: Shield
            },
            {
                id: 6,
                title: "أنا أشعر..",
                type: "challenge",
                duration: "يومين",
                description: "تحدي لاستخدام عبارة 'أنا أحس' بدل 'أنت سويت'.",
                icon: Star
            },
            {
                id: 7,
                title: "حديث الوسادة",
                type: "session",
                duration: "٢٠ دقيقة",
                description: "جلسة هادية قبل النوم، بدون جوالات، فقط تواصل.",
                icon: Clock
            }
        ]
    },
    {
        id: 'future',
        title: 'تخطيط المستقبل',
        description: 'وين شايفين نفسنا بعد ٥ سنين؟ أحلامنا وأهدافنا المشتركة.',
        icon: Map,
        color: 'text-blue-400',
        bg: 'from-blue-500/20 to-cyan-600/20',
        border: 'border-blue-500/30',
        totalSteps: 6,
        isPremium: true, // PREMIUM - requires subscription
        steps: [
            {
                id: 1,
                title: "لوحة الأحلام",
                type: "exercise",
                duration: "٣٠ دقيقة",
                description: "صمموا صورة بصرية لحياتكم المثالية بعد ١٠ سنوات.",
                icon: Sparkles
            },
            {
                id: 2,
                title: "الأهداف المالية",
                type: "session",
                duration: "٢٠ دقيقة",
                description: "جلسة صريحة عن الفلوس، التوفير، والاستثمار.",
                icon: Briefcase
            },
            {
                id: 3,
                title: "العائلة والتربية",
                type: "session",
                duration: "١٥ دقيقة",
                description: "كيف نبغى نربي عيالنا؟ وش القيم اللي بنزرعها فيهم؟",
                icon: Users
            },
            {
                id: 4,
                title: "قائمة الأمنيات",
                type: "challenge",
                duration: "اسبوع",
                description: "اكتبوا ٥ اشياء مجنونة ودكم تسوونها سوا قبل الموت.",
                icon: Star
            },
            {
                id: 5,
                title: "التقاعد السعيد",
                type: "quiz",
                duration: "٥ دقايق",
                description: "وين بتعيشون لما تكبرون؟ مزرعة ولا مدينة؟",
                icon: Map
            },
            {
                id: 6,
                title: "الإرث",
                type: "session",
                duration: "١٥ دقيقة",
                description: "وش الأثر الطيب اللي ودكم الناس تذكركم فيه؟",
                icon: Heart
            }
        ]
    },
];

// Helper function to get steps for a specific journey
export const getJourneySteps = (journeyId: string | null) => {
    if (!journeyId) return null;
    const journey = journeysData.find(j => j.id === journeyId);
    return journey?.steps || null;
};
