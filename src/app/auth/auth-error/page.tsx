'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4 font-sans">
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
            </div>

            <div className="glass-card p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">حدث خطأ في المصادقة</h1>
                <p className="text-surface-400 mb-6">
                    انتهت صلاحية الرابط أو حدث خطأ أثناء التحقق من حسابك.
                    يرجى المحاولة مرة أخرى.
                </p>
                <div className="flex flex-col gap-3">
                    <Link href="/auth/login" className="btn-primary">
                        تسجيل الدخول
                    </Link>
                    <Link href="/auth/register" className="btn-secondary">
                        إنشاء حساب جديد
                    </Link>
                </div>
            </div>
        </main>
    );
}
