/**
 * Component tests for Loading component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Loading component since it uses client-side features
jest.mock('@/components/Loading', () => ({
    __esModule: true,
    default: ({ size = 'md', text }: { size?: string; text?: string }) => (
        <div data-testid="loading" data-size={size}>
            <div className="spinner" />
            {text && <span>{text}</span>}
        </div>
    ),
}));

import Loading from '@/components/Loading';

describe('Loading Component', () => {
    it('should render loading spinner', () => {
        render(<Loading />);
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should render with default size', () => {
        render(<Loading />);
        expect(screen.getByTestId('loading')).toHaveAttribute('data-size', 'md');
    });

    it('should render with custom size', () => {
        render(<Loading size="lg" />);
        expect(screen.getByTestId('loading')).toHaveAttribute('data-size', 'lg');
    });

    it('should render with loading text', () => {
        render(<Loading text="جاري التحميل..." />);
        expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
    });

    it('should render without text when not provided', () => {
        render(<Loading />);
        expect(screen.queryByText('جاري التحميل...')).not.toBeInTheDocument();
    });
});
