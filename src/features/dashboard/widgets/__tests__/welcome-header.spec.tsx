import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTier1 = vi.fn();
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

import { WelcomeHeader } from '../welcome-header';

beforeEach(() => {
  mockUseTier1.mockReset();
});

describe('WelcomeHeader', () => {
  it('renders the bible welcome copy + subhead', () => {
    mockUseTier1.mockReturnValue({ userInfo: { first_name: 'Travis' } });
    render(<WelcomeHeader />);
    expect(screen.getByText('Welcome back, Travis')).toBeTruthy();
    expect(screen.getByText(/what's happening with your business/i)).toBeTruthy();
  });

  it('omits the name when first_name is missing', () => {
    mockUseTier1.mockReturnValue({ userInfo: null });
    render(<WelcomeHeader />);
    expect(screen.getByText('Welcome back')).toBeTruthy();
  });
});
