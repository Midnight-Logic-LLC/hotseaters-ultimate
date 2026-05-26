import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTeamMonth = vi.fn();
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

const rechartsSizeWarning = /width\(.*height\(.*chart should be greater than 0/s;

vi.mock('@/features/dashboard/hooks/use-team-month', () => ({
  useTeamMonth: () => mockUseTeamMonth(),
}));

import { MonthlyTeamPerformance } from '../monthly-team-performance';

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mockUseTeamMonth.mockReset();
});

afterEach(() => {
  const chartWarnings = [...warnSpy.mock.calls, ...errorSpy.mock.calls]
    .map((args) => args.join(' '))
    .filter((message) => rechartsSizeWarning.test(message));
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  expect(chartWarnings).toEqual([]);
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
