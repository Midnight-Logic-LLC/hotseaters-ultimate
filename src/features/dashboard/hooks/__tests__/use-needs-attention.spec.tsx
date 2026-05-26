import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseClientsList = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/auth/hooks/use-current-user', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
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
import {
  useNeedsAttention,
  __setLeadRadarAvailableForTests,
} from '../use-needs-attention';

const mockUseEntities = vi.mocked(useEntities);

const NOW = new Date(2026, 2, 15);
const tier1 = { company: { id: 'co', name: 'Co' } };

beforeEach(() => {
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
  mockUseEntities.mockImplementation((type: string) => {
    if (type === 'Lead') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'SalesActivity') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    if (type === 'Attorney') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
  });
});

describe('useNeedsAttention', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    expect(result.current.myCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });

  it('counts mine vs total via Phase A stale-leads rule', async () => {
    const leads = [
      { id: 'l1', attorney_id: 'a-mine' }, // mine, no activity -> stale
      { id: 'l2', attorney_id: 'a-other' }, // theirs, overdue -> stale
      { id: 'l3', attorney_id: 'a-mine' }, // mine, future activity -> fresh
    ];
    const activities = [
      { id: 'act1', lead_id: 'l2', scheduled_date: '2026-03-01', status: 'pending' }, // overdue
      { id: 'act2', lead_id: 'l3', scheduled_date: '2026-03-20', status: 'pending' }, // future
    ];
    const attorneys = [
      { id: 'a-mine', client_id: 'cl-mine' },
      { id: 'a-other', client_id: 'cl-other' },
    ];
    mockUseEntities.mockImplementation((type: string) => {
      if (type === 'Lead') return { items: leads, isLoading: false, isError: false, error: null, refetch: vi.fn() };
      if (type === 'SalesActivity') return { items: activities, isLoading: false, isError: false, error: null, refetch: vi.fn() };
      if (type === 'Attorney') return { items: attorneys, isLoading: false, isError: false, error: null, refetch: vi.fn() };
      return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    });
    const { result } = renderHook(() => useNeedsAttention({ now: NOW }));
    await waitFor(() => {
      expect(result.current.totalCount).toBeGreaterThan(0);
    });
    // l1 stale + mine, l2 stale + theirs. l3 fresh.
    expect(result.current.totalCount).toBe(2);
    expect(result.current.myCount).toBe(1);
  });
});
