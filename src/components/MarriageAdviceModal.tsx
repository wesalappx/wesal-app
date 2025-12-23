'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Heart, Mic, Zap, DollarSign, Smile, Sparkles } from 'lucide-react';

interface MarriageAdviceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TOPICS = [
    { id: 'communication', label: 'التواصل', icon: Mic, color: 'bg-blue-500' },
    { id: 'romance', label: 'الرومانسية', icon: Heart, color: 'bg-rose-500' },
    { id: 'conflict', label: 'الخلافات', icon: Zap, color: 'bg-orange-500' },
    { id: 'appreciation', label: 'التقدير', icon: Sparkles, color: 'bg-amber-500' },
];

const ADVICE_DB: Record<string, Record<string, string[]>> = {
    'HE': {
        'communication': [
            "الاستماع ليس مجرد السكوت، بل هو الاستيعاب. جرب أن تعيد صياغة ما قالته لتتأكد من فهمك.",
            "لا تحاول دائماً تقديم حلول فورية. أحياناً هي تحتاج فقط لمن يسمعها ويتعاطف معها.",
            "الكلمات الطيبة صدقة، والكلمات الحلوة لزوجتك واجب. لا تبخل عليها بكلمة 'أحبك' أو 'يعطيك العافية'.",
            "عندما تتكلم زوجتك عن مشكلة، اسألها: 'هل تبغين حل ولا بس أسمعك؟'. هذا السؤال يختصر الكثير.",
            "تواصل بالعينين لما تتكلم معك. الانشغال بالجوال وقت كلامها يرسل رسالة سلبية جداً.",
            "لا تقاطعها وهي تتكلم، حتى لو كنت عارف القصة. هي تستمتع بالمشاركة معك.",
            "شاركها تفاصيل يومك، حتى لو كانت بسيطة. هذا يعطيها شعور أنك تشاركها حياتك ومو بس ساكن معها.",
            "اسألها عن يومها وتفاصيل اهتماماتها بصدق، مو بس مجاملة.",
            "إذا طلبت منك شي، سجل ملاحظة عشان ما تنسى. النسيان المتكرر يفسر كعدم اهتمام.",
            "الدعابة والمزح الخفيف يكسر الحواجز ويخلي الجو العام مريح."
        ],
        'romance': [
            "المفاجآت الصغيرة لها وقع السحر. وردة، رسالة، أو حتى شوكولاتة تحبها قد تغير مزاجها ليوم كامل.",
            "اللمسات الحانية (مسكة يد، قبلة على الجبين) تعزز الشعور بالأمان والحب أكثر من الهدايا الثمينة.",
            "خصص وقتاً أسبوعياً لكم أنتم الاثنين فقط، بعيداً عن الجوالات ومشاغل الحياة.",
            "امدح جمالها وأناقتها دائماً. لا تخليها تسأل 'كيف شكلي؟'، بادر أنت.",
            "تذكر تواريخكم المهمة (يوم الزواج، الميلاد) واحتفل فيها ولو بشيء بسيط.",
            "غازلها برسالة وهي جنبك، أو وأنت في الدوام. الشوق حلو.",
            "ساعدها في لبس المعطف أو فتح الباب. الحركات النبيلة (الجنتلمان) ما تموت وعندها قيمة كبيرة.",
            "احضنها بدون سبب. العناق يفرز هرمونات السعادة والأمان.",
            "اكسر الروتين بسفرة قصيرة أو عشاء في مطعم جديد.",
            "كن نظيفاً ومرتباً وتطيب لها كما تحب أن تتزين هي لك."
        ],
        'conflict': [
            "في وقت الغضب، الانسحاب التكتيكي (الهدنة) أفضل من الاستمرار في جدال عقيم. لكن عد للحديث لاحقاً.",
            "تذكر أنك لست في معركة يجب أن تنتصر فيها. الهدف هو حل المشكلة وليس هزيمة الشريك.",
            "الاعتذار عند الخطأ من شيم الكبار. لا تدع الكبرياء يمنعك من قول 'آسف'.",
            "لا تعايرها بأخطاء الماضي أو بنقاط ضعفها وقت الزعل. خليك نبيل في خصومتك.",
            "ركز على المشكلة الحالية ولا تفتح ملفات قديمة.",
            "استخدم عبارة 'أنا أشعر' بدل 'أنتِ سويتي'. اللوم المباشر يخلي الطرف الثاني يدافع عن نفسه بس.",
            "إذا شفت النقاش وصل لطريق مسدود، اقترح تأجيله لوقت أروق.",
            "لا تفجر في الخصومة ولا ترفع صوتك. الهدوء هو علامة القوة الحقيقية.",
            "احترم اختلاف وجهات النظر. مو لازم تقنعها برأيك، المهم تحترمون آراء بعض.",
            "إذا اعتذرت، اقبل اعتذارها وتجاوز الموضوع بقلب سليم."
        ],
        'appreciation': [
            "لاحظ التفاصيل الصغيرة التي تقوم بها (ترتيب البيت، الاهتمام بنفسها) وامدحها عليها.",
            "الشكر والتقدير هو الوقود الذي يجعلها تستمر بالعطاء بحب. قل لها شكراً بصدق.",
            "أشعرها بأن وجودها في حياتك نعمة كبيرة تشكر الله عليها يومياً.",
            "امدح طبخها وذوقها في الأكل. 'تسلم يدك' لها مفعول سحري.",
            "اشكرها أمام الأهل والأصدقاء (باللي يناسب). الفخر بها علناً يرفع مكانتها.",
            "قدر تعبها مع الأولاد أو في شغل البيت، ولا تعتبره واجب مسلم به.",
            "ادعم طموحها وشغلها أو دراستها. كن أنت السند والداعم الأول.",
            "اسألها 'كيف أقدر أساعدك اليوم؟'. مجرد السؤال يخفف عنها عبء كبير.",
            "لا تبخس حقها في قرارات البيت. شاورها وخذ برأيها.",
            "كن ممتناً لوجودها الصابر والداعم في الأوقات الصعبة."
        ]
    },
    'SHE': {
        'communication': [
            "الرجال أحياناً يحتاجون إلى الصمت لترتيب أفكارهم. (كهف الرجل). لا تفسري صمته دائماً على أنه تجاهل.",
            "كوني واضحة ومباشرة في طلباتك. التلميحات قد لا تصل دائماً كما تريدين.",
            "اختاري الوقت المناسب للحديث عن المشاكل. تجنبي الأوقات التي يكون فيها مرهقاً أو جائعاً.",
            "الرجل يحب اللي يقدر تفكيره ويحترمه. لا تسفهين آراءه حتى لو اختلفتي معه.",
            "اختصري في الكلام إذا شفتيه مشغول أو مو رايق. ادخلي في الموضوع مباشرة.",
            "لا تقارنيه بأي رجل ثاني أبدًا. المقارنة تقتل الثقة والمودة.",
            "استخدمي أسلوب الدلع والأنوثة في الطلب، غالباً ما يقدر يرفض لك طلب.",
            "كوني مستمعة جيدة له لما يتكلم عن شغله أو هواياته، حتى لو ما كانت تهمك.",
            "لا تشتكينه لأهلك أو أهله إلا في الشديد القوي. أسرار البيوت أمانة.",
            "ابتسامتك في وجهه لما يرجع البيت هي أحلى ترحيب ولغة تواصل صامتة."
        ],
        'romance': [
            "اهتمامك بنفسك وبأنوثتك هو جزء من رسالة حب ترسلينها له.",
            "الرجل يحب أن يشعر بأنه مرغوب أيضاً. بادري بكلمة حلوة أو لمسة حانية.",
            "امدحي رجولته ومواقفه. هذا يعزز ثقته بنفسه ويزيد من حبه لك.",
            "كوني مرحة وفرفوشة. الرجل يهرب من النكد ويعشق اللي تضحكه وتبسطه.",
            "غيري في شكلك ولبسك بين فترة وثانية. التجديد يكسر الملل.",
            "ارسلي له رسالة حب أو دعاء وهو في الشغل. حسسيه أنك تفكرين فيه.",
            "استقبليه بحفاوة واهتمام، وودعيه بحب ودعوات.",
            "اطبخي له الأكلة اللي يحبها. الطريق إلى قلب الرجل يمر بمعدته أحياناً.",
            "حاولي تشاركينه بعض هواياته، مثلاً تفرجي معه مباراة أو العبي معه.",
            "خففي من الانتقاد واللوم، وزيدي من المدح والغزل."
        ],
        'conflict': [
            "الصوت العالي لا يثبت وجهة نظرك، بل قد ينهي النقاش قبل أن يبدأ. حافظي على هدوئك.",
            "تجنبي استخدام كلمات التعميم مثل 'أنت دائماً' أو 'أنت عمرك ما...'. ركزي على الموقف الحالي.",
            "التقدير والاحترام وقت الخلاف أهم من الحب وقت الرضا.",
            "اذا اشتد النقاش، انسحبي بهدوء وقلي له 'نتكلم بعدين لما نروق'.",
            "لا تستخدمين العلاقة الخاصة كسلاح أو عقاب وقت الزعل.",
            "لا تدخلين الأولاد طرف في مشاكلكم.",
            "كوني ذكية ومرنة، مو لازم كل معركة تفوزين فيها. التغافل تسعة أعشار العافية.",
            "لا تنبشين الماضي. اللي فات مات، ركزي في الحاضر.",
            "اعتذري لو غلطتي. الاعتذار دلالة قوة وثقة بالنفس.",
            "اختاري معاركك. مو كل شي يستاهل توقفين عنده وتكبرين الموضوع."
        ],
        'appreciation': [
            "الرجل يحتاج للتقدير كما تحتاجين للحب. قدري تعبه في العمل وسعيه لراحة الأسرة.",
            "امدحي إنجازاته مهما كانت صغيرة. هذا يجعله يشعر بأنه بطلك.",
            "ثقتك به واعتمادك عليه (بحدود المعقول) يشعره بأهميته ومكانته عندك.",
            "اشكريه لما يصلح شي في البيت أو يجيب أغراض. لا تعتبرينه واجب.",
            "افتخري فيه قدام أهلك وأهله. هذا الشيء يرفعك في عينه.",
            "ادعي له بالرزق والتوفيق. دعواتك له تفتح له أبواب الخير.",
            "حسسيه أنه هو الأمان والسند لك وللأولاد.",
            "لا تقللين من قيمة هديته مهما كانت بسيطة. الفرحة بالهدية أهم من قيمتها.",
            "قدريه لما يتنازل أو يضحي عشانكم.",
            "قولي له 'الله لا يحرمني منك'. كلمة بسيطة بس مفعولها عظيم."
        ]
    }
};

