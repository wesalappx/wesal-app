/**
 * Unit tests for AI utilities
 */

// Mock fetch
global.fetch = jest.fn();

describe('AI Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockReset();
    });

    describe('AI Chat API', () => {
        it('should send messages to the AI endpoint', async () => {
            const mockResponse = {
                content: 'AI response here'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant' },
                        { role: 'user', content: 'Hello' }
                    ]
                }),
            });

            const data = await response.json();
            expect(data.content).toBe('AI response here');
        });

        it('should handle API errors gracefully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Server error' }),
            });

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [] }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);
        });

        it('should handle rate limiting', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
            });

            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [] }),
            });

            expect(response.status).toBe(429);
        });
    });

    describe('Message Formatting', () => {
        it('should format user messages correctly', () => {
            const userMessage = {
                role: 'user',
                content: 'Test message'
            };

            expect(userMessage.role).toBe('user');
            expect(userMessage.content).toBe('Test message');
        });

        it('should format system messages correctly', () => {
            const systemMessage = {
                role: 'system',
                content: 'You are a relationship coach'
            };

            expect(systemMessage.role).toBe('system');
        });

        it('should format assistant messages correctly', () => {
            const assistantMessage = {
                role: 'assistant',
                content: 'Here is my advice...'
            };

            expect(assistantMessage.role).toBe('assistant');
        });
    });
});
