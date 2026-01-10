'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

// ============================================
// Types
// ============================================

export type ActionType =
    | 'page_view'
    | 'click'
    | 'api_request'
    | 'api_response'
    | 'error'
    | 'form_submit'
    | 'auth'
    | 'subscription'
    | 'game'
    | 'admin';

export interface ActionLogPayload {
    actionType: ActionType;
    actionName: string;
    pagePath?: string;
    component?: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
    isError?: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorStack?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
}

interface DeviceInfo {
    browser: string;
    os: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
    timezone: string;
}

// ============================================
// Constants
// ============================================

const LOG_ENDPOINT = '/api/logs/track';
const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000;
const MAX_QUEUE_SIZE = 100;

// ============================================
// Utilities
// ============================================

function generateSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = sessionStorage.getItem('_log_session_id');
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('_log_session_id', sessionId);
    }
    return sessionId;
}

function getDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
        return {
            browser: 'unknown',
            os: 'unknown',
            screenWidth: 0,
            screenHeight: 0,
            language: 'unknown',
            timezone: 'unknown',
        };
    }

    const ua = navigator.userAgent;
    let browser = 'unknown';
    let os = 'unknown';

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return {
        browser,
        os,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
}

function sanitizeData(data: unknown, maxDepth = 3): unknown {
    if (maxDepth <= 0) return '[truncated]';
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    // Sanitize sensitive fields
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    if (Array.isArray(data)) {
        return data.slice(0, 10).map(item => sanitizeData(item, maxDepth - 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            sanitized[key] = '[REDACTED]';
        } else {
            sanitized[key] = sanitizeData(value, maxDepth - 1);
        }
    }
    return sanitized;
}

// ============================================
// Logger Class (Singleton)
// ============================================

class ActionLogger {
    private static instance: ActionLogger;
    private queue: ActionLogPayload[] = [];
    private flushTimeout: NodeJS.Timeout | null = null;
    private sessionId: string = '';
    private deviceInfo: DeviceInfo | null = null;
    private userId: string | null = null;
    private coupleId: string | null = null;
    private isEnabled: boolean = true;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.sessionId = generateSessionId();
            this.deviceInfo = getDeviceInfo();

            // Flush on page unload
            window.addEventListener('beforeunload', () => this.flush());

            // Flush periodically
            this.startPeriodicFlush();
        }
    }

    static getInstance(): ActionLogger {
        if (!ActionLogger.instance) {
            ActionLogger.instance = new ActionLogger();
        }
        return ActionLogger.instance;
    }

    setUserContext(userId: string | null, coupleId: string | null) {
        this.userId = userId;
        this.coupleId = coupleId;
    }

    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }

    log(payload: ActionLogPayload) {
        if (!this.isEnabled || typeof window === 'undefined') return;

        const enrichedPayload: ActionLogPayload = {
            ...payload,
            pagePath: payload.pagePath || window.location.pathname,
            requestData: payload.requestData ? sanitizeData(payload.requestData) as Record<string, unknown> : undefined,
            responseData: payload.responseData ? sanitizeData(payload.responseData) as Record<string, unknown> : undefined,
        };

        this.queue.push(enrichedPayload);

        // Prevent queue from growing too large
        if (this.queue.length > MAX_QUEUE_SIZE) {
            this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
        }

        // Flush immediately if we hit batch size
        if (this.queue.length >= BATCH_SIZE) {
            this.flush();
        }
    }

    private startPeriodicFlush() {
        if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
        }
        this.flushTimeout = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
    }

    async flush() {
        if (this.queue.length === 0) return;

        const logsToSend = [...this.queue];
        this.queue = [];

        try {
            await fetch(LOG_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    logs: logsToSend,
                    sessionId: this.sessionId,
                    userId: this.userId,
                    coupleId: this.coupleId,
                    deviceInfo: this.deviceInfo,
                }),
                // Use keepalive to ensure logs are sent even on page unload
                keepalive: true,
            });
        } catch {
            // Silently fail - don't affect user experience
            // Could implement retry logic here if needed
        }
    }
}

// ============================================
// React Hook
// ============================================

