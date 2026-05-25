import { describe, expect, it } from 'vitest';
import {
  activeDeals,
  activeStagesOfType,
  activeTrials,
  computePipelineValue,
  dealsByStage,
  indexStages,
  trialsByStage,
  upcomingTrialsFrom,
} from '../pipeline-aggregation';

const stages = [
  { id: 'lead', name: 'Lead', type: 'sales', is_active: true, revenue_probability: 0.1 },
  { id: 'proposal', name: 'Proposal Sent', type: 'sales', is_active: true, revenue_probability: 0.5 },
  { id: 'closed-old', name: 'Closed', type: 'sales', is_active: false, revenue_probability: 1.0 },
  { id: 'in-prep', name: 'In Prep', type: 'operations', is_active: true, revenue_probability: 1.0 },
  { id: 'in-trial', name: 'In Trial', type: 'operations', is_active: true, revenue_probability: 1.0 },
];

const trials = [
  { id: 't1', pipeline_stage_id: 'lead', estimated_value: 100_000 },
  { id: 't2', pipeline_stage_id: 'proposal', estimated_value: 50_000 },
  { id: 't3', pipeline_stage_id: 'proposal', estimated_value: 25_000, completion_type: 'won' },
  { id: 't4', pipeline_stage_id: 'in-prep', estimated_value: 0, start_date: '2026-04-01' },
  { id: 't5', pipeline_stage_id: 'in-trial', estimated_value: 0, start_date: '2026-02-01' },
  { id: 't6', pipeline_stage_id: 'in-prep', estimated_value: 0, start_date: '2026-05-15' },
];

const NOW = new Date('2026-03-15T12:00:00Z');

describe('indexStages', () => {
  it('builds normalized map', () => {
    const idx = indexStages(stages);
    expect(idx.get('lead')?.probability).toBe(0.1);
    expect(idx.get('closed-old')?.isActive).toBe(false);
  });
  it('falls back to stage_type when type is missing', () => {
    const idx = indexStages([{ id: 'x', stage_type: 'sales' }]);
    expect(idx.get('x')?.type).toBe('sales');
  });
  it('defaults probability to 1', () => {
    const idx = indexStages([{ id: 'x', type: 'sales' }]);
    expect(idx.get('x')?.probability).toBe(1);
  });
});

describe('activeStagesOfType', () => {
  it('returns only active sales stages', () => {
    expect(activeStagesOfType(stages, 'sales').map((s) => s.id)).toEqual(['lead', 'proposal']);
  });
  it('returns only active operations stages', () => {
    expect(activeStagesOfType(stages, 'operations').map((s) => s.id)).toEqual(['in-prep', 'in-trial']);
  });
});

describe('activeDeals', () => {
  it('excludes completed and non-sales', () => {
    const r = activeDeals(trials, stages);
    expect(r.map((t) => t.id).sort()).toEqual(['t1', 't2']);
  });
});

describe('activeTrials', () => {
  it('includes only operations stages without completion_type', () => {
    const r = activeTrials(trials, stages);
    expect(r.map((t) => t.id).sort()).toEqual(['t4', 't5', 't6']);
  });
});

describe('upcomingTrialsFrom', () => {
  it('filters strictly future start dates', () => {
    const active = activeTrials(trials, stages);
    expect(upcomingTrialsFrom(active, NOW).map((t) => t.id).sort()).toEqual(['t4', 't6']);
  });
});

describe('computePipelineValue', () => {
  it('computes raw + weighted + count', () => {
    const r = computePipelineValue(activeDeals(trials, stages), stages);
    expect(r.raw).toBe(150_000);
    expect(r.weighted).toBe(100_000 * 0.1 + 50_000 * 0.5); // 35,000
    expect(r.dealCount).toBe(2);
  });
});

describe('dealsByStage', () => {
  it('groups + sums per active sales stage', () => {
    const r = dealsByStage(activeDeals(trials, stages), activeStagesOfType(stages, 'sales'));
    expect(r).toEqual([
      { id: 'lead', name: 'Lead', count: 1, value: 100_000 },
      { id: 'proposal', name: 'Proposal Sent', count: 1, value: 50_000 },
    ]);
  });
});

describe('trialsByStage', () => {
  it('counts trials per operations stage', () => {
    const r = trialsByStage(activeTrials(trials, stages), activeStagesOfType(stages, 'operations'));
    expect(r).toEqual([
      { id: 'in-prep', name: 'In Prep', count: 2 },
      { id: 'in-trial', name: 'In Trial', count: 1 },
    ]);
  });
});
