// Error Monitoring for Wesal
// Works with or without Sentry - graceful fallback to console logging
// To enable Sentry, add NEXT_PUBLIC_SENTRY_DSN to your environment and install @sentry/nextjs

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Track if Sentry is initialized
let sentryLoaded = false;
let Sentry: any = null;

// Initialize error monitoring
export async function initErrorMonitoring() {
    if (SENTRY_DSN && !sentryLoaded) {
        try {
            // Dynamic import to avoid build errors if not installed
            Sentry = await import('@sentry/nextjs').catch(() => null);

            if (Sentry) {
                Sentry.init({
                    dsn: SENTRY_DSN,
                    tracesSampleRate: 0.1,
                    environment: process.env.NODE_ENV,
                    beforeSend(event: any) {
                        if (process.env.NODE_ENV === 'development') {
                            return null;
                        }
                        return event;
                    },
                    ignoreErrors: [
                        'ResizeObserver loop limit exceeded',
                        'ResizeObserver loop completed with undelivered notifications',
                        /Loading chunk \d+ failed/,
                    ],
                });
                sentryLoaded = true;
                console.log('✅ Sentry error monitoring initialized');
            }
        } catch (e) {
            console.log('ℹ️ Sentry not available, using console logging');
        }
    }
}

// Capture an exception
export function captureError(error: Error, context?: Record<string, any>) {
    console.error('Error captured:', error);
    console.error('Context:', context);

    if (Sentry && sentryLoaded) {
        Sentry.captureException(error, { extra: context });
    }

    // Also log to our own analytics API (fire and forget)
    fetch('/api/errors/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'server',
        }),
    }).catch(() => { });
}

// Set user for error tracking
export function setErrorUser(userId: string, email?: string) {
    if (Sentry && sentryLoaded) {
        Sentry.setUser({ id: userId, email });
    }
}

// Clear user on logout
export function clearErrorUser() {
    if (Sentry && sentryLoaded) {
        Sentry.setUser(null);
    }
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (Sentry && sentryLoaded) {
        Sentry.addBreadcrumb({ message, category, data, level: 'info' });
    }
}

// Simple error logging API endpoint handler
export function createErrorLogHandler() {
    return async (req: Request) => {
        // Just log to console in development
        // In production, you could store these in a database
        const body = await req.json();
        console.error('[Error Log]', body);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    };
}
