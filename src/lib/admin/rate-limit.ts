import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting for admin routes
// For production, use Redis instead

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const ADMIN_RATE_LIMIT = 30; // requests per window
const WINDOW_MS = 60000; // 1 minute

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';
}

/**
 * Check rate limit for admin routes
 * Returns null if allowed, or a NextResponse if blocked
 */
export function checkAdminRateLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIp(request);
    const key = `admin:${ip}`;
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean up
        cleanExpiredEntries();
    }

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
        // New window
        rateLimitStore.set(key, { count: 1, resetTime: now + WINDOW_MS });
        return null;
    }

    if (entry.count >= ADMIN_RATE_LIMIT) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return NextResponse.json(
            {
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': ADMIN_RATE_LIMIT.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': entry.resetTime.toString(),
                },
            }
        );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);
    return null;
}

/**
 * Rate limit wrapper for admin route handlers
 */
export function withAdminRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
): T {
    return (async (request: NextRequest, ...args: any[]) => {
        const rateLimitResponse = checkAdminRateLimit(request);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        return handler(request, ...args);
    }) as T;
}

function cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}
