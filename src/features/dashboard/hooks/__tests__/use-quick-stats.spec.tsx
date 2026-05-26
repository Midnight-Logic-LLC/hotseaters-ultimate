import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseTeam = vi.fn();
const mockUseClientsList = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/company/hooks/use-team', () => ({
  useTeam: (...args: unknown[]) => mockUseTeam(...args),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
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
import { useQuickStats } from '../use-quick-stats';

const mockUseEntities = vi.mocked(useEntities);

const invoices = [
  { id: 'i1', total: 1000, status: 'sent' },
  { id: 'i2', total: 500, status: 'overdue' },
];
const timeEntries = [
  { id: 'te1', consultant_id: 'm1', start_time: '2026-03-09T10:00:00Z', duration_hours: 4 },
  { id: 'te2', consultant_id: 'm2', start_time: '2026-03-10T10:00:00Z', duration_hours: 6 },
];
const requests = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];
const assignments = [{ id: 'g1' }];

const NOW = new Date(2026, 2, 11); // Wed Mar 11

beforeEach(() => {
  mockUseClientsList.mockReturnValue({
    clients: [
      { id: 'cl-a', status: 'active' },
      { id: 'cl-b', status: 'active' },
      { id: 'cl-c', status: 'inactive' },
    ],
    isLoading: false,
  });
  mockUseTeam.mockReturnValue({
    members: [
      { id: 'm1', account_status: 'active', first_name: 'A', last_name: 'X' },
      { id: 'm2', account_status: 'active', first_name: 'B', last_name: 'Y' },
      { id: 'm3', account_status: 'disabled', first_name: 'C', last_name: 'Z' },
    ],
    isLoading: false,
  });
  mockUseEntities.mockImplementation((type: string) => {
    if (type === 'Invoice') return { items: invoices, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'TimeEntry') return { items: timeEntries, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'SubcontractRequest') return { items: requests, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'SubcontractAssignment') return { items: assignments, isLoading: false, isError: false, error: null, refetch: vi.fn() };
    return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
  });
});

describe('useQuickStats', () => {
  it('returns empty result when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    const { result } = renderHook(() => useQuickStats({ now: NOW }));
    expect(result.current.activeClients).toBe(0);
    expect(result.current.teamMembers).toBe(0);
  });

  it('computes all 4 always-on counters', async () => {
    mockUseTier1.mockImplementation(() => ({
      company: { id: 'co', name: 'Co', marketplace_post_jobs: false, marketplace_fill_jobs: false },
    }));
    const { result } = renderHook(() => useQuickStats({ now: NOW }));
    await waitFor(() => {
      expect(result.current.outstandingAmount).toBe(1500);
    });
    expect(result.current.activeClients).toBe(2);
    expect(result.current.teamMembers).toBe(2);
    // 4 + 6 = 10 hours / 2 consultants = 5
    expect(result.current.avgHoursPerWeek).toBe(5);
    expect(result.current.openHshPosts).toBeUndefined();
    expect(result.current.activeHshGigs).toBeUndefined();
  });

  it('counts only active members for teamMembers (2 active + 1 inactive)', async () => {
    // T9: validates the latent fix — status must reflect account_status, not be hardcoded 'active'
    mockUseTier1.mockImplementation(() => ({
      company: { id: 'co', name: 'Co', marketplace_post_jobs: false, marketplace_fill_jobs: false },
    }));
    mockUseTeam.mockReturnValue({
      members: [
        { id: 'm1', account_status: 'active', first_name: 'A', last_name: 'X' },
        { id: 'm2', account_status: 'active', first_name: 'B', last_name: 'Y' },
        { id: 'm3', account_status: 'inactive', first_name: 'C', last_name: 'Z' },
      ],
      isLoading: false,
    });
    const { result } = renderHook(() => useQuickStats({ now: NOW }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.teamMembers).toBe(2);
  });

  it('includes HSH counters when company flags are set', async () => {
    mockUseTier1.mockImplementation(() => ({
      company: { id: 'co', name: 'Co', marketplace_post_jobs: true, marketplace_fill_jobs: true },
    }));
    const { result } = renderHook(() => useQuickStats({ now: NOW }));
    await waitFor(() => {
      expect(result.current.openHshPosts).toBe(3);
    });
    expect(result.current.activeHshGigs).toBe(1);
  });
});
