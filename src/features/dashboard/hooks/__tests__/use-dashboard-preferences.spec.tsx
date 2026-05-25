import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseCurrentUser = vi.fn();
const mockPatch = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock('@/features/auth/stores/user-info-store', () => ({
  patchPreferences: (...args: unknown[]) => mockPatch(...args),
}));

import { useDashboardPreferences } from '../use-dashboard-preferences';

beforeEach(() => {
  mockPatch.mockReset();
  mockPatch.mockResolvedValue(undefined);
});

describe('useDashboardPreferences — reads', () => {
  it('returns defaults when no userInfo is loaded', () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: null, isLoading: false });
    const { result } = renderHook(() => useDashboardPreferences());
    expect(result.current.prefs).toEqual({
      fiscalYear: null,
      showCumulative: false,
      period: 'month',
    });
  });

  it('projects existing preferences with safe defaults', () => {
    mockUseCurrentUser.mockReturnValue({
      userInfo: {
        id: 'ui-1',
        preferences: {
          dashboardRevenueFiscalYear: 2026,
          dashboardRevenueShowCumulative: true,
          dashboardRevenuePeriod: 'week',
        },
      },
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardPreferences());
    expect(result.current.prefs).toEqual({
      fiscalYear: 2026,
      showCumulative: true,
      period: 'week',
    });
  });

  it('coerces a string fiscal year and defaults bogus period to month', () => {
    mockUseCurrentUser.mockReturnValue({
      userInfo: {
        id: 'ui-1',
        preferences: {
          dashboardRevenueFiscalYear: '2027',
          dashboardRevenuePeriod: 'fortnight',
        },
      },
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardPreferences());
    expect(result.current.prefs.fiscalYear).toBe(2027);
    expect(result.current.prefs.period).toBe('month');
  });

  it('treats showCumulative === true strictly (no truthy coercion)', () => {
    mockUseCurrentUser.mockReturnValue({
      userInfo: {
        id: 'ui-1',
        preferences: { dashboardRevenueShowCumulative: 'true' },
      },
      isLoading: false,
    });
    const { result } = renderHook(() => useDashboardPreferences());
    expect(result.current.prefs.showCumulative).toBe(false);
  });
});

describe('useDashboardPreferences — writes', () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReturnValue({
      userInfo: {
        id: 'ui-1',
        preferences: { dashboardRevenueFiscalYear: 2025 },
      },
      isLoading: false,
    });
  });

  it('setFiscalYear calls patchPreferences with merge semantics', async () => {
    const { result } = renderHook(() => useDashboardPreferences());
    await act(async () => {
      await result.current.setFiscalYear(2027);
    });
    expect(mockPatch).toHaveBeenCalledWith(
      { dashboardRevenueFiscalYear: 2027 },
      expect.objectContaining({
        userInfoId: 'ui-1',
        previousPreferences: { dashboardRevenueFiscalYear: 2025 },
      }),
    );
  });

  it('setShowCumulative writes a boolean', async () => {
    const { result } = renderHook(() => useDashboardPreferences());
    await act(async () => {
      await result.current.setShowCumulative(true);
    });
    expect(mockPatch).toHaveBeenCalledWith(
      { dashboardRevenueShowCumulative: true },
      expect.any(Object),
    );
  });

  it('setPeriod writes the period string', async () => {
    const { result } = renderHook(() => useDashboardPreferences());
    await act(async () => {
      await result.current.setPeriod('week');
    });
    expect(mockPatch).toHaveBeenCalledWith(
      { dashboardRevenuePeriod: 'week' },
      expect.any(Object),
    );
  });

  it('omits userInfoId when no userInfo is loaded (still calls)', async () => {
    mockUseCurrentUser.mockReturnValue({ userInfo: null, isLoading: false });
    const { result } = renderHook(() => useDashboardPreferences());
    await act(async () => {
      await result.current.setFiscalYear(2030);
    });
    expect(mockPatch).toHaveBeenCalled();
    const call = mockPatch.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call?.userInfoId).toBeUndefined();
  });
});
