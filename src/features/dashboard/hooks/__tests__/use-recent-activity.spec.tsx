import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
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
import { useRecentActivity } from '../use-recent-activity';

const mockUseEntities = vi.mocked(useEntities);

const tier1 = { company: { id: 'co', name: 'Co' } };

const trials = [
  { id: 't-old', company_id: 'co', case_name: 'Old Win', won_date: '2025-12-01' },
  { id: 't-new', company_id: 'co', case_name: 'New Win', won_date: '2026-03-15' },
  { id: 't-mid', company_id: 'co', case_name: 'Mid Win', won_date: '2026-02-10' },
  { id: 't-open', company_id: 'co', case_name: 'Open Deal', won_date: null }, // no win
];

beforeEach(() => {
  mockUseTier1.mockImplementation(() => tier1);
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
  mockUseEntities.mockImplementation((type: string) => {
    if (type === 'Invoice') return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
  });
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

describe('useRecentActivity — recentInvoices (useEntities)', () => {
  it('surfaces top N invoices from useEntities', async () => {
    const invoiceData = [
      { id: 'i1', invoice_number: 'INV-001', total: 1000, status: 'paid', invoice_date: '2026-03-10' },
      { id: 'i2', invoice_number: 'INV-002', total: 500, status: 'sent', invoice_date: '2026-03-05' },
    ];
    mockUseEntities.mockImplementation((type: string) => {
      if (type === 'Invoice') return { items: invoiceData, isLoading: false, isError: false, error: null, refetch: vi.fn() };
      return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    });
    const { result } = renderHook(() => useRecentActivity());
    await waitFor(() => {
      expect(result.current.recentInvoices.length).toBeGreaterThan(0);
    });
    expect(result.current.recentInvoices.map((r) => r.id).sort()).toEqual(['i1', 'i2']);
  });

  it('coerces null total to 0', async () => {
    mockUseEntities.mockImplementation((type: string) => {
      if (type === 'Invoice') return {
        items: [{ id: 'i-null', invoice_number: 'INV-X', total: null, status: 'draft', invoice_date: '2026-03-01' }],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      };
      return { items: [], isLoading: false, isError: false, error: null, refetch: vi.fn() };
    });
    const { result } = renderHook(() => useRecentActivity());
    await waitFor(() => {
      expect(result.current.recentInvoices.length).toBeGreaterThan(0);
    });
    expect(result.current.recentInvoices[0]?.total).toBe(0);
  });
});
