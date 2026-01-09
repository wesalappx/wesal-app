/**
 * Logger utility - only logs in development mode
 * Replaces console.log/error/warn throughout the app
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    error: (...args: unknown[]) => {
        if (isDev) {
            console.error(...args);
        }
        // In production, you could send to Sentry or other error tracking
        // Example: Sentry.captureMessage(args.join(' '));
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },
};

export default logger;
