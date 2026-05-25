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
  it('renders the bible welcome copy + subhead when first_name is present', () => {
    mockUseTier1.mockReturnValue({ userInfo: { first_name: 'Travis' } });
    render(<WelcomeHeader />);
    expect(screen.getByText('Welcome back, Travis')).toBeTruthy();
    expect(screen.getByText(/what's happening with your business/i)).toBeTruthy();
  });

  it('falls back to "Welcome back, User" when userInfo is null (pre-hydration)', () => {
    // Matches bible Dashboard.jsx:703: `Welcome back, {userInfo?.first_name || 'User'}`.
    // Pre-hydration the comma + "User" are always rendered so there is no
    // layout shift when tier1 resolves and the real name lands.
    mockUseTier1.mockReturnValue({ userInfo: null });
    render(<WelcomeHeader />);
    expect(screen.getByText('Welcome back, User')).toBeTruthy();
  });

  it('falls back to "Welcome back, User" when first_name is empty string', () => {
    // `|| 'User'` is a falsy-fallback so '' (empty) also lands on 'User'.
    mockUseTier1.mockReturnValue({ userInfo: { first_name: '' } });
    render(<WelcomeHeader />);
    expect(screen.getByText('Welcome back, User')).toBeTruthy();
  });
});
