'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Clock, Trash2, Eye, Lock, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-900/80 border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/settings/privacy" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowRight className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">سياسة الخصوصية</h1>
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
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-primary-500/20 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-primary-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">خصوصيتك أولويتنا</h2>
                        <p className="text-surface-300 text-lg">
                            ملتزمون بحماية بياناتك وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية
                        </p>
                        <p className="text-surface-500 text-sm mt-2">آخر تحديث: ديسمبر 2024</p>
                    </div>

                    {/* Quick Summary */}
                    <div className="p-6 rounded-2xl bg-primary-500/10 border border-primary-500/20">
                        <h3 className="text-lg font-bold text-primary-300 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            ملخص سريع
                        </h3>
                        <ul className="space-y-3 text-surface-200">
                            <li className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                                <span>حذف تلقائي للبيانات الحساسة بعد <strong className="text-white">7 أيام</strong></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Lock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span><strong className="text-white">لا نحفظ</strong> محادثات حل النزاعات أبداً</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Eye className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                <span>بياناتك مشفرة ومحفوظة في <strong className="text-white">السعودية</strong></span>
                            </li>
                        </ul>
                    </div>

                    {/* Section 1: Data Collection */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">1. البيانات التي نجمعها</h3>

                        <div className="space-y-4 text-surface-200">
                            <div>
                                <h4 className="font-bold text-white mb-2">بيانات الحساب:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>الاسم الكامل</li>
                                    <li>البريد الإلكتروني أو رقم الهاتف</li>
                                    <li>تاريخ الميلاد (للتأكد من السن +18)</li>
                                    <li>الجنس</li>
                                    <li>كلمة المرور (مشفرة باستخدام Argon2)</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-white mb-2">بيانات الاستخدام:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4">
                                    <li>التفاعل مع الألعاب والرحلات (تقدم فقط، لا محتوى)</li>
                                    <li>فحوصات الحالة المزاجية اليومية (تحذف بعد 7 أيام)</li>
                                    <li>الإنجازات المحققة</li>
                                    <li>إحصائيات الاستخدام العامة</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-white mb-2">بيانات لا نجمعها أبداً:</h4>
                                <ul className="list-disc list-inside space-y-1 mr-4 text-emerald-300">
                                    <li>محتوى محادثات حل النزاعات</li>
                                    <li>رسائل خاصة بينك وبين شريكك</li>
                                    <li>تفاصيل حميمية من الألعاب</li>
                                    <li>بيانات الموقع الجغرافي</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Data Usage */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">2. كيف نستخدم بياناتك</h3>
                        <ul className="space-y-3 text-surface-200">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">•</span>
                                <span>تقديم خدمات التطبيق (الألعاب، الرحلات، المشورة)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">•</span>
                                <span>تحسين التجربة عبر توصيات AI مخصصة</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">•</span>
                                <span>إرسال إشعارات مهمة (موافقة الشريك، تذكيرات)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">•</span>
                                <span>الحفاظ على أمان الحساب</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">•</span>
                                <span>الامتثال للمتطلبات القانونية</span>
                            </li>
                        </ul>

                        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-amber-200 text-sm">
                                <strong>ملاحظة:</strong> لن نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض تسويقية أبداً.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Data Retention */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">3. مدة الاحتفاظ بالبيانات</h3>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    <h4 className="font-bold text-white">فحوصات الحالة المزاجية</h4>
                                </div>
                                <p className="text-surface-300 text-sm">تحذف تلقائياً بعد <strong className="text-white">7 أيام</strong> من التسجيل</p>
                            </div>

                            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trash2 className="w-5 h-5 text-emerald-400" />
                                    <h4 className="font-bold text-white">جلسات حل النزاعات</h4>
                                </div>
                                <p className="text-surface-300 text-sm">المحتوى <strong className="text-emerald-300">غير محفوظ</strong> - يحذف فوراً بعد انتهاء الجلسة</p>
                            </div>

                            <div className="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    <h4 className="font-bold text-white">بيانات الحساب والتقدم</h4>
                                </div>
                                <p className="text-surface-300 text-sm">تبقى حتى تحذف حسابك أو تطلب الحذف</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: PDPL Compliance */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">4. الامتثال لنظام حماية البيانات الشخصية (PDPL)</h3>

                        <p className="text-surface-200 mb-4">
                            نلتزم التزاماً كاملاً بنظام حماية البيانات الشخصية في المملكة العربية السعودية:
                        </p>

                        <ul className="space-y-3 text-surface-200">
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">✓</span>
                                <span><strong className="text-white">إقامة البيانات:</strong> جميع بياناتك محفوظة في خوادم داخل المملكة</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">✓</span>
                                <span><strong className="text-white">التشفير:</strong> بيانات حساسة مشفرة بمعايير عالمية (AES-256)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">✓</span>
                                <span><strong className="text-white">الموافقة الصريحة:</strong> نطلب موافقتك قبل جمع أي بيانات</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">✓</span>
                                <span><strong className="text-white">حق الحذف:</strong> يمكنك حذف حسابك وبياناتك في أي وقت</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary-400 font-bold">✓</span>
                                <span><strong className="text-white">الشفافية:</strong> نخبرك بوضوح ما نجمعه ولماذا</span>
                            </li>
                        </ul>
                    </section>

                    {/* Section 5: Your Rights */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">5. حقوقك</h3>

                        <div className="grid gap-4">
                            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
                                <h4 className="font-bold text-primary-300 mb-2">حق الوصول</h4>
                                <p className="text-surface-300 text-sm">يمكنك طلب نسخة من بياناتك في أي وقت</p>
                            </div>

                            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
                                <h4 className="font-bold text-primary-300 mb-2">حق التصحيح</h4>
                                <p className="text-surface-300 text-sm">تعديل بياناتك الشخصية عبر الإعدادات</p>
                            </div>

                            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
                                <h4 className="font-bold text-primary-300 mb-2">حق الحذف</h4>
                                <p className="text-surface-300 text-sm">حذف حسابك نهائياً من: الإعدادات → حذف الحساب</p>
                            </div>

                            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/20">
                                <h4 className="font-bold text-primary-300 mb-2">حق الاعتراض</h4>
                                <p className="text-surface-300 text-sm">رفض معالجة بياناتك لأغراض معينة</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 6: Security */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">6. الأمان</h3>

                        <p className="text-surface-200 mb-4">
                            نستخدم تدابير أمنية صارمة لحماية بياناتك:
                        </p>

                        <ul className="space-y-2 text-surface-200">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400">→</span>
                                <span>تشفير جميع الاتصالات (HTTPS/TLS)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400">→</span>
                                <span>كلمات مرور مشفرة بخوارزمية Argon2 (غير قابلة للفك)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400">→</span>
                                <span>رموز JWT محدودة المدة لمنع الاختراق</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400">→</span>
                                <span>مراقبة نشاط غير عادي وإشعارات أمنية</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400">→</span>
                                <span>نسخ احتياطية يومية مشفرة</span>
                            </li>
                        </ul>
                    </section>

                    {/* Contact Section */}
                    <section className="glass-card p-6">
                        <h3 className="text-2xl font-bold text-white mb-4">تواصل معنا</h3>
                        <p className="text-surface-200 mb-4">
                            لأي استفسارات تتعلق بالخصوصية أو لممارسة حقوقك:
                        </p>
                        <div className="p-4 rounded-xl bg-surface-800/50">
                            <p className="text-surface-300"><strong className="text-white">البريد الإلكتروني:</strong> privacy@wesal.sa</p>
                            <p className="text-surface-300 mt-2"><strong className="text-white">الرد خلال:</strong> 48 ساعة عمل</p>
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
