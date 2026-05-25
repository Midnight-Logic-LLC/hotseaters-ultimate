import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

const mockUseTier1 = vi.fn();
const mockUseTeam = vi.fn();
const mockUseClientsList = vi.fn();
const mockFetchInvoices = vi.fn();
const mockFetchTimeEntries = vi.fn();
const mockFetchRequests = vi.fn();
const mockFetchGigs = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/company/hooks/use-team', () => ({
  useTeam: (...args: unknown[]) => mockUseTeam(...args),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
}));
vi.mock('@/features/invoices/stores/invoices-store', () => ({
  fetchInvoicesForCompany: (...args: unknown[]) => mockFetchInvoices(...args),
}));
vi.mock('@/features/time-entries/stores/time-entries-store', () => ({
  fetchTimeEntriesForCompany: (...args: unknown[]) => mockFetchTimeEntries(...args),
}));
vi.mock('@/features/subcontracts/stores/subcontracts-store', () => ({
  fetchRequestsForCompany: (...args: unknown[]) => mockFetchRequests(...args),
  fetchAssignmentsAsSubcontractor: (...args: unknown[]) => mockFetchGigs(...args),
}));

import { useQuickStats } from '../use-quick-stats';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const NOW = new Date(2026, 2, 11); // Wed Mar 11

beforeEach(() => {
  resetGraphStore();
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
  mockFetchInvoices.mockReset();
  mockFetchInvoices.mockResolvedValue([
    { id: 'i1', total: 1000, status: 'sent' },
    { id: 'i2', total: 500, status: 'overdue' },
  ]);
  mockFetchTimeEntries.mockReset();
  mockFetchTimeEntries.mockResolvedValue([
    { id: 'te1', consultant_id: 'm1', start_time: '2026-03-09T10:00:00Z', duration_hours: 4 },
    { id: 'te2', consultant_id: 'm2', start_time: '2026-03-10T10:00:00Z', duration_hours: 6 },
  ]);
  mockFetchRequests.mockReset();
  mockFetchRequests.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }]);
  mockFetchGigs.mockReset();
  mockFetchGigs.mockResolvedValue([{ id: 'g1' }]);
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
