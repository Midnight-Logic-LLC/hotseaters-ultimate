import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseTeam = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/company/hooks/use-team', () => ({
  useTeam: (...args: unknown[]) => mockUseTeam(...args),
}));

// Mock useEntities at the module level
vi.mock('@prometheus-ags/prometheus-entity-management', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@prometheus-ags/prometheus-entity-management')>();
  return {
    ...actual,
    useEntities: vi.fn(),
  };
});

import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTeamMonth } from '../use-team-month';

const mockUseEntities = vi.mocked(useEntities);

const NOW = new Date(2026, 2, 15); // Mar 15, 2026 — month window is Mar 1..Mar 31
const tier1 = { company: { id: 'co', name: 'Co' } };

beforeEach(() => {
  mockUseTier1.mockImplementation(() => tier1);
  mockUseTeam.mockReturnValue({
    members: [
      { id: 'c1', first_name: 'Ada', last_name: 'L', account_status: 'active' },
    ],
    isLoading: false,
  });
  mockUseEntities.mockImplementation((type: string) => {
    if (type === 'TimeEntry') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'SubcontractAssignment') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
  });
});

describe('useTeamMonth', () => {
  it('aggregates time entries in the calendar month', async () => {
    const monthTimeEntries = [
      { id: 'te1', company_id: 'co', consultant_id: 'c1', start_time: '2026-03-05T10:00:00Z', duration_hours: 3, amount: 600 },
      { id: 'te2', company_id: 'co', consultant_id: 'c1', start_time: '2026-03-22T11:00:00Z', duration_hours: 5, amount: 1000 },
      { id: 'te-out', company_id: 'co', consultant_id: 'c1', start_time: '2026-02-28T11:00:00Z', duration_hours: 8, amount: 1600 },
    ];
    mockUseEntities.mockImplementation((type: string) => {
      if (type === 'TimeEntry') return { items: monthTimeEntries, isLoading: false, isError: false, error: null, refetch: vi.fn() };
      if (type === 'SubcontractAssignment') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
      return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    });
    const { result } = renderHook(() => useTeamMonth({ now: NOW }));
    await waitFor(() => {
      expect(result.current.stats.length).toBeGreaterThan(0);
    });
    // 3 + 5 = 8 hours, 600 + 1000 = 1600 — Feb entry excluded
    expect(result.current.stats[0]).toEqual({ name: 'Ada L', hours: 8, revenue: 1600, isHsh: false });
  });

  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    const { result } = renderHook(() => useTeamMonth({ now: NOW }));
    expect(result.current.stats).toHaveLength(0);
  });
});
