import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTeamWeek = vi.fn();
vi.mock('@/features/dashboard/hooks/use-team-week', () => ({
  useTeamWeek: () => mockUseTeamWeek(),
}));

import { WeeklyTeamPerformance } from '../weekly-team-performance';

beforeEach(() => {
  mockUseTeamWeek.mockReset();
});

describe('WeeklyTeamPerformance', () => {
  it('renders empty-state when no stats', () => {
    mockUseTeamWeek.mockReturnValue({ stats: [], isLoading: false });
    render(<WeeklyTeamPerformance />);
    expect(screen.getByTestId('weekly-team-performance')).toBeTruthy();
    // "0.0h • $0" appears in BOTH the header summary and the empty body.
    expect(screen.getAllByText('0.0h • $0').length).toBeGreaterThanOrEqual(1);
  });

  it('renders skeleton while loading', () => {
    mockUseTeamWeek.mockReturnValue({ stats: [], isLoading: true });
    render(<WeeklyTeamPerformance />);
    expect(screen.getByLabelText('Weekly team performance loading')).toBeTruthy();
  });

  it('shows total hours+revenue in header when stats exist', () => {
    mockUseTeamWeek.mockReturnValue({
      stats: [
        { name: 'Ada L', hours: 4, revenue: 800, isHsh: false },
        { name: 'Alan T', hours: 6, revenue: 1200, isHsh: false },
      ],
      isLoading: false,
    });
    render(<WeeklyTeamPerformance />);
    expect(screen.getByText('10.0h • $2,000')).toBeTruthy();
  });
});