export default function MarriageAdviceModal({ isOpen, onClose }: MarriageAdviceModalProps) {
    const [step, setStep] = useState<'gender' | 'topic' | 'result'>('gender');
    const [gender, setGender] = useState<'HE' | 'SHE' | null>(null);
    const [topic, setTopic] = useState<string | null>(null);
    const [advice, setAdvice] = useState<string>("");

    if (!isOpen) return null;

    const handleGenderSelect = (g: 'HE' | 'SHE') => {
        setGender(g);
        setStep('topic');
    };

    const handleTopicSelect = (t: string) => {
        setTopic(t);
        // Get random advice
        if (gender) {
            const list = ADVICE_DB[gender][t];
            const random = list[Math.floor(Math.random() * list.length)];
            setAdvice(random);
            setStep('result');
        }
    };

    const reset = () => {
        setStep('gender');
        setGender(null);
        setTopic(null);
        setAdvice("");
    };

    const handleNextAdvice = () => {
        if (gender && topic) {
            const list = ADVICE_DB[gender][topic];
            // Filter out current advice to ensure a new one if possible
            const available = list.filter(a => a !== advice);
            const nextList = available.length > 0 ? available : list;
            const random = nextList[Math.floor(Math.random() * nextList.length)];
            setAdvice(random);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Close Button */}
                    <button onClick={handleClose} className="absolute top-4 left-4 p-2 bg-surface-800/50 rounded-full text-surface-400 hover:text-white z-10">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-8 min-h-[400px] flex flex-col items-center justify-center text-center">

                        {/* STEP 1: GENDER */}
                        {step === 'gender' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full space-y-8">
                                <h2 className="text-2xl font-bold text-white">لمن النصيحة؟</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleGenderSelect('HE')} className="p-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-blue-300">له (الزوج)</span>
                                    </button>
                                    <button onClick={() => handleGenderSelect('SHE')} className="p-6 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                                        <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-rose-300">لها (الزوجة)</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: TOPIC */}
                        {step === 'topic' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full space-y-6">
                                <h2 className="text-2xl font-bold text-white">عن أي جانب؟</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    {TOPICS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleTopicSelect(t.id)}
                                            className="w-full p-4 bg-surface-800 hover:bg-surface-700 rounded-xl flex items-center gap-4 transition-colors group"
                                        >
                                            <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white`}>
                                                <t.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-surface-200 text-lg">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setStep('gender')} className="text-sm text-surface-500 hover:text-surface-300 mt-4">
                                    العودة للخلف
                                </button>
                            </motion.div>
                        )}

                        {/* STEP 3: RESULT */}
                        {step === 'result' && (
                            <motion.div key={advice} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-amber-400">نصيحة ذهبية</h3>
                                    <div className="p-6 bg-surface-800/50 rounded-2xl border border-white/5 relative">
                                        <p className="text-xl text-white leading-relaxed font-serif">
                                            "{advice}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={handleClose} className="flex-1 py-3 bg-surface-700 hover:bg-surface-600 rounded-xl font-bold text-white transition-colors">
                                        إغلاق
                                    </button>
                                    <button onClick={handleNextAdvice} className="flex-1 py-3 bg-primary-600 hover:bg-primary-500 rounded-xl font-bold text-white transition-colors">
                                        نصيحة أخرى
                                    </button>
                                </div>
                                <button onClick={reset} className="text-sm text-surface-500 hover:text-surface-300">
                                    البدء من جديد
                                </button>
                            </motion.div>
                        )}

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
