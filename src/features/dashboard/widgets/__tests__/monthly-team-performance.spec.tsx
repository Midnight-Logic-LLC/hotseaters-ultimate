import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTeamMonth = vi.fn();
vi.mock('@/features/dashboard/hooks/use-team-month', () => ({
  useTeamMonth: () => mockUseTeamMonth(),
}));

import { MonthlyTeamPerformance } from '../monthly-team-performance';

beforeEach(() => {
  mockUseTeamMonth.mockReset();
});

describe('MonthlyTeamPerformance', () => {
  it('renders empty-state when no stats', () => {
    mockUseTeamMonth.mockReturnValue({ stats: [], isLoading: false });
    render(<MonthlyTeamPerformance />);
    expect(screen.getByTestId('monthly-team-performance')).toBeTruthy();
    expect(screen.getAllByText('0.0h • $0').length).toBeGreaterThanOrEqual(1);
  });

  it('renders skeleton while loading', () => {
    mockUseTeamMonth.mockReturnValue({ stats: [], isLoading: true });
    render(<MonthlyTeamPerformance />);
    expect(screen.getByLabelText('Monthly team performance loading')).toBeTruthy();
  });
});
