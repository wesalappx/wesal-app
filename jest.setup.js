import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
    }),
    useSearchParams: () => ({
        get: jest.fn((key) => null),
    }),
    usePathname: () => '/',
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: 'div',
        button: 'button',
        span: 'span',
    },
    AnimatePresence: ({ children }) => children,
}))

// Mock sounds
jest.mock('@/hooks/useSound', () => ({
    useSound: () => ({
        playSound: jest.fn(),
    }),
}))

// Suppress console errors in tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
}
