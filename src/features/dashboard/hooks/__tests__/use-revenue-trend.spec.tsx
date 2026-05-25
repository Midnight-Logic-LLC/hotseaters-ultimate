import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

const mockUseTier1 = vi.fn();
const mockUseDashboardPreferences = vi.fn();
const mockUseTrialProjections = vi.fn();
const mockFetchInvoicesForCompany = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/dashboard/hooks/use-dashboard-preferences', () => ({
  useDashboardPreferences: () => mockUseDashboardPreferences(),
}));

vi.mock('@/features/dashboard/hooks/use-trial-projections', () => ({
  useTrialProjections: () => mockUseTrialProjections(),
}));

vi.mock('@/features/invoices/stores/invoices-store', () => ({
  fetchInvoicesForCompany: (...args: unknown[]) =>
    mockFetchInvoicesForCompany(...args),
}));

import { useRevenueTrend } from '../use-revenue-trend';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const NOW = new Date(2026, 2, 15); // 2026-03-15

beforeEach(() => {
  resetGraphStore();
  mockFetchInvoicesForCompany.mockReset();
  mockFetchInvoicesForCompany.mockResolvedValue([]);
  mockUseTrialProjections.mockReturnValue({
    projectedInvoices: new Map(),
    isLoading: false,
  });
});

describe('useRevenueTrend', () => {
  it('returns empty dataset when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: null, showCumulative: false, period: 'month' },
      isLoading: false,
    });
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    expect(result.current.data).toHaveLength(0);
    expect(result.current.period).toBe('month');
  });

  it('derives fiscal year from now + company fiscal_year_start_month', () => {
    const tier1 = {
      company: { id: 'co', name: 'Co', fiscal_year_start_month: 7 },
    };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: null, showCumulative: false, period: 'month' },
      isLoading: false,
    });
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    // Mar 15 < Jul start → previous calendar year = 2025
    expect(result.current.fiscalYear).toBe(2025);
  });

  it('honours user-selected fiscal year from preferences', () => {
    const tier1 = { company: { id: 'co', name: 'Co' } };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: 2027, showCumulative: false, period: 'month' },
      isLoading: false,
    });
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    expect(result.current.fiscalYear).toBe(2027);
  });

  it('returns 12 monthly buckets for period=month', async () => {
    const tier1 = {
      company: { id: 'co', name: 'Co', fiscal_year_start_month: 1, annual_revenue_target: 120_000 },
    };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: 2026, showCumulative: false, period: 'month' },
      isLoading: false,
    });
    mockFetchInvoicesForCompany.mockResolvedValue([
      { id: 'i1', invoice_date: '2026-01-15', total: 10_000 },
    ]);
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    await waitFor(() => {
      expect(result.current.data.length).toBe(12);
    });
    expect(result.current.data[0]?.label).toBe('Jan 26');
    expect(result.current.data[0]?.revenue).toBe(10_000);
    // goal = annual / 12 = 10_000
    expect(result.current.revenueGoal).toBe(10_000);
  });

  it('returns 52 weekly buckets for period=week', async () => {
    const tier1 = {
      company: { id: 'co', name: 'Co', fiscal_year_start_month: 1, annual_revenue_target: 520_000 },
    };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: 2026, showCumulative: false, period: 'week' },
      isLoading: false,
    });
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    await waitFor(() => {
      expect(result.current.data.length).toBe(52);
    });
    expect(result.current.revenueGoal).toBe(10_000);
  });

  it('cumulative=true folds dataset to running totals', async () => {
    const tier1 = {
      company: { id: 'co', name: 'Co', fiscal_year_start_month: 1, annual_revenue_target: 120_000 },
    };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: 2026, showCumulative: true, period: 'month' },
      isLoading: false,
    });
    mockFetchInvoicesForCompany.mockResolvedValue([
      { id: 'i1', invoice_date: '2026-01-15', total: 1_000 },
      { id: 'i2', invoice_date: '2026-02-15', total: 1_000 },
      { id: 'i3', invoice_date: '2026-03-15', total: 1_000 },
    ]);
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    await waitFor(() => {
      expect(result.current.data[2]?.revenue).toBeGreaterThan(0);
    });
    // Jan = 1000, Feb = 2000, Mar = 3000 (cumulative)
    expect(result.current.data[0]?.revenue).toBe(1_000);
    expect(result.current.data[1]?.revenue).toBe(2_000);
    expect(result.current.data[2]?.revenue).toBe(3_000);
    // cumulative goal = full annual target
    expect(result.current.revenueGoal).toBe(120_000);
  });

  it('availableFiscalYears centers on the active FY (5 entries)', () => {
    const tier1 = { company: { id: 'co', name: 'Co' } };
    mockUseTier1.mockImplementation(() => tier1);
    mockUseDashboardPreferences.mockReturnValue({
      prefs: { fiscalYear: 2026, showCumulative: false, period: 'month' },
      isLoading: false,
    });
    const { result } = renderHook(() => useRevenueTrend({ now: NOW }));
    expect(result.current.availableFiscalYears).toEqual([2024, 2025, 2026, 2027, 2028]);
  });
});
