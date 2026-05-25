import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUse = vi.fn();
vi.mock('@/features/dashboard/hooks/use-active-trial-stats', () => ({
  useActiveTrialStats: () => mockUse(),
}));

import { ActiveTrialPerformance } from '../active-trial-performance';

beforeEach(() => {
  mockUse.mockReset();
});

describe('ActiveTrialPerformance', () => {
  it('renders bible empty-state copy when no stats', () => {
    mockUse.mockReturnValue({ stats: [], isLoading: false });
    render(<ActiveTrialPerformance />);
    expect(screen.getByText('No active trial data yet')).toBeTruthy();
  });

  it('renders skeleton while loading', () => {
    mockUse.mockReturnValue({ stats: [], isLoading: true });
    render(<ActiveTrialPerformance />);
    expect(screen.getByLabelText('Active trial performance loading')).toBeTruthy();
  });

  it('mounts when stats exist', () => {
    mockUse.mockReturnValue({
      stats: [{ id: 't1', name: 'Acme v. Doe', client: 'Acme LLP', hours: 5, revenue: 1000 }],
      isLoading: false,
    });
    expect(() => render(<ActiveTrialPerformance />)).not.toThrow();
  });
});
