import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

const mockUseTier1 = vi.fn();
const mockUseTeam = vi.fn();
const mockFetchTimeEntries = vi.fn();
const mockFetchAssignments = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/company/hooks/use-team', () => ({
  useTeam: (...args: unknown[]) => mockUseTeam(...args),
}));

vi.mock('@/features/time-entries/stores/time-entries-store', () => ({
  fetchTimeEntriesForCompany: (...args: unknown[]) => mockFetchTimeEntries(...args),
}));

vi.mock('@/features/subcontracts/stores/subcontracts-store', () => ({
  fetchAssignmentsHiredByCompany: (...args: unknown[]) => mockFetchAssignments(...args),
}));

import { useTeamWeek } from '../use-team-week';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const NOW = new Date(2026, 2, 11); // Wed Mar 11, 2026 — week is Sun Mar 8 .. Sat Mar 14
const tier1 = { company: { id: 'co', name: 'Co' } };

const members = [
  { id: 'c1', first_name: 'Ada', last_name: 'Lovelace', account_status: 'active' },
  { id: 'c2', first_name: 'Alan', last_name: 'Turing', account_status: 'active' },
  { id: 'c3', first_name: 'Inactive', last_name: 'User', account_status: 'disabled' },
];

const timeEntries = [
  { id: 'te1', company_id: 'co', consultant_id: 'c1', start_time: '2026-03-09T10:00:00Z', duration_hours: 4, amount: 800 },
  { id: 'te2', company_id: 'co', consultant_id: 'c2', start_time: '2026-03-10T09:00:00Z', duration_hours: 6, amount: 1200 },
  { id: 'te3', company_id: 'co', consultant_id: 'sub-1', start_time: '2026-03-11T09:00:00Z', duration_hours: 5, amount: 1000 },
  // outside window
  { id: 'te-old', company_id: 'co', consultant_id: 'c1', start_time: '2026-02-01T09:00:00Z', duration_hours: 8, amount: 1600 },
];

const assignments = [
  {
    id: 'a1',
    consultant_id: 'sub-1',
    consultant_first_name: 'Edsger',
    consultant_last_name: 'Dijkstra',
    status: 'active',
  },
];

beforeEach(() => {
  resetGraphStore();
  mockUseTier1.mockImplementation(() => tier1);
  mockUseTeam.mockReturnValue({ members, isLoading: false });
  mockFetchTimeEntries.mockReset();
  mockFetchTimeEntries.mockResolvedValue(timeEntries);
  mockFetchAssignments.mockReset();
  mockFetchAssignments.mockResolvedValue(assignments);
});

describe('useTeamWeek', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    const { result } = renderHook(() => useTeamWeek({ now: NOW }));
    expect(result.current.stats).toHaveLength(0);
  });

  it('aggregates per active consultant and merges HSH subs', async () => {
    const { result } = renderHook(() => useTeamWeek({ now: NOW }));
    await waitFor(() => {
      expect(result.current.stats.length).toBeGreaterThan(0);
    });
    expect(result.current.stats).toEqual([
      { name: 'Ada Lovelace', hours: 4, revenue: 800, isHsh: false },
      { name: 'Alan Turing', hours: 6, revenue: 1200, isHsh: false },
      { name: 'Edsger Dijkstra', hours: 5, revenue: 1000, isHsh: true },
    ]);
  });

  it('excludes inactive members', async () => {
    const { result } = renderHook(() => useTeamWeek({ now: NOW }));
    await waitFor(() => {
      expect(result.current.stats.length).toBeGreaterThan(0);
    });
    expect(result.current.stats.find((s) => s.name === 'Inactive User')).toBeUndefined();
  });
});
