'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, AlertCircle, CheckCircle, XCircle, Heart } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

export default function TermsOfServicePage() {
    const { theme } = useSettingsStore();

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings/privacy" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                        <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>شروط الاستخدام</h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${theme === 'light' ? 'bg-accent-100' : 'bg-accent-500/20'}`}>
                            <FileText className={`w-10 h-10 ${theme === 'light' ? 'text-accent-600' : 'text-accent-400'}`} />
                        </div>
                        <h2 className={`text-3xl font-bold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>شروط استخدام تطبيق وصال</h2>
                        <p className={`text-lg ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                            مرحباً بك في وصال - مساحتك الآمنة لتعزيز العلاقة الزوجية
                        </p>
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>آخر تحديث: ديسمبر 2024</p>
                    </div>

                    {/* Quick Agreement Notice */}
                    <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/10 border-primary-500/20'}`}>
                        <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>
                            <AlertCircle className="w-5 h-5" />
                            موافقتك
                        </h3>
                        <p className={theme === 'light' ? 'text-slate-600' : 'text-surface-200'}>
                            باستخدامك لتطبيق <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>وصال</strong>، فإنك توافق على هذه الشروط.
                            يرجى قراءتها بعناية. إذا كنت لا توافق، يُرجى عدم استخدام التطبيق.
                        </p>
                    </div>

                    {/* Section 1: Eligibility */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>1. الأهلية</h3>

                        <div className={`space-y-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'light' ? 'text-emerald-500' : 'text-emerald-400'}`} />
                                <div>
                                    <p className={`font-bold mb-1 ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'}`}>يجب أن تكون:</p>
                                    <ul className={`list-disc list-inside space-y-1 mr-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                        <li>عمرك <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>18 عاماً أو أكثر</strong></li>
                                        <li>متزوج/ـة أو مخطوب/ـة</li>
                                        <li>مقيم/ـة في المملكة العربية السعودية</li>
                                        <li>قادر/ـة قانونياً على الدخول في عقود ملزمة</li>
                                    </ul>
                                </div>
                            </div>

                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
                                <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'light' ? 'text-red-500' : 'text-red-400'}`} />
                                <div>
                                    <p className={`font-bold mb-1 ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>غير مسموح للقُصَّر:</p>
                                    <p className={theme === 'light' ? 'text-slate-600' : 'text-surface-300'}>
                                        لا يُسمح لمن هم دون 18 عاماً باستخدام التطبيق. نحتفظ بالحق في طلب إثبات العمر.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Account Responsibilities */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>2. مسؤوليات الحساب</h3>

                        <ul className={`space-y-3 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>دقة المعلومات:</strong> يجب تقديم معلومات صحيحة عند التسجيل</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>سرية كلمة المرور:</strong> أنت مسؤول عن حماية كلمة مرورك</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>حساب واحد فقط:</strong> لكل شخص حساب واحد فقط</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>الإبلاغ عن الاختراق:</strong> أخبرنا فوراً إذا شككت في اختراق حسابك</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>المسؤولية:</strong> أنت مسؤول عن جميع الأنشطة تحت حسابك</span>
                            </li>
                        </ul>

                        <div className={`mt-6 p-4 rounded-xl border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <p className={`text-sm ${theme === 'light' ? 'text-amber-700' : 'text-amber-200'}`}>
                                <strong>تنبيه:</strong> مشاركة حسابك مع أشخاص آخرين غير شريكك محظورة وقد تؤدي لإيقاف الحساب.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Acceptable Use */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>3. الاستخدام المقبول</h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className={`font-bold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-300'}`}>
                                    <CheckCircle className="w-5 h-5" />
                                    مسموح:
                                </h4>
                                <ul className={`space-y-2 mr-6 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">✓</span>
                                        <span>استخدام التطبيق لتحسين علاقتك الزوجية</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">✓</span>
                                        <span>الربط مع شريك حياتك الشرعي</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500">✓</span>
                                        <span>مشاركة ملاحظات ومقترحات لتحسين التطبيق</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-3 flex items-center gap-2 ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}>
                                    <XCircle className="w-5 h-5" />
                                    محظور:
                                </h4>
                                <ul className={`space-y-2 mr-6 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>استخدام التطبيق لأغراض غير شرعية أو غير أخلاقية</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>محاولة اختراق أو إساءة استخدام النظام</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>انتحال شخصية الآخرين أو تقديم معلومات مزيفة</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>بيع أو نقل حسابك لشخص آخر</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>استخدام أدوات آلية (bots) أو برامج ضارة</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-500">✗</span>
                                        <span>نسخ أو إعادة إنتاج محتوى التطبيق دون إذن</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Content and IP */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>4. المحتوى والملكية الفكرية</h3>

                        <div className={`space-y-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>محتوى التطبيق:</h4>
                                <p>
                                    جميع المحتويات (الألعاب، الرحلات، النصوص، التصاميم) هي ملك حصري لـ <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>وصال</strong>
                                    ومحمية بموجب قوانين حقوق النشر السعودية والدولية.
                                </p>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>محتواك الشخصي:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>تحتفظ بملكية بياناتك الشخصية</li>
                                    <li>تمنحنا ترخيصاً لاستخدام بياناتك لتحسين الخدمة (بشكل مجهول)</li>
                                    <li>يمكنك حذف بياناتك في أي وقت</li>
                                </ul>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                <p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-200'}`}>
                                    <strong>AI المستخدم:</strong> نستخدم تقنيات الذكاء الاصطناعي (DeepSeek) لتقديم نصائح شخصية.
                                    جميع الاستشارات مجهولة الهوية ولا ترتبط بهويتك الحقيقية.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Premium Subscription */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>5. الاشتراك المدفوع</h3>

                        <div className={`space-y-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>الأسعار والفواتير:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>الأسعار بالريال السعودي (SAR) وشاملة ضريبة القيمة المضافة</li>
                                    <li>الدفع عبر Moyasar (بوابة دفع سعودية معتمدة)</li>
                                    <li>التجديد التلقائي ما لم تلغِ قبل نهاية الفترة</li>
                                    <li>لا استرداد للمبالغ بعد بدء الاشتراك</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>الإلغاء:</h4>
                                <p>
                                    يمكنك إلغاء اشتراكك في أي وقت من الإعدادات. سيستمر الاشتراك حتى نهاية الفترة المدفوعة.
                                </p>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>فترة السماح:</h4>
                                <p>
                                    نوفر فترة سماح <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>3 أيام</strong> بعد فشل الدفع قبل إيقاف الميزات المميزة.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Disclaimers */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>6. إخلاء المسؤولية</h3>

                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>النصائح والمشورة:</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-amber-600' : 'text-amber-200'}`}>
                                    المشورة المقدمة عبر التطبيق <strong>ليست بديلاً</strong> عن الاستشارة المهنية من مختص أسري أو نفسي.
                                    في حالات الأزمات الخطيرة، يُرجى طلب المساعدة المتخصصة.
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}>عدم الضمان:</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-200'}`}>
                                    نقدم التطبيق "كما هو" دون أي ضمانات صريحة أو ضمنية. لا نضمن نتائج معينة من استخدام التطبيق.
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>تحديد المسؤولية:</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-200'}`}>
                                    لن نكون مسؤولين عن أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام التطبيق.
                                    مسؤوليتنا الإجمالية محدودة بالمبلغ المدفوع للاشتراك.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 7: Termination */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>7. إنهاء الخدمة</h3>

                        <div className={`space-y-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>حقك في الإنهاء:</h4>
                                <p>يمكنك حذف حسابك في أي وقت من: الإعدادات → حذف الحساب</p>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>حقنا في الإنهاء:</h4>
                                <p className="mb-2">يحق لنا إيقاف أو حذف حسابك إذا:</p>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>انتهكت هذه الشروط</li>
                                    <li>استخدمت التطبيق بشكل غير قانوني</li>
                                    <li>أضررت بالتطبيق أو مستخدمين آخرين</li>
                                    <li>قدمت معلومات مزيفة عند التسجيل</li>
                                </ul>
                            </div>

                            <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-800/50'}`}>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                    <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>ملاحظة:</strong> في حالة الإيقاف لانتهاك الشروط، لن يتم استرداد المبالغ المدفوعة.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 8: Governing Law */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>8. القانون الحاكم</h3>

                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            تخضع هذه الشروط وتفسر وفقاً لـ <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>قوانين المملكة العربية السعودية</strong>.
                        </p>

                        <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-surface-800/50 border-surface-700'}`}>
                            <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>حل النزاعات:</h4>
                            <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                                في حالة نشوء أي نزاع، نشجع التواصل معنا أولاً لحله ودياً.
                                إذا لم يتم التوصل لحل، يتم الاحتكام للجهات القضائية المختصة في المملكة.
                            </p>
                        </div>
                    </section>

                    {/* Section 9: Changes to Terms */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>9. التعديلات على الشروط</h3>

                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. التعديلات الجوهرية سنخطرك بها عبر:
                        </p>

                        <ul className={`space-y-2 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">→</span>
                                <span>إشعار داخل التطبيق</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500">→</span>
                                <span>رسالة على البريد الإلكتروني</span>
                            </li>
                        </ul>

                        <p className={`mt-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            استمرارك في استخدام التطبيق بعد التعديلات يعني موافقتك عليها.
                        </p>
                    </section>

                    {/* Contact Section */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                            <Heart className={`w-6 h-6 ${theme === 'light' ? 'text-pink-500' : 'text-primary-400'}`} />
                            تواصل معنا
                        </h3>
                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            لأي استفسارات حول هذه الشروط:
                        </p>
                        <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-800/50'}`}>
                            <p className={theme === 'light' ? 'text-slate-600' : 'text-surface-300'}><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>البريد الإلكتروني:</strong> support@wesal.sa</p>
                            <p className={`mt-2 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>الرد خلال:</strong> 48 ساعة عمل</p>
                        </div>
                    </section>

                    {/* Final Note */}
                    <div className={`p-6 rounded-2xl text-center border ${theme === 'light' ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200' : 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border-primary-500/30'}`}>
                        <Heart className={`w-8 h-8 mx-auto mb-3 ${theme === 'light' ? 'text-pink-500' : 'text-primary-400'}`} />
                        <p className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>شكراً لثقتك في وصال</p>
                        <p className={`text-sm ${theme === 'light' ? 'text-slate-500' : 'text-surface-300'}`}>نسعد بأن نكون جزءاً من رحلتكما في بناء علاقة زوجية أقوى وأسعد</p>
                    </div>

                    {/* Back Button */}
                    <div className="pt-8">
                        <Link
                            href="/settings/privacy"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors"
                        >
                            <ArrowRight className="w-5 h-5" />
                            العودة للإعدادات
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
