import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { PipelineStage, LookupRow } from '@/shared/db/lookups-selectors';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockFetchTrialServicesForCompany = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
}));

vi.mock('@/features/trials/stores/trials-store', () => ({
  fetchTrialServicesForCompany: (...args: unknown[]) =>
    mockFetchTrialServicesForCompany(...args),
}));

import { useTrialProjections } from '../use-trial-projections';

/** Reset the entity-graph store between tests so useEntityList queryKeys
 * don't carry stale ids/lists across cases. */
function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const stages: PipelineStage[] = [
  { id: 'sales', name: 'Lead', type: 'sales', revenue_probability: 0.5, is_active: true, order: 1, company_id: null },
  { id: 'prep', name: 'In Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
];

const services: LookupRow[] = [
  { id: 'svc-1', name: 'Trial Tech', is_active: true, order: 1, company_id: null, extra_schema: null },
];

const trials = [
  {
    id: 't1',
    company_id: 'co',
    pipeline_stage_id: 'prep',
    start_date: '2026-03-15',
    bill_for_weekends: true,
  },
];

const trialServices = [
  {
    id: 'ts1',
    company_id: 'co',
    trial_id: 't1',
    service_id: 'svc-1',
    start_date: '2026-03-01',
    end_date: '2026-03-03',
    projected_daily_revenue: 100,
  },
];

beforeEach(() => {
  resetGraphStore();
  mockFetchTrialServicesForCompany.mockReset();
  mockFetchTrialServicesForCompany.mockResolvedValue(trialServices);
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
});

describe('useTrialProjections', () => {
  it('returns empty map when no company', () => {
    const emptyTier1 = { company: null, pipelineStages: [], serviceCategories: [] };
    mockUseTier1.mockImplementation(() => emptyTier1);
    const { result } = renderHook(() => useTrialProjections());
    expect(result.current.projectedInvoices.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('builds the projected-invoice map via Phase A trial-projections', async () => {
    const perTrialCompany = {
      id: 'co',
      name: 'Co',
      invoice_period: 'per_trial',
      per_trial_billing_days_after_end: 7,
    };
    const perTrialTier1 = {
      company: perTrialCompany,
      pipelineStages: stages,
      serviceCategories: services,
    };
    mockUseTier1.mockImplementation(() => perTrialTier1);
    const { result } = renderHook(() => useTrialProjections());
    await waitFor(() => {
      expect(mockFetchTrialServicesForCompany).toHaveBeenCalledWith('co');
      expect(result.current.projectedInvoices.size).toBeGreaterThan(0);
    });
    // 3 days * $100 = $300 billed on Mar 3 + 7 days = Mar 10
    expect(result.current.projectedInvoices.get('2026-03-10')).toBe(300);
  });

  it('honours monthly billing_period bucket', async () => {
    const monthlyCompany = {
      id: 'co',
      name: 'Co',
      invoice_period: 'monthly',
      monthly_billing_date: 1,
    };
    const monthlyTier1 = {
      company: monthlyCompany,
      pipelineStages: stages,
      serviceCategories: services,
    };
    // Stable identity across re-renders — return the same reference.
    mockUseTier1.mockImplementation(() => monthlyTier1);
    const monthlyTrialServices = [
      {
        id: 'ts1',
        company_id: 'co',
        trial_id: 't1',
        service_id: 'svc-1',
        start_date: '2026-03-29',
        end_date: '2026-03-31',
        projected_daily_revenue: 100,
      },
    ];
    mockFetchTrialServicesForCompany.mockResolvedValue(monthlyTrialServices);
    const { result } = renderHook(() => useTrialProjections());
    await waitFor(() => {
      expect(result.current.projectedInvoices.size).toBeGreaterThan(0);
    });
    // 3 days * $100 = $300 billed on Apr 1
    expect(result.current.projectedInvoices.get('2026-04-01')).toBe(300);
  });
});
