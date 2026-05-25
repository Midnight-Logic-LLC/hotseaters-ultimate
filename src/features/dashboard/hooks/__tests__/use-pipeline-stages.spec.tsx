import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

const mockUseTier1 = vi.fn();
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

import { useDashboardPipelineStages } from '../use-pipeline-stages';

const stages: PipelineStage[] = [
  { id: 's1', name: 'Lead', type: 'sales', revenue_probability: 0.2, is_active: true, order: 1, company_id: null },
  { id: 's2', name: 'Proposal', type: 'sales', revenue_probability: 0.5, is_active: true, order: 2, company_id: null },
  { id: 'o1', name: 'In Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
  { id: 'u1', name: 'Untyped', type: '', revenue_probability: 1, is_active: true, order: 3, company_id: null },
];

beforeEach(() => {
  mockUseTier1.mockReturnValue({ pipelineStages: stages });
});

describe('useDashboardPipelineStages', () => {
  it('returns all stages when no filter is given', () => {
    const { result } = renderHook(() => useDashboardPipelineStages());
    expect(result.current).toHaveLength(4);
    expect(result.current.map((s) => s.id)).toEqual(['s1', 's2', 'o1', 'u1']);
  });

  it('filters to sales stages only', () => {
    const { result } = renderHook(() => useDashboardPipelineStages({ type: 'sales' }));
    expect(result.current.map((s) => s.id)).toEqual(['s1', 's2']);
  });

  it('filters to operations stages only', () => {
    const { result } = renderHook(() => useDashboardPipelineStages({ type: 'operations' }));
    expect(result.current.map((s) => s.id)).toEqual(['o1']);
  });

  it('returns the same stable reference when an empty list is empty', () => {
    mockUseTier1.mockReturnValue({ pipelineStages: [] });
    const { result, rerender } = renderHook(() => useDashboardPipelineStages());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(result.current).toHaveLength(0);
  });
});
