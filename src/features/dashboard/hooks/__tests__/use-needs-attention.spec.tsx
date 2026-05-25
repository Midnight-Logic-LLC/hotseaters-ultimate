import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

const mockUseTier1 = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseClientsList = vi.fn();
const mockFetchLeads = vi.fn();
const mockFetchActivities = vi.fn();
const mockFetchAttorneys = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
}));
vi.mock('@/features/lead-radar/stores/lead-radar-store', () => ({
  fetchLeadsForCompany: (...args: unknown[]) => mockFetchLeads(...args),
  fetchPendingActivitiesForCompany: (...args: unknown[]) => mockFetchActivities(...args),
  fetchAttorneysForCompany: (...args: unknown[]) => mockFetchAttorneys(...args),
}));

import {
  useNeedsAttention,
  __setLeadRadarAvailableForTests,
} from '../use-needs-attention';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const NOW = new Date(2026, 2, 15);
const tier1 = { company: { id: 'co', name: 'Co' } };

beforeEach(() => {
  resetGraphStore();
  // Enable the lead-radar feature flag for the spec; production default is
  // false until the `lead` / `sales_activity` / `attorney` tables exist.
  __setLeadRadarAvailableForTests(true);
  mockUseTier1.mockImplementation(() => tier1);
  mockUseCurrentUser.mockReturnValue({
    userInfo: { id: 'me' },
    isLoading: false,
  });
  mockUseClientsList.mockReturnValue({
    clients: [
      { id: 'cl-mine', sales_lead: 'me' },
      { id: 'cl-other', sales_lead: 'someone-else' },
    ],
    isLoading: false,
  });
  mockFetchLeads.mockReset();
  mockFetchActivities.mockReset();
  mockFetchAttorneys.mockReset();
});

describe('useNeedsAttention', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.myCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('counts mine vs total via Phase A stale-leads rule', async () => {
    mockFetchLeads.mockResolvedValue([
      { id: 'l1', attorney_id: 'a-mine' }, // mine, no activity -> stale
      { id: 'l2', attorney_id: 'a-other' }, // theirs, overdue -> stale
      { id: 'l3', attorney_id: 'a-mine' }, // mine, future activity -> fresh
    ]);
    mockFetchActivities.mockResolvedValue([
      { id: 'act1', lead_id: 'l2', scheduled_date: '2026-03-01', status: 'pending' }, // overdue
      { id: 'act2', lead_id: 'l3', scheduled_date: '2026-03-20', status: 'pending' }, // future
    ]);
    mockFetchAttorneys.mockResolvedValue([
      { id: 'a-mine', client_id: 'cl-mine' },
      { id: 'a-other', client_id: 'cl-other' },
    ]);
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    await waitFor(() => {
      expect(result.current.totalCount).toBeGreaterThan(0);
    });
    // l1 stale + mine, l2 stale + theirs. l3 fresh.
    expect(result.current.totalCount).toBe(2);
    expect(result.current.myCount).toBe(1);
  });
});
