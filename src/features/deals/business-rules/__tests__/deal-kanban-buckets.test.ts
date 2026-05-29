import { describe, it, expect } from 'vitest';
import {
  nextStepBucket,
  trialDateBucket,
  bucketItemsIntoColumns,
  buildSalesStageColumns,
  columnsForViewMode,
  stageColorToCss,
  NEXT_STEP_COLUMNS,
  TRIAL_DATE_COLUMNS,
  type KanbanItem,
} from '../deal-kanban-buckets';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

const TODAY = new Date('2026-05-29T12:00:00');

function deal(partial: Partial<KanbanItem> & { id: string }): KanbanItem {
  return { __kind: 'deal', __nextFollowUpDate: null, ...partial };
}

describe('nextStepBucket', () => {
  it('returns needsAttention when no follow-up date', () => {
    expect(nextStepBucket(deal({ id: 'a' }), TODAY)).toBe('needsAttention');
  });

  it('returns needsAttention when follow-up is in the past or today', () => {
    expect(nextStepBucket(deal({ id: 'a', __nextFollowUpDate: '2026-05-20' }), TODAY)).toBe('needsAttention');
    expect(nextStepBucket(deal({ id: 'a', __nextFollowUpDate: '2026-05-29' }), TODAY)).toBe('needsAttention');
  });

  it('buckets within 7 days as dueSoon', () => {
    expect(nextStepBucket(deal({ id: 'a', __nextFollowUpDate: '2026-06-04' }), TODAY)).toBe('dueSoon');
  });

  it('buckets 8–30 days as onDeck', () => {
    expect(nextStepBucket(deal({ id: 'a', __nextFollowUpDate: '2026-06-20' }), TODAY)).toBe('onDeck');
  });

  it('buckets 30+ days as planned', () => {
    expect(nextStepBucket(deal({ id: 'a', __nextFollowUpDate: '2026-08-01' }), TODAY)).toBe('planned');
  });
});

describe('trialDateBucket', () => {
  it('returns future when daysUntilTrial is missing or non-finite', () => {
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: null }))).toBe('future');
    expect(trialDateBucket(deal({ id: 'a' }))).toBe('future');
  });

  it('buckets < 10 days as urgent', () => {
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 9 }))).toBe('urgent');
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 0 }))).toBe('urgent');
  });

  it('buckets 10–30 days as warning', () => {
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 10 }))).toBe('warning');
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 30 }))).toBe('warning');
  });

  it('buckets 31–90 days as upcoming', () => {
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 31 }))).toBe('upcoming');
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 90 }))).toBe('upcoming');
  });

  it('buckets 90+ days as future', () => {
    expect(trialDateBucket(deal({ id: 'a', daysUntilTrial: 91 }))).toBe('future');
  });
});

describe('buildSalesStageColumns', () => {
  const stages: PipelineStage[] = [
    { id: 's2', name: 'LOE Sent', type: 'sales', revenue_probability: 1, is_active: true, order: 2, company_id: null },
    { id: 's1', name: 'Lead', type: 'sales', revenue_probability: 1, is_active: true, order: 1, company_id: null },
    { id: 'op1', name: 'In Trial', type: 'operations', revenue_probability: 1, is_active: true, order: 1, company_id: null },
    { id: 's3', name: 'Inactive', type: 'sales', revenue_probability: 1, is_active: false, order: 3, company_id: null },
  ];

  it('keeps only active sales stages, sorted by order', () => {
    const cols = buildSalesStageColumns(stages);
    expect(cols.map((c) => c.label)).toEqual(['Lead', 'LOE Sent']);
    expect(cols[0]?.stageId).toBe('s1');
    expect(cols[0]?.key).toBe('stage-s1');
  });
});

describe('columnsForViewMode', () => {
  it('returns static configs for next_step and trial_date', () => {
    expect(columnsForViewMode('next_step', [])).toHaveLength(NEXT_STEP_COLUMNS.length);
    expect(columnsForViewMode('trial_date', [])).toHaveLength(TRIAL_DATE_COLUMNS.length);
  });
});

describe('stageColorToCss', () => {
  it('passes through hex, wraps token names, defaults when empty', () => {
    expect(stageColorToCss('#abc')).toBe('#abc');
    expect(stageColorToCss('brand-primary')).toBe('var(--theme-brand-primary)');
    expect(stageColorToCss(null)).toBe('var(--theme-stone-500)');
  });
});

describe('bucketItemsIntoColumns', () => {
  it('places trial_date items into the correct columns and sorts by proximity', () => {
    const items = [
      deal({ id: 'far', daysUntilTrial: 95 }),
      deal({ id: 'soon', daysUntilTrial: 5 }),
      deal({ id: 'mid', daysUntilTrial: 20 }),
      deal({ id: 'soon2', daysUntilTrial: 2 }),
    ];
    const cols = columnsForViewMode('trial_date', []);
    const buckets = bucketItemsIntoColumns(items, cols, 'trial_date', TODAY);
    expect(buckets.urgent?.map((d) => d.id)).toEqual(['soon2', 'soon']);
    expect(buckets.warning?.map((d) => d.id)).toEqual(['mid']);
    expect(buckets.future?.map((d) => d.id)).toEqual(['far']);
  });

  it('routes sales_stage items by pipeline_stage_id, falling back to first column', () => {
    const stages: PipelineStage[] = [
      { id: 's1', name: 'Lead', type: 'sales', revenue_probability: 1, is_active: true, order: 1, company_id: null },
      { id: 's2', name: 'LOE Sent', type: 'sales', revenue_probability: 1, is_active: true, order: 2, company_id: null },
    ];
    const cols = columnsForViewMode('sales_stage', stages);
    const items = [
      deal({ id: 'a', pipeline_stage_id: 's2' }),
      deal({ id: 'b', pipeline_stage_id: 'unknown' }),
    ];
    const buckets = bucketItemsIntoColumns(items, cols, 'sales_stage', TODAY);
    expect(buckets['stage-s2']?.map((d) => d.id)).toEqual(['a']);
    // unknown stage falls back to the first column
    expect(buckets['stage-s1']?.map((d) => d.id)).toEqual(['b']);
  });

  it('next_step sorts dated items before undated, undated by trial proximity', () => {
    const items = [
      deal({ id: 'undated', daysUntilTrial: 5 }),
      deal({ id: 'dated', __nextFollowUpDate: '2026-05-20' }),
      deal({ id: 'undated-far', daysUntilTrial: 40 }),
    ];
    const cols = columnsForViewMode('next_step', []);
    const buckets = bucketItemsIntoColumns(items, cols, 'next_step', TODAY);
    // 'dated' (overdue) and the undated cards all land in needsAttention
    expect(buckets.needsAttention?.map((d) => d.id)).toEqual(['dated', 'undated', 'undated-far']);
  });
});
