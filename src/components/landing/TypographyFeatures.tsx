'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle, Gamepad2, Calendar, Route, Heart, Shield } from 'lucide-react';

const features = [
    {
        icon: MessageCircle,
        title: "المستشار الذكي",
        description: "مساعدك الشخصي اللي يفهم مشاعرك.",
        detail: "عندك مشكلة أو تبي نصيحة؟ المستشار الذكي موجود 24/7. يسمع منك ومن شريكك، ويحلل الموقف بحيادية تامة، ويعطيكم حلول عملية تقوي علاقتكم بدل ما تزيد الطين بلة.",
        color: "text-purple-600",
        bg: "from-purple-500/10",
        cardBg: "bg-purple-50"
    },
    {
        icon: Gamepad2,
        title: "ألعاب تفاعلية",
        description: "الضحك والمرح هم سر العلاقة.",
        detail: "اكسروا الروتين بألعاب مصممة خصيصاً للأزواج. من 'حرب الكومبلمنتات' اللي ترفع المعنويات، لـ 'أسئلة عميقة' اللي تخليكم تكتشفون جوانب جديدة في بعض، و'روليت الحب' للمفاجآت الحلوة.",
        color: "text-pink-600",
        bg: "from-pink-500/10",
        cardBg: "bg-pink-50"
    },
    {
        icon: Route,
        title: "رحلات النمو",
        description: "نكبر وننضج مع بعض.",
        detail: "مسارات محددة وخطوات عملية تاخذكم في رحلة لتطوير جانب معين في علاقتكم. سواء تبون تحسنون التواصل، تزيدون الثقة، أو تجددون الشغف، الرحلات هي خارطة الطريق.",
        color: "text-emerald-600",
        bg: "from-emerald-500/10",
        cardBg: "bg-emerald-50"
    },
    {
        icon: Heart,
        title: "شرارات يومية",
        description: "لمسات صغيرة، تأثير كبير.",
        detail: "أفكار بسيطة ومبدعة تجيك يومياً عشان تفاجئ شريكك. رسالة حلوة، اقتراح لعشاء رومانسي، أو حتى كلمة شكر. لأن الحب يكمن في التفاصيل الصغيرة.",
        color: "text-rose-600",
        bg: "from-rose-500/10",
        cardBg: "bg-rose-50"
    },
    {
        icon: Calendar,
        title: "التقويم المشترك",
        description: "حياتكم، مرتبة ومتناغمة.",
        detail: "ما عاد فيه 'نسيت موعدنا'! تقويم يجمع تواريخكم المهمة، ذكرياتكم السنوية، وخططكم المستقبلية في مكان واحد مشترك بينكم.",
        color: "text-blue-600",
        bg: "from-blue-500/10",
        cardBg: "bg-blue-50"
    },
    {
        icon: Shield,
        title: "مساحة آمنة",
        description: "خصوصيتكم هي أولويتنا.",
        detail: "مكانكم الخاص جداً. كل حرف تكتبونه، كل صورة تشاركونها، مشفرة ومحفوظة بأعلى معايير الأمان. لأن أسراركم غالية، ووصال هو الصندوق اللي يحفظها.",
        color: "text-slate-600",
        bg: "from-slate-500/10",
        cardBg: "bg-slate-50"
    }

];

export default function TypographyFeatures() {
    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.h2
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-5xl md:text-7xl font-black text-slate-900 mb-24 text-center tracking-tighter"
                >
                    كل ما تحتاجه<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-600 to-slate-500">
                        لعلاقة استثنائية
                    </span>
                </motion.h2>

                <div className="space-y-32">
                    {features.map((feature, i) => (
                        <FeatureRow key={i} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureRow({ feature, index }: { feature: any, index: number }) {
    const isEven = index % 2 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}
        >
            {/* Typography Side */}
            <div className="flex-1 text-center md:text-right">
                <div className={`inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${feature.bg} to-transparent mb-6`}>
                    <feature.icon className={`w-10 h-10 ${feature.color}`} />
                </div>
                <h3 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                    {feature.title}
                </h3>
                <p className={`text-2xl md:text-3xl font-medium ${feature.color} mb-6`}>
                    {feature.description}
                </p>
                <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
                    {feature.detail}
                </p>
            </div>

            {/* Visual Side (Abstract Representation) */}
            <div className="flex-1 w-full">
                <div className={`relative aspect-square md:aspect-[4/3] rounded-[3rem] overflow-hidden ${feature.cardBg} border border-white/40 shadow-xl shadow-slate-200/50 p-8 flex items-center justify-center group transition-colors duration-500`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.bg} to-transparent opacity-40`} />

                    {/* Dynamic Visual Placeholder */}
                    <div className="relative z-10 text-center transform group-hover:scale-105 transition-transform duration-700">
                        <feature.icon className={`w-32 h-32 ${feature.color} mx-auto opacity-90 drop-shadow-2xl`} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
