import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

const mockUseTier1 = vi.fn();
const mockUseTrialsList = vi.fn();
const mockUpdateTrial = vi.fn();
const mockDeleteTrial = vi.fn();

vi.mock('@/app/tier1-provider', () => ({ useTier1: () => mockUseTier1() }));
vi.mock('@/features/trials/hooks/use-trials-list', () => ({
  useTrialsList: () => mockUseTrialsList(),
}));
vi.mock('@/features/trials/stores/trials-store', () => ({
  updateTrial: (...a: unknown[]) => mockUpdateTrial(...a),
  deleteTrial: (...a: unknown[]) => mockDeleteTrial(...a),
}));

import { useDealsTrialsData } from '../use-deals-trials-data';

function stage(p: Partial<PipelineStage> & Pick<PipelineStage, 'id' | 'type' | 'order'>): PipelineStage {
  return { name: p.id, revenue_probability: 1, is_active: true, company_id: null, ...p };
}

const STAGES: PipelineStage[] = [
  stage({ id: 's1', type: 'sales', order: 1 }),
  stage({ id: 's2', type: 'sales', order: 2 }),
  stage({ id: 'o1', type: 'operations', order: 1 }),
  stage({ id: 'o2', type: 'operations', order: 2 }),
];

const TRIALS = [
  { id: 'd1', pipeline_stage_id: 's1' }, // deal
  { id: 'd2', pipeline_stage_id: 's2' }, // deal
  { id: 't1', pipeline_stage_id: 'o1' }, // trial (ops)
  { id: 'x1', pipeline_stage_id: null }, // neither
];

beforeEach(() => {
  vi.clearAllMocks();
  mockUseTier1.mockReturnValue({
    company: { id: 'co-1' },
    pipelineStages: STAGES,
    serviceCategories: [],
    consultantTiers: [],
    isLoading: false,
  });
  mockUseTrialsList.mockReturnValue({ items: TRIALS, isLoading: false, refetch: () => {} });
  mockUpdateTrial.mockResolvedValue({});
  mockDeleteTrial.mockResolvedValue(undefined);
});

describe('useDealsTrialsData — scope partitioning', () => {
  it('throws on invalid scope', () => {
    expect(() => renderHook(() => useDealsTrialsData({ scope: 'nope' as 'deals' }))).toThrow();
  });

  it("scope='deals' returns only sales-stage trials", () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    expect(result.current.scopedTrials.map((t) => t.id)).toEqual(['d1', 'd2']);
  });

  it("scope='trials' returns only operations-stage trials", () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'trials' }));
    expect(result.current.scopedTrials.map((t) => t.id)).toEqual(['t1']);
  });

  it('exposes all trials + tier-1 fields + companyId', () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    expect(result.current.trials).toHaveLength(4);
    expect(result.current.companyId).toBe('co-1');
    expect(result.current.pipelineStages).toBe(STAGES);
  });

  it('isLoading true when no company', () => {
    mockUseTier1.mockReturnValue({
      company: null,
      pipelineStages: STAGES,
      serviceCategories: [],
      consultantTiers: [],
      isLoading: false,
    });
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    expect(result.current.isLoading).toBe(true);
  });
});

describe('useDealsTrialsData — stage-transition actions (bible parity)', () => {
  it('updateStage writes the given pipeline_stage_id', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    await act(async () => result.current.updateStage('d1', 'o1'));
    expect(mockUpdateTrial).toHaveBeenCalledWith('d1', { pipeline_stage_id: 'o1' });
  });

  it('markAsWon → first ops stage + won_date (+ job number when given)', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    await act(async () => result.current.markAsWon('d1', 'JOB-001'));
    const [id, patch] = mockUpdateTrial.mock.calls[0]!;
    expect(id).toBe('d1');
    expect(patch.pipeline_stage_id).toBe('o1');
    expect(patch.job_number).toBe('JOB-001');
    expect(patch.won_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('restoreDeal → first sales stage + clears lost/completion', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    await act(async () => result.current.restoreDeal('d1'));
    expect(mockUpdateTrial).toHaveBeenCalledWith('d1', {
      pipeline_stage_id: 's1',
      lost_date: null,
      completion_type: null,
      completion_date: null,
    });
  });

  it('revertToDeal → last sales stage + clears won_date', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'trials' }));
    await act(async () => result.current.revertToDeal('t1'));
    expect(mockUpdateTrial).toHaveBeenCalledWith('t1', { pipeline_stage_id: 's2', won_date: null });
  });

  it('restoreTrial from a sales stage → last ops stage + clears completion', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'trials' }));
    await act(async () => result.current.restoreTrial('d1'));
    const [id, patch] = mockUpdateTrial.mock.calls[0]!;
    expect(id).toBe('d1');
    expect(patch.pipeline_stage_id).toBe('o2');
    expect(patch.completion_date).toBeNull();
  });

  it('deleteDeal calls deleteTrial', async () => {
    const { result } = renderHook(() => useDealsTrialsData({ scope: 'deals' }));
    await act(async () => result.current.deleteDeal('d1'));
    expect(mockDeleteTrial).toHaveBeenCalledWith('d1');
  });
});
