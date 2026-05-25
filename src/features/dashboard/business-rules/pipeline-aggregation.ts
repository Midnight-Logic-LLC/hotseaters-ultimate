/**
 * pipeline-aggregation.ts — Sales pipeline + operations pipeline derivation.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 163–183, 222–236.
 *
 * Pure. Callers inject `trials` + `stages`; nothing here touches I/O.
 */

import { parseISO } from 'date-fns';

export interface PipelineStageLike {
  id: string;
  name?: string | null;
  /** 'sales' or 'operations' in MVP; either may be 'sales' for pipeline math. */
  type?: string | null;
  /** Used as a fallback `type` if `type` is absent (V2 metadata-projected shape). */
  stage_type?: string | null;
  is_active?: boolean | null;
  /** 0..1 multiplier applied to `estimated_value` for weighted pipeline. */
  revenue_probability?: number | null;
}

export interface TrialLike {
  id: string;
  case_name?: string | null;
  pipeline_stage_id?: string | null;
  completion_type?: string | null;
  estimated_value?: number | null;
  start_date?: string | null;
  client_id?: string | null;
}

export interface StageInfo {
  id: string;
  name: string;
  type: 'sales' | 'operations' | '';
  probability: number;
  isActive: boolean;
}

function stageType(s: PipelineStageLike): 'sales' | 'operations' | '' {
  const raw = s.type ?? s.stage_type ?? '';
  return raw === 'sales' || raw === 'operations' ? raw : '';
}

/** Build a lookup map id → StageInfo, normalizing legacy/V2 fields. */
export function indexStages(stages: ReadonlyArray<PipelineStageLike>): Map<string, StageInfo> {
  const m = new Map<string, StageInfo>();
  for (const s of stages) {
    const probRaw = s.revenue_probability;
    const probability =
      typeof probRaw === 'number' && Number.isFinite(probRaw) ? probRaw : 1;
    m.set(s.id, {
      id: s.id,
      name: s.name ?? '',
      type: stageType(s),
      probability,
      isActive: s.is_active !== false,
    });
  }
  return m;
}

/** Filter to active stages of a given type — bible lines 164, 177. */
export function activeStagesOfType(
  stages: ReadonlyArray<PipelineStageLike>,
  type: 'sales' | 'operations',
): StageInfo[] {
  return [...indexStages(stages).values()].filter(
    (s) => s.type === type && s.isActive,
  );
}

/**
 * "Active deals": trials whose stage is sales AND that have no completion type.
 * Bible lines 165–168.
 */
export function activeDeals(
  trials: ReadonlyArray<TrialLike>,
  stages: ReadonlyArray<PipelineStageLike>,
): TrialLike[] {
  const idx = indexStages(stages);
  return trials.filter((t) => {
    if (t.completion_type) return false;
    const s = t.pipeline_stage_id ? idx.get(t.pipeline_stage_id) : undefined;
    return s?.type === 'sales';
  });
}

/**
 * "Active trials": trials whose stage is operations AND that have no
 * completion type. Bible lines 178–181.
 */
export function activeTrials(
  trials: ReadonlyArray<TrialLike>,
  stages: ReadonlyArray<PipelineStageLike>,
): TrialLike[] {
  const idx = indexStages(stages);
  return trials.filter((t) => {
    if (t.completion_type) return false;
    const s = t.pipeline_stage_id ? idx.get(t.pipeline_stage_id) : undefined;
    return s?.type === 'operations';
  });
}

/** Upcoming subset of active trials — start_date strictly in the future. */
export function upcomingTrialsFrom(
  active: ReadonlyArray<TrialLike>,
  now: Date,
): TrialLike[] {
  return active.filter((t) => {
    if (!t.start_date) return false;
    return parseISO(t.start_date) > now;
  });
}

export interface PipelineValueSummary {
  raw: number;
  weighted: number;
  dealCount: number;
}

/** Bible lines 169–174 — raw sum + probability-weighted sum + count. */
export function computePipelineValue(
  deals: ReadonlyArray<TrialLike>,
  stages: ReadonlyArray<PipelineStageLike>,
): PipelineValueSummary {
  const idx = indexStages(stages);
  let raw = 0;
  let weighted = 0;
  for (const d of deals) {
    const v = d.estimated_value ?? 0;
    raw += v;
    const s = d.pipeline_stage_id ? idx.get(d.pipeline_stage_id) : undefined;
    const p = s ? s.probability : 1;
    weighted += v * p;
  }
  return { raw, weighted, dealCount: deals.length };
}

export interface PipelineStageBucket {
  id: string;
  name: string;
  count: number;
  value: number;
}

/** Bible lines 227–231 — deals grouped by sales stage. */
export function dealsByStage(
  deals: ReadonlyArray<TrialLike>,
  salesStages: ReadonlyArray<StageInfo>,
): PipelineStageBucket[] {
  return salesStages.map((stage) => {
    const inStage = deals.filter((d) => d.pipeline_stage_id === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      count: inStage.length,
      value: inStage.reduce((sum, d) => sum + (d.estimated_value ?? 0), 0),
    };
  });
}

/** Bible lines 233–236 — trials grouped by operations stage. */
export function trialsByStage(
  active: ReadonlyArray<TrialLike>,
  opsStages: ReadonlyArray<StageInfo>,
): Array<{ id: string; name: string; count: number }> {
  return opsStages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    count: active.filter((t) => t.pipeline_stage_id === stage.id).length,
  }));
}