export function useActionLogger() {
    const { user } = useAuthStore();
    const loggerRef = useRef<ActionLogger | null>(null);
    const startTimeRef = useRef<number>(0);

    // Initialize logger
    useEffect(() => {
        loggerRef.current = ActionLogger.getInstance();
    }, []);

    // Update user context when user changes
    useEffect(() => {
        if (loggerRef.current && user) {
            // Try to get couple_id from localStorage or context
            const coupleId = localStorage.getItem('couple_id') || null;
            loggerRef.current.setUserContext(user.id, coupleId);
        }
    }, [user]);

    // Core logging function
    const logAction = useCallback((payload: ActionLogPayload) => {
        loggerRef.current?.log(payload);
    }, []);

    // Convenience: Log page view
    const logPageView = useCallback((pagePath?: string) => {
        logAction({
            actionType: 'page_view',
            actionName: 'page_load',
            pagePath: pagePath || (typeof window !== 'undefined' ? window.location.pathname : ''),
        });
    }, [logAction]);

    // Convenience: Log click
    const logClick = useCallback((
        component: string,
        actionName: string,
        metadata?: Record<string, unknown>
    ) => {
        logAction({
            actionType: 'click',
            actionName,
            component,
            metadata,
        });
    }, [logAction]);

    // Convenience: Log form submit
    const logFormSubmit = useCallback((
        formName: string,
        data?: Record<string, unknown>,
        isError = false,
        errorMessage?: string
    ) => {
        logAction({
            actionType: 'form_submit',
            actionName: formName,
            requestData: data,
            isError,
            errorMessage,
        });
    }, [logAction]);

    // Convenience: Log API request (start)
    const startApiRequest = useCallback((
        endpoint: string,
        method: string,
        data?: Record<string, unknown>
    ) => {
        startTimeRef.current = performance.now();
        logAction({
            actionType: 'api_request',
            actionName: `${method} ${endpoint}`,
            requestData: data,
        });
    }, [logAction]);

    // Convenience: Log API response (end)
    const endApiRequest = useCallback((
        endpoint: string,
        method: string,
        response?: Record<string, unknown>,
        isError = false,
        errorCode?: string,
        errorMessage?: string
    ) => {
        const durationMs = Math.round(performance.now() - startTimeRef.current);
        logAction({
            actionType: 'api_response',
            actionName: `${method} ${endpoint}`,
            responseData: response,
            durationMs,
            isError,
            errorCode,
            errorMessage,
        });
    }, [logAction]);

    // Convenience: Log error
    const logError = useCallback((
        errorMessage: string,
        error?: Error | unknown,
        component?: string,
        metadata?: Record<string, unknown>
    ) => {
        const errorObj = error instanceof Error ? error : null;
        logAction({
            actionType: 'error',
            actionName: 'client_error',
            component,
            isError: true,
            errorMessage,
            errorStack: errorObj?.stack,
            errorCode: errorObj?.name,
            metadata,
        });
    }, [logAction]);

    // Convenience: Log admin action
    const logAdminAction = useCallback((
        actionName: string,
        targetId?: string,
        targetType?: string,
        details?: Record<string, unknown>
    ) => {
        logAction({
            actionType: 'admin',
            actionName,
            metadata: {
                targetId,
                targetType,
                ...details,
            },
        });
    }, [logAction]);

    // Convenience: Log game action
    const logGameAction = useCallback((
        actionName: string,
        gameType?: string,
        details?: Record<string, unknown>
    ) => {
        logAction({
            actionType: 'game',
            actionName,
            metadata: {
                gameType,
                ...details,
            },
        });
    }, [logAction]);

    // Convenience: Log subscription action
    const logSubscriptionAction = useCallback((
        actionName: string,
        details?: Record<string, unknown>
    ) => {
        logAction({
            actionType: 'subscription',
            actionName,
            metadata: details,
        });
    }, [logAction]);

    // Convenience: Log auth action
    const logAuthAction = useCallback((
        actionName: string,
        success: boolean,
        errorMessage?: string
    ) => {
        logAction({
            actionType: 'auth',
            actionName,
            isError: !success,
            errorMessage,
        });
    }, [logAction]);

    // Force flush (useful before navigation)
    const flush = useCallback(() => {
        loggerRef.current?.flush();
    }, []);

    return {
        logAction,
        logPageView,
        logClick,
        logFormSubmit,
        startApiRequest,
        endApiRequest,
        logError,
        logAdminAction,
        logGameAction,
        logSubscriptionAction,
        logAuthAction,
        flush,
    };
}

export default useActionLogger;
