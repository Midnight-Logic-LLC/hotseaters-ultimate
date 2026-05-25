import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockFetchInvoicesForCompany = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
}));

vi.mock('@/features/invoices/stores/invoices-store', () => ({
  fetchInvoicesForCompany: (...args: unknown[]) =>
    mockFetchInvoicesForCompany(...args),
}));

import { useRecentActivity } from '../use-recent-activity';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const tier1 = { company: { id: 'co', name: 'Co' } };

const trials = [
  { id: 't-old', company_id: 'co', case_name: 'Old Win', won_date: '2025-12-01' },
  { id: 't-new', company_id: 'co', case_name: 'New Win', won_date: '2026-03-15' },
  { id: 't-mid', company_id: 'co', case_name: 'Mid Win', won_date: '2026-02-10' },
  { id: 't-open', company_id: 'co', case_name: 'Open Deal', won_date: null }, // no win
];

beforeEach(() => {
  resetGraphStore();
  mockUseTier1.mockImplementation(() => tier1);
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
  mockFetchInvoicesForCompany.mockReset();
  mockFetchInvoicesForCompany.mockResolvedValue([]);
});

describe('useRecentActivity — recentlyWon', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null }));
    mockUseTrialsList.mockReturnValue({ items: [], isLoading: false });
    const { result } = renderHook(() => useRecentActivity());
    expect(result.current.recentlyWon).toHaveLength(0);
  });

  it('returns top 3 wins sorted by won_date desc', () => {
    const { result } = renderHook(() => useRecentActivity());
    expect(result.current.recentlyWon.map((w) => w.id)).toEqual(['t-new', 't-mid', 't-old']);
  });

  it('excludes trials with no won_date', () => {
    const { result } = renderHook(() => useRecentActivity());
    expect(result.current.recentlyWon.find((w) => w.id === 't-open')).toBeUndefined();
  });

  it('honours custom limit', () => {
    const { result } = renderHook(() => useRecentActivity({ limit: 2 }));
    expect(result.current.recentlyWon.map((w) => w.id)).toEqual(['t-new', 't-mid']);
  });
});

describe('useRecentActivity — recentInvoices (hybrid REST)', () => {
  it('fires remoteFetch and surfaces top N invoices', async () => {
    mockFetchInvoicesForCompany.mockResolvedValue([
      { id: 'i1', invoice_number: 'INV-001', total: 1000, status: 'paid', invoice_date: '2026-03-10' },
      { id: 'i2', invoice_number: 'INV-002', total: 500, status: 'sent', invoice_date: '2026-03-05' },
    ]);
    const { result } = renderHook(() => useRecentActivity());
    await waitFor(() => {
      expect(mockFetchInvoicesForCompany).toHaveBeenCalledWith(
        'co',
        expect.objectContaining({ orderBy: 'invoice_date_desc', limit: 3 }),
      );
      expect(result.current.recentInvoices.length).toBeGreaterThan(0);
    });
    expect(result.current.recentInvoices.map((r) => r.id).sort()).toEqual(['i1', 'i2']);
  });

  it('coerces null total to 0', async () => {
    mockFetchInvoicesForCompany.mockResolvedValue([
      { id: 'i-null', invoice_number: 'INV-X', total: null, status: 'draft', invoice_date: '2026-03-01' },
    ]);
    const { result } = renderHook(() => useRecentActivity());
    await waitFor(() => {
      expect(result.current.recentInvoices.length).toBeGreaterThan(0);
    });
    expect(result.current.recentInvoices[0]?.total).toBe(0);
  });
});
