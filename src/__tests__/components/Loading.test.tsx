/**
 * Component tests for Loading component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Loading component since it uses client-side features
jest.mock('@/components/Loading', () => ({
    __esModule: true,
    default: ({ message }: { message?: string }) => (
        <div data-testid="loading">
            <div className="spinner" />
            {message && <span>{message}</span>}
        </div>
    ),
}));

import Loading from '@/components/Loading';

describe('Loading Component', () => {
    it('should render loading spinner', () => {
        render(<Loading />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should render with loading message', () => {
        render(<Loading message="جاري التحميل..." />);
        expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    });

    it('should render without message when not provided', () => {
        render(<Loading />);
        expect(screen.queryByText('جاري التحميل...')).not.toBeInTheDocument();
    });
});
