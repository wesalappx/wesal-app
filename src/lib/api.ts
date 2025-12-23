const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;
    private accessToken: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (this.accessToken) {
            requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An error occurred' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth endpoints
    auth = {
        register: (data: {
            email?: string;
            phone?: string;
            password: string;
            displayName: string;
            dateOfBirth: string;
            gender: 'MALE' | 'FEMALE';
        }) => this.request('/auth/register', { method: 'POST', body: data }),

        login: (data: { email?: string; phone?: string; password: string }) =>
            this.request<{ accessToken: string; refreshToken: string; user: any }>(
                '/auth/login',
                { method: 'POST', body: data }
            ),

        verifyOtp: (data: { userId: string; code: string; type: string }) =>
            this.request('/auth/verify-otp', { method: 'POST', body: data }),

        refreshToken: (refreshToken: string) =>
            this.request<{ accessToken: string; refreshToken: string }>(
                '/auth/refresh',
                { method: 'POST', body: { refreshToken } }
            ),

        getProfile: () => this.request('/auth/me'),

        logout: (refreshToken: string) =>
            this.request('/auth/logout', { method: 'POST', body: { refreshToken } }),
    };

    // Pairing endpoints
    pairing = {
        generateCode: () =>
            this.request<{ code: string; expiresAt: string }>('/pairing/generate-code', { method: 'POST' }),

        getMyCode: () =>
            this.request<{ code: string | null; expiresAt?: string }>('/pairing/my-code'),

        acceptCode: (code: string) =>
            this.request('/pairing/accept/' + code, { method: 'POST' }),

        getStatus: () =>
            this.request<{ isPaired: boolean; partner?: any }>('/pairing/status'),

        requestUnpair: () =>
            this.request('/pairing/unpair/request', { method: 'POST' }),

        confirmUnpair: () =>
            this.request('/pairing/unpair/confirm', { method: 'POST' }),
    };

    // Game endpoints
    game = {
        getJourneys: (category?: string) =>
            this.request<{ journeys: any[] }>('/game/journeys' + (category ? `?category=${category}` : '')),

        getJourneyDetails: (slug: string) =>
            this.request<any>(`/game/journeys/${slug}`),

        startJourney: (slug: string) =>
            this.request(`/game/journeys/${slug}/start`, { method: 'POST' }),

        getProgress: (slug: string) =>
            this.request(`/game/journeys/${slug}/progress`),

        getCurrentQuestion: (slug: string) =>
            this.request(`/game/play/${slug}/current`),

        markReady: (slug: string, ready: boolean) =>
            this.request(`/game/play/${slug}/answer`, { method: 'POST', body: { ready } }),

        moveToNext: (slug: string) =>
            this.request(`/game/play/${slug}/next`, { method: 'POST' }),

        getAchievements: () =>
            this.request<{ achievements: any[] }>('/game/achievements'),

        getDashboard: () =>
            this.request('/game/dashboard'),
    };

    // Check-in endpoints
    checkIn = {
        create: (data: { mood: number; energy: number; stress: number; shareWithPartner?: boolean }) =>
            this.request('/check-in', { method: 'POST', body: data }),

        getToday: () =>
            this.request('/check-in/today'),

        getHistory: () =>
            this.request('/check-in/history'),

        getPartnerCheckIn: () =>
            this.request('/check-in/partner'),

        getAlignment: () =>
            this.request('/check-in/alignment'),

        getRecommendations: () =>
            this.request('/check-in/recommendations'),
    };

    // Conflict resolution endpoints
    conflict = {
        start: () =>
            this.request('/conflict/start', { method: 'POST' }),

        accept: (sessionId: string) =>
            this.request(`/conflict/${sessionId}/accept`, { method: 'POST' }),

        getCurrent: () =>
            this.request('/conflict/current'),

        complete: (sessionId: string) =>
            this.request(`/conflict/${sessionId}/complete`, { method: 'POST' }),

        cancel: (sessionId: string) =>
            this.request(`/conflict/${sessionId}/cancel`, { method: 'POST' }),

        getHistory: () =>
            this.request('/conflict/history'),

        getPrompts: () =>
            this.request('/conflict/prompts'),
    };

    // Subscription endpoints
    subscription = {
        getPlans: () =>
            this.request('/subscription/plans'),

        getStatus: () =>
            this.request('/subscription/status'),

        subscribe: (plan: string) =>
            this.request('/subscription/subscribe', { method: 'POST', body: { plan } }),

        startTrial: () =>
            this.request('/subscription/trial', { method: 'POST' }),

        cancel: () =>
            this.request('/subscription/cancel', { method: 'POST' }),

        getPayments: () =>
            this.request('/subscription/payments'),
    };

    // Notification endpoints
    notifications = {
        getAll: (unreadOnly = false, limit = 20) =>
            this.request(`/notifications?unreadOnly=${unreadOnly}&limit=${limit}`),

        getUnreadCount: () =>
            this.request<{ unreadCount: number }>('/notifications/unread-count'),

        markAsRead: (id: string) =>
            this.request(`/notifications/${id}/read`, { method: 'POST' }),

        markAllAsRead: () =>
            this.request('/notifications/read-all', { method: 'POST' }),

        registerPushToken: (token: string, platform: 'WEB' | 'IOS' | 'ANDROID') =>
            this.request('/notifications/push-token', { method: 'POST', body: { token, platform } }),
    };
}

export const api = new ApiClient(API_BASE_URL);
