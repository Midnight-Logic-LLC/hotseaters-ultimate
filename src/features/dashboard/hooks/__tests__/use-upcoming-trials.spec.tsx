import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockUseClientsList = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));
vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
}));
vi.mock('@/features/clients/hooks/use-clients-list', () => ({
  useClientsList: () => mockUseClientsList(),
}));

import { useUpcomingTrials } from '../use-upcoming-trials';

const NOW = new Date('2026-03-15T12:00:00Z');

const stages: PipelineStage[] = [
  { id: 'sales', name: 'Lead', type: 'sales', revenue_probability: 0.1, is_active: true, order: 1, company_id: null },
  { id: 'prep', name: 'In Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
  { id: 'trial', name: 'In Trial', type: 'operations', revenue_probability: 1, is_active: true, order: 2, company_id: null },
];

const trials = [
  // ops, future Apr 1 — upcoming
  { id: 't-apr', company_id: 'co', case_name: 'Acme v. Doe', pipeline_stage_id: 'prep', start_date: '2026-04-01', client_id: 'cl-acme', completion_type: null },
  // ops, future Mar 25 — upcoming, earlier
  { id: 't-mar25', company_id: 'co', case_name: 'Beta v. Roe', pipeline_stage_id: 'prep', start_date: '2026-03-25', client_id: 'cl-beta', completion_type: null },
  // ops, past — NOT upcoming
  { id: 't-past', company_id: 'co', case_name: 'Old', pipeline_stage_id: 'prep', start_date: '2026-02-01', client_id: 'cl-acme', completion_type: null },
  // sales stage — NOT included
  { id: 't-sales', company_id: 'co', case_name: 'Sales', pipeline_stage_id: 'sales', start_date: '2026-05-01', client_id: 'cl-acme', completion_type: null },
  // completed — NOT included
  { id: 't-done', company_id: 'co', case_name: 'Done', pipeline_stage_id: 'prep', start_date: '2026-04-15', client_id: 'cl-acme', completion_type: 'won' },
  // future May 10 — upcoming
  { id: 't-may', company_id: 'co', case_name: 'Gamma v. Sue', pipeline_stage_id: 'trial', start_date: '2026-05-10', client_id: null, completion_type: null },
];

const clients = [
  { id: 'cl-acme', firm_name: 'Acme LLP' },
  { id: 'cl-beta', firm_name: 'Beta PA' },
];

beforeEach(() => {
  mockUseTier1.mockReturnValue({ company: { id: 'co' }, pipelineStages: stages });
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
  mockUseClientsList.mockReturnValue({ clients, isLoading: false });
});

describe('useUpcomingTrials', () => {
  it('returns empty when no company', () => {
    mockUseTier1.mockReturnValue({ company: null, pipelineStages: [] });
    const { result } = renderHook(() => useUpcomingTrials({ now: NOW }));
    expect(result.current.items).toHaveLength(0);
  });

  it('filters to operations-stage trials with future start dates, sorted asc', () => {
    const { result } = renderHook(() => useUpcomingTrials({ now: NOW }));
    expect(result.current.items.map((r) => r.id)).toEqual(['t-mar25', 't-apr', 't-may']);
  });

  it('joins client firm_name when client exists, otherwise null', () => {
    const { result } = renderHook(() => useUpcomingTrials({ now: NOW }));
    const byId = new Map(result.current.items.map((r) => [r.id, r]));
    expect(byId.get('t-mar25')?.client_firm_name).toBe('Beta PA');
    expect(byId.get('t-apr')?.client_firm_name).toBe('Acme LLP');
    expect(byId.get('t-may')?.client_firm_name).toBeNull();
  });

  it('honours the limit option (default 5, smaller works)', () => {
    const { result } = renderHook(() => useUpcomingTrials({ now: NOW, limit: 2 }));
    expect(result.current.items.map((r) => r.id)).toEqual(['t-mar25', 't-apr']);
  });

  it('surfaces combined loading state from trials + clients', () => {
    mockUseTrialsList.mockReturnValue({ items: [], isLoading: true });
    mockUseClientsList.mockReturnValue({ clients: [], isLoading: false });
    const { result } = renderHook(() => useUpcomingTrials({ now: NOW }));
    expect(result.current.isLoading).toBe(true);
  });
});
