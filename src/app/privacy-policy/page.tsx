'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Clock, Trash2, Eye, Lock, FileText } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

export default function PrivacyPolicyPage() {
    const { theme } = useSettingsStore();

    return (
        <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-surface-900/80 border-white/5'}`}>
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings/privacy" className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}>
                        <ArrowRight className={`w-6 h-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
                    </Link>
                    <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>سياسة الخصوصية</h1>
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
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${theme === 'light' ? 'bg-primary-100' : 'bg-primary-500/20'}`}>
                            <Shield className={`w-10 h-10 ${theme === 'light' ? 'text-primary-600' : 'text-primary-400'}`} />
                        </div>
                        <h2 className={`text-3xl font-bold mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>خصوصيتك أولويتنا</h2>
                        <p className={`text-lg ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>
                            ملتزمون بحماية بياناتك وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية
                        </p>
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-slate-500' : 'text-surface-500'}`}>آخر تحديث: ديسمبر 2024</p>
                    </div>

                    {/* Quick Summary */}
                    <div className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/10 border-primary-500/20'}`}>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>
                            <FileText className="w-5 h-5" />
                            ملخص سريع
                        </h3>
                        <ul className={`space-y-3 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-3">
                                <Clock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${theme === 'light' ? 'text-pink-500' : 'text-primary-400'}`} />
                                <span>حذف تلقائي للبيانات الحساسة بعد <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>7 أيام</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Lock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>لا نحفظ</strong> محادثات حل النزاعات أبداً</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Eye className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>بياناتك مشفرة ومحفوظة في <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>السعودية</strong></span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 1: Data Collection */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>1. البيانات التي نجمعها</h3>

                        <div className={`space-y-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>بيانات الحساب:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>الاسم الكامل</li>
                                    <li>البريد الإلكتروني أو رقم الهاتف</li>
                                    <li>تاريخ الميلاد (للتأكد من السن +18)</li>
                                    <li>الجنس</li>
                                    <li>كلمة المرور (مشفرة باستخدام Argon2)</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>بيانات الاستخدام:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>التفاعل مع الألعاب والرحلات (تقدم فقط، لا محتوى)</li>
                                    <li>فحوصات الحالة المزاجية اليومية (تحذف بعد 7 أيام)</li>
                                    <li>الإنجازات المحققة</li>
                                    <li>إحصائيات الاستخدام العامة</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>بيانات لا نجمعها أبداً:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4 text-emerald-500">
                                    <li>محتوى محادثات حل النزاعات</li>
                                    <li>رسائل خاصة بينك وبين شريكك</li>
                                    <li>تفاصيل حميمية من الألعاب</li>
                                    <li>بيانات الموقع الجغرافي</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Data Usage */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>2. كيف نستخدم بياناتك</h3>
                        <ul className={`space-y-3 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span>تقديم خدمات التطبيق (الألعاب، الرحلات، المشورة)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span>تحسين التجربة عبر توصيات AI مخصصة</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span>إرسال إشعارات مهمة (موافقة الشريك، تذكيرات)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span>الحفاظ على أمان الحساب</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-500 font-bold">•</span>
                                <span>الامتثال للمتطلبات القانونية</span>
                            </li>
                        </ul>

                        <div className={`mt-6 p-4 rounded-xl border ${theme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <p className={`text-sm ${theme === 'light' ? 'text-amber-700' : 'text-amber-200'}`}>
                                <strong>ملاحظة:</strong> لن نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية أبداً.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Data Retention */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>3. مدة الاحتفاظ بالبيانات</h3>

                        <div className="space-y-4">
                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-surface-800/50 border-surface-700'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>فحوصات الحالة المزاجية</h4>
                                </div>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>تحذف تلقائياً بعد <strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>7 أيام</strong> من التسجيل</p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-surface-800/50 border-surface-700'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <Trash2 className="w-5 h-5 text-emerald-400" />
                                    <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>جلسات حل النزاعات</h4>
                                </div>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>المحتوى <strong className="text-emerald-500">غير محفوظ</strong> - يحذف فوراً بعد انتهاء الجلسة</p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-surface-800/50 border-surface-700'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    <h4 className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>بيانات الحساب والتقدم</h4>
                                </div>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>تبقى حتى تحذف حسابك أو تطلب الحذف</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: PDPL Compliance */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>4. الامتثال لنظام حماية البيانات الشخصية (PDPL)</h3>

                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            نلتزم التزاماً كاملاً بنظام حماية البيانات الشخصية في المملكة العربية السعودية:
                        </p>

                        <ul className={`space-y-3 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>إقامة البيانات:</strong> جميع بياناتك محفوظة في خوادم داخل المملكة</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>التشفير:</strong> بيانات حساسة مشفرة بمعايير عالمية (AES-256)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>الموافقة الصريحة:</strong> نطلب موافقتك قبل جمع أي بيانات</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>حق الحذف:</strong> يمكنك حذف حسابك وبياناتك في أي وقت</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">✓</span>
                                <span><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>الشفافية:</strong> نخبرك بوضوح ما نجمعه ولماذا</span>
                            </li>
                        </ul>
                    </section>

                    {/* Section 5: Your Rights */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>5. حقوقك</h3>

                        <div className="grid gap-4">
                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/5 border-primary-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>حق الوصول</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>يمكنك طلب نسخة من بياناتك في أي وقت</p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/5 border-primary-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>حق التصحيح</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>تعديل بياناتك الشخصية عبر الإعدادات</p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/5 border-primary-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>حق الحذف</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>حذف حسابك نهائياً من: الإعدادات → حذف الحساب</p>
                            </div>

                            <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-pink-50 border-pink-200' : 'bg-primary-500/5 border-primary-500/20'}`}>
                                <h4 className={`font-bold mb-2 ${theme === 'light' ? 'text-pink-700' : 'text-primary-300'}`}>حق الاعتراض</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}>رفض معالجة بياناتك لأغراض معينة</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Security */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>6. الأمان</h3>

                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            نستخدم تدابير أمنية صارمة لحماية بياناتك:
                        </p>

                        <ul className={`space-y-2 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">→</span>
                                <span>تشفير جميع الاتصالات (HTTPS/TLS)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">→</span>
                                <span>كلمات مرور مشفرة بخوارزمية Argon2 (غير قابلة للفك)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">→</span>
                                <span>رموز JWT محدودة المدة لمنع الاختراق</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">→</span>
                                <span>مراقبة نشاط غير عادي وإشعارات أمنية</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-500">→</span>
                                <span>نسخ احتياطية يومية مشفرة</span>
                            </li>
                        </ul>
                    </section>

                    {/* Contact Section */}
                    <section className={`p-6 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'glass-card'}`}>
                        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>تواصل معنا</h3>
                        <p className={`mb-4 ${theme === 'light' ? 'text-slate-600' : 'text-surface-200'}`}>
                            لأي استفسارات تتعلق بالخصوصية أو لممارسة حقوقك:
                        </p>
                        <div className={`p-4 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-surface-800/50'}`}>
                            <p className={theme === 'light' ? 'text-slate-600' : 'text-surface-300'}><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>البريد الإلكتروني:</strong> privacy@wesal.sa</p>
                            <p className={`mt-2 ${theme === 'light' ? 'text-slate-600' : 'text-surface-300'}`}><strong className={theme === 'light' ? 'text-slate-800' : 'text-white'}>الرد خلال:</strong> 48 ساعة عمل</p>
                        </div>
                    </section>

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
