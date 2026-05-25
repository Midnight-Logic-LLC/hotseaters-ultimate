import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseTrend = vi.fn();
const mockUsePrefs = vi.fn();

vi.mock('@/features/dashboard/hooks/use-revenue-trend', () => ({
  useRevenueTrend: () => mockUseTrend(),
}));
vi.mock('@/features/dashboard/hooks/use-dashboard-preferences', () => ({
  useDashboardPreferences: () => mockUsePrefs(),
}));

import { RevenueTrendCard } from '../revenue-trend-card';

beforeEach(() => {
  mockUsePrefs.mockReturnValue({
    setFiscalYear: vi.fn(),
    setShowCumulative: vi.fn(),
    setPeriod: vi.fn(),
  });
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
