'use client';

import ErrorBoundary from '@/components/ErrorBoundary';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <div className="min-h-screen bg-gradient-to-b from-surface-900 via-surface-800 to-surface-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">حدث خطأ</h1>
                        <p className="text-gray-400 mb-8">نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</p>
                        <button
                            onClick={reset}
                            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium transition-colors"
                        >
                            حاول مرة أخرى
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
