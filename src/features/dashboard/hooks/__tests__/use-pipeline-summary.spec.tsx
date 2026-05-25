import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

// Mock the upstream hooks BEFORE importing the unit under test.
const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();

vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: (...args: unknown[]) => mockUseTrialsList(...args),
}));

import { usePipelineSummary } from '../use-pipeline-summary';

// Two active sales stages + one operations stage we shouldn't see.
const stages: PipelineStage[] = [
  { id: 's-lead', name: 'Lead', type: 'sales', revenue_probability: 0.1, is_active: true, order: 1, company_id: null },
  { id: 's-prop', name: 'Proposal', type: 'sales', revenue_probability: 0.5, is_active: true, order: 2, company_id: null },
  { id: 'o-prep', name: 'In Prep', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
];

const trials = [
  // deal A in Lead stage, $100k
  { id: 't1', company_id: 'co', pipeline_stage_id: 's-lead', estimated_value: 100_000, completion_type: null },
  // deal B in Proposal stage, $50k
  { id: 't2', company_id: 'co', pipeline_stage_id: 's-prop', estimated_value: 50_000, completion_type: null },
  // deal C completed — should NOT count
  { id: 't3', company_id: 'co', pipeline_stage_id: 's-prop', estimated_value: 999_999, completion_type: 'won' },
  // trial D in operations stage — should NOT count toward sales pipeline
  { id: 't4', company_id: 'co', pipeline_stage_id: 'o-prep', estimated_value: 0, completion_type: null },
];

beforeEach(() => {
  mockUseTier1.mockReturnValue({
    company: { id: 'co' },
    pipelineStages: stages,
  });
  mockUseTrialsList.mockReturnValue({ items: trials, isLoading: false });
});

describe('usePipelineSummary', () => {
  it('returns zero summary when no company is loaded', () => {
    mockUseTier1.mockReturnValue({ company: null, pipelineStages: [] });
    mockUseTrialsList.mockReturnValue({ items: [], isLoading: false });
    const { result } = renderHook(() => usePipelineSummary());
    expect(result.current.pipelineValue).toBe(0);
    expect(result.current.weightedValue).toBe(0);
    expect(result.current.dealCount).toBe(0);
    expect(result.current.dealsByStage).toEqual([]);
  });

  it('computes bible-matched raw + weighted value over active sales deals', () => {
    const { result } = renderHook(() => usePipelineSummary());
    // raw  = 100_000 + 50_000 = 150_000
    // weighted = 100_000 * 0.1 + 50_000 * 0.5 = 10_000 + 25_000 = 35_000
    expect(result.current.pipelineValue).toBe(150_000);
    expect(result.current.weightedValue).toBe(35_000);
    expect(result.current.dealCount).toBe(2);
  });

  it('emits one bucket per active sales stage in stage order', () => {
    const { result } = renderHook(() => usePipelineSummary());
    expect(result.current.dealsByStage).toEqual([
      { id: 's-lead', name: 'Lead', count: 1, value: 100_000 },
      { id: 's-prop', name: 'Proposal', count: 1, value: 50_000 },
    ]);
  });

  it('excludes completed deals (completion_type set)', () => {
    const { result } = renderHook(() => usePipelineSummary());
    // t3 has completion_type='won' AND a $999,999 value — must NOT appear
    expect(result.current.dealsByStage.reduce((sum, b) => sum + b.value, 0)).toBe(150_000);
  });

  it('excludes operations-stage trials from sales pipeline math', () => {
    const { result } = renderHook(() => usePipelineSummary());
    // t4 is in 'o-prep' — should never count
    expect(result.current.dealsByStage.find((b) => b.id === 'o-prep')).toBeUndefined();
  });

  it('surfaces upstream loading state', () => {
    mockUseTrialsList.mockReturnValue({ items: [], isLoading: true });
    const { result } = renderHook(() => usePipelineSummary());
    expect(result.current.isLoading).toBe(true);
  });
});
