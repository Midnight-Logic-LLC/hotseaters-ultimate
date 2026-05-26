import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTrend = vi.fn();
const mockUsePrefs = vi.fn();
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

const rechartsSizeWarning = /width\(.*height\(.*chart should be greater than 0/s;

vi.mock('@/features/dashboard/hooks/use-revenue-trend', () => ({
  useRevenueTrend: () => mockUseTrend(),
}));
vi.mock('@/features/dashboard/hooks/use-dashboard-preferences', () => ({
  useDashboardPreferences: () => mockUsePrefs(),
}));

import { RevenueTrendCard } from '../revenue-trend-card';

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mockUsePrefs.mockReturnValue({
    setFiscalYear: vi.fn(),
    setShowCumulative: vi.fn(),
    setPeriod: vi.fn(),
  });
});

afterEach(() => {
  const chartWarnings = [...warnSpy.mock.calls, ...errorSpy.mock.calls]
    .map((args) => args.join(' '))
    .filter((message) => rechartsSizeWarning.test(message));
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  expect(chartWarnings).toEqual([]);
});

describe('RevenueTrendCard', () => {
  it('renders skeleton while loading with no data', () => {
    mockUseTrend.mockReturnValue({
      data: [],
      period: 'month',
      fiscalYear: 2026,
      cumulative: false,
      availableFiscalYears: [2024, 2025, 2026, 2027, 2028],
      revenueGoal: 0,
      isLoading: true,
    });
    render(<RevenueTrendCard />);
    expect(screen.getByLabelText('Revenue trend loading')).toBeTruthy();
  });

  it('renders the three toolbar controls when not loading', () => {
    mockUseTrend.mockReturnValue({
      data: [{ label: 'Jan 26', revenue: 0, projected: 0, trend: null }],
      period: 'month',
      fiscalYear: 2026,
      cumulative: false,
      availableFiscalYears: [2024, 2025, 2026, 2027, 2028],
      revenueGoal: 10_000,
      isLoading: false,
    });
    render(<RevenueTrendCard />);
    expect(screen.getByTestId('revenue-trend-fiscal-year')).toBeTruthy();
    expect(screen.getByTestId('revenue-trend-period')).toBeTruthy();
    expect(screen.getByTestId('revenue-trend-cumulative')).toBeTruthy();
  });
});
