import { describe, expect, it } from 'vitest';
import {
  selectClientTypes,
  selectConsultantTiers,
  selectPipelineStages,
  selectServiceCategories,
  type EntitiesSlice,
} from '../lookups-selectors';

const COMPANY = 'co-current';
const OTHER = 'co-other';

interface RawRow {
  id: string;
  scope: string;
  name: string;
  order?: number;
  is_active?: string;
  extra_schema?: Record<string, unknown> | null;
  company_id?: string | null;
}

function build(rows: RawRow[]): EntitiesSlice {
  const out: Record<string, Record<string, unknown>> = {};
  for (const r of rows) {
    out[r.id] = {
      id: r.id,
      scope: r.scope,
      name: r.name,
      order: r.order ?? 0,
      is_active: r.is_active ?? 'true',
      extra_schema: r.extra_schema ?? null,
      company_id: r.company_id ?? null,
    };
  }
  return out;
}

describe('selectPipelineStages', () => {
  it('returns empty when slice is undefined', () => {
    expect(selectPipelineStages(undefined, COMPANY)).toEqual([]);
  });

  it('filters by scope, tenant, and active state; sorts by (order, name)', () => {
    const entities = build([
      { id: 'a', scope: 'pipeline_stage', name: 'Closed Won', order: 3, company_id: null },
      { id: 'b', scope: 'pipeline_stage', name: 'Prospect', order: 1, company_id: COMPANY },
      { id: 'c', scope: 'pipeline_stage', name: 'Qualification', order: 2, company_id: null },
      { id: 'd', scope: 'pipeline_stage', name: 'Other Co', order: 1, company_id: OTHER },
      { id: 'e', scope: 'service_category', name: 'SC', order: 1, company_id: null },
      { id: 'f', scope: 'pipeline_stage', name: 'Dropped', order: 4, is_active: 'false', company_id: null },
    ]);
    const r = selectPipelineStages(entities, COMPANY);
    expect(r.map((row) => row.id)).toEqual(['b', 'c', 'a']);
    // Other-tenant and inactive and different-scope all absent
    expect(r.find((row) => row.id === 'd')).toBeUndefined();
    expect(r.find((row) => row.id === 'e')).toBeUndefined();
    expect(r.find((row) => row.id === 'f')).toBeUndefined();
  });

  it('lifts type and revenue_probability from extra_schema with safe defaults', () => {
    const entities = build([
      {
        id: 'sales-1',
        scope: 'pipeline_stage',
        name: 'Prospect',
        order: 1,
        extra_schema: { type: 'sales', revenue_probability: 0.4 },
      },
      {
        id: 'ops-1',
        scope: 'pipeline_stage',
        name: 'Trial',
        order: 2,
        extra_schema: { type: 'operations' },
      },
      {
        id: 'unknown-1',
        scope: 'pipeline_stage',
        name: 'No Extras',
        order: 3,
        extra_schema: null,
      },
      {
        id: 'string-prob',
        scope: 'pipeline_stage',
        name: 'String Prob',
        order: 4,
        extra_schema: { type: 'sales', revenue_probability: '0.85' },
      },
    ]);
    const r = selectPipelineStages(entities, COMPANY);
    expect(r[0]).toMatchObject({ id: 'sales-1', type: 'sales', revenue_probability: 0.4 });
    expect(r[1]).toMatchObject({ id: 'ops-1', type: 'operations', revenue_probability: 1 });
    expect(r[2]).toMatchObject({ id: 'unknown-1', type: '', revenue_probability: 1 });
    expect(r[3]).toMatchObject({ id: 'string-prob', revenue_probability: 0.85 });
  });

  it('rejects malformed type strings', () => {
    const entities = build([
      { id: 'x', scope: 'pipeline_stage', name: 'X', extra_schema: { type: 'bogus' } },
    ]);
    expect(selectPipelineStages(entities, COMPANY)[0]?.type).toBe('');
  });
});

describe('selectServiceCategories', () => {
  it('filters by scope and tenant; sorts by (order, name)', () => {
    const entities = build([
      { id: 's1', scope: 'service_category', name: 'Strategy', order: 2, company_id: null },
      { id: 's2', scope: 'service_category', name: 'Trial Tech', order: 1, company_id: COMPANY },
      { id: 's3', scope: 'pipeline_stage', name: 'Not a Cat', order: 1 },
    ]);
    const r = selectServiceCategories(entities, COMPANY);
    expect(r.map((row) => row.id)).toEqual(['s2', 's1']);
  });
});

describe('selectConsultantTiers', () => {
  it('lifts multiplier from extra_schema', () => {
    const entities = build([
      {
        id: 'tier-1',
        scope: 'consultant_tier',
        name: 'Senior',
        extra_schema: { multiplier: 1.25 },
      },
      { id: 'tier-2', scope: 'consultant_tier', name: 'Junior' },
    ]);
    const r = selectConsultantTiers(entities, COMPANY);
    expect(r.find((row) => row.id === 'tier-1')?.multiplier).toBe(1.25);
    expect(r.find((row) => row.id === 'tier-2')?.multiplier).toBeUndefined();
  });
});

describe('selectClientTypes', () => {
  it('mirrors consultant tier shape', () => {
    const entities = build([
      {
        id: 'ct-1',
        scope: 'client_type',
        name: 'Law Firm',
        extra_schema: { multiplier: '0.85' },
      },
    ]);
    const r = selectClientTypes(entities, COMPANY);
    expect(r[0]?.multiplier).toBe(0.85);
  });
});
