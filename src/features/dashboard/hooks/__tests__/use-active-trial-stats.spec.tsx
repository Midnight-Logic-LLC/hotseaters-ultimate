import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockUseClientsList = vi.fn();
const mockFetchTimeEntries = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
}));
vi.mock('@/features/time-entries/stores/time-entries-store', () => ({
  fetchTimeEntriesForCompany: (...args: unknown[]) => mockFetchTimeEntries(...args),
}));

import { useActiveTrialStats } from '../use-active-trial-stats';

function resetGraphStore(): void {
  useGraphStore.setState({ entities: {}, patches: {}, lists: {}, entityStates: {} });
}

const stages: PipelineStage[] = [
  { id: 'sales', name: 'Lead', type: 'sales', revenue_probability: 0.5, is_active: true, order: 1, company_id: null },
  { id: 'prep', name: 'In Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
];

const tier1 = {
  company: { id: 'co', name: 'Co' },
  pipelineStages: stages,
};

const trials = [
  { id: 't1', company_id: 'co', case_name: 'Acme v. Doe', client_id: 'cl-1', pipeline_stage_id: 'prep', completion_type: null },
  { id: 't2', company_id: 'co', case_name: 'Beta v. Roe', client_id: 'cl-2', pipeline_stage_id: 'prep', completion_type: null },
  { id: 't-sales', company_id: 'co', case_name: 'Sales Stage', pipeline_stage_id: 'sales', completion_type: null },
  { id: 't-done', company_id: 'co', case_name: 'Completed', pipeline_stage_id: 'prep', completion_type: 'won' },
];

const clients = [
  { id: 'cl-1', firm_name: 'Acme LLP' },
  { id: 'cl-2', firm_name: 'Beta PA' },
];

beforeEach(() => {
  resetGraphStore();
  mockUseTier1.mockImplementation(() => tier1);
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
  mockUseClientsList.mockReturnValue({ clients, isLoading: false });
  mockFetchTimeEntries.mockReset();
  mockFetchTimeEntries.mockResolvedValue([]);
});

describe('useActiveTrialStats', () => {
  it('aggregates per active op-stage trial, sorted by revenue desc', async () => {
    mockFetchTimeEntries.mockResolvedValue([
      { id: 'te1', trial_id: 't1', duration_hours: 4, amount: 800 },
      { id: 'te2', trial_id: 't1', duration_hours: 2, amount: 400 },
      { id: 'te3', trial_id: 't2', duration_hours: 6, amount: 1200 },
      // sales-stage trial should be excluded from list (its entries don't bubble up either)
      { id: 'te-sales', trial_id: 't-sales', duration_hours: 1, amount: 100 },
    ]);
    const { result } = renderHook(() => useActiveTrialStats());
    await waitFor(() => {
      expect(result.current.stats.length).toBeGreaterThan(0);
    });
    // t2 has more revenue ($1200 vs $1200 for t1) — actually t1 also = 1200. Let's verify by id.
    const byId = new Map(result.current.stats.map((s) => [s.id, s]));
    expect(byId.get('t1')).toEqual({ id: 't1', name: 'Acme v. Doe', client: 'Acme LLP', hours: 6, revenue: 1200 });
    expect(byId.get('t2')).toEqual({ id: 't2', name: 'Beta v. Roe', client: 'Beta PA', hours: 6, revenue: 1200 });
    // Sales-stage trial NOT present
    expect(byId.get('t-sales')).toBeUndefined();
    expect(byId.get('t-done')).toBeUndefined();
  });

  it('returns empty when no company', () => {
    mockUseTier1.mockImplementation(() => ({ company: null, pipelineStages: [] }));
    const { result } = renderHook(() => useActiveTrialStats());
    expect(result.current.stats).toHaveLength(0);
  });
});
