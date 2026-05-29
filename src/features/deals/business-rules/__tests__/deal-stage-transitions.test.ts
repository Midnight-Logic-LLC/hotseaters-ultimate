import { describe, it, expect } from 'vitest';
import type { PipelineStage } from '@/shared/db/lookups-selectors';
import {
  isDealStage,
  isOperationsStage,
  firstStageOfType,
  lastStageOfType,
  resolveWonStageId,
  resolveRestoredDealStageId,
  resolveRevertToDealStageId,
  resolveRestoredTrialStageId,
} from '../deal-stage-transitions';

function stage(p: Partial<PipelineStage> & Pick<PipelineStage, 'id' | 'type' | 'order'>): PipelineStage {
  return {
    name: p.id,
    revenue_probability: 1,
    is_active: true,
    company_id: null,
    ...p,
  };
}

// sales: s1(order1) s2(order2) ; operations: o1(order1) o2(order2)
const STAGES: PipelineStage[] = [
  stage({ id: 's1', type: 'sales', order: 1 }),
  stage({ id: 's2', type: 'sales', order: 2 }),
  stage({ id: 'o1', type: 'operations', order: 1 }),
  stage({ id: 'o2', type: 'operations', order: 2 }),
];

describe('deal-stage-transitions — classification', () => {
  it('isDealStage true for sales stage, false for ops/unknown/null', () => {
    expect(isDealStage('s1', STAGES)).toBe(true);
    expect(isDealStage('o1', STAGES)).toBe(false);
    expect(isDealStage('nope', STAGES)).toBe(false);
    expect(isDealStage(null, STAGES)).toBe(false);
  });

  it('isOperationsStage true for ops stage only', () => {
    expect(isOperationsStage('o2', STAGES)).toBe(true);
    expect(isOperationsStage('s2', STAGES)).toBe(false);
    expect(isOperationsStage(undefined, STAGES)).toBe(false);
  });
});

describe('deal-stage-transitions — first/last by order', () => {
  it('firstStageOfType returns lowest order', () => {
    expect(firstStageOfType('sales', STAGES)?.id).toBe('s1');
    expect(firstStageOfType('operations', STAGES)?.id).toBe('o1');
  });
  it('lastStageOfType returns highest order', () => {
    expect(lastStageOfType('sales', STAGES)?.id).toBe('s2');
    expect(lastStageOfType('operations', STAGES)?.id).toBe('o2');
  });
  it('returns null when no stage of type', () => {
    expect(firstStageOfType('operations', [stage({ id: 's1', type: 'sales', order: 1 })])).toBeNull();
  });
  it('does not mutate the input array', () => {
    const input = [...STAGES];
    firstStageOfType('sales', input);
    expect(input.map((s) => s.id)).toEqual(['s1', 's2', 'o1', 'o2']);
  });
});

describe('deal-stage-transitions — transition resolvers (RULE J / bible parity)', () => {
  it('won → first operations stage', () => {
    expect(resolveWonStageId(STAGES)).toBe('o1');
  });
  it('won throws when no operations stage', () => {
    expect(() => resolveWonStageId([stage({ id: 's1', type: 'sales', order: 1 })])).toThrow(
      'No operations pipeline stages configured',
    );
  });
  it('restore lost deal → first sales stage', () => {
    expect(resolveRestoredDealStageId(STAGES)).toBe('s1');
  });
  it('restore deal throws when no sales stage', () => {
    expect(() => resolveRestoredDealStageId([stage({ id: 'o1', type: 'operations', order: 1 })])).toThrow(
      'No sales pipeline stages configured',
    );
  });
  it('revert won trial → last sales stage', () => {
    expect(resolveRevertToDealStageId(STAGES)).toBe('s2');
  });
  it('restore trial → last operations stage when not already ops', () => {
    expect(resolveRestoredTrialStageId('s1', STAGES)).toBe('o2');
  });
  it('restore trial → null (no change) when already at an ops stage', () => {
    expect(resolveRestoredTrialStageId('o1', STAGES)).toBeNull();
  });
  it('restore trial → null when no ops stage configured and not ops', () => {
    expect(resolveRestoredTrialStageId('s1', [stage({ id: 's1', type: 'sales', order: 1 })])).toBeNull();
  });
});
