import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Create a wrapper with all providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>
}

// Custom render function that includes providers
const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data helpers
export const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
        full_name: 'Test User',
    },
}

export const mockPartner = {
    id: 'test-partner-id',
    email: 'partner@example.com',
    user_metadata: {
        full_name: 'Test Partner',
    },
}

export const mockPairing = {
    id: 'test-pairing-id',
    user1_id: mockUser.id,
    user2_id: mockPartner.id,
    status: 'active',
    pairing_code: 'TEST123',
}

export const mockCheckIn = {
    id: 'test-checkin-id',
    user_id: mockUser.id,
    mood_score: 8,
    energy_score: 7,
    journal_entry: 'Test journal',
    created_at: new Date().toISOString(),
}

export const mockNote = {
    id: 'test-note-id',
    pairing_id: mockPairing.id,
    author_id: mockUser.id,
    title: 'Test Note',
    content: 'Test content',
    created_at: new Date().toISOString(),
}
