/**
 * deal-stage-transitions.ts — pure stage-resolution rules for the Deals
 * (Deal/Opportunity) surface.
 *
 * A "deal" is a `trial` at a sales-type pipeline stage; "winning" a deal moves
 * the same trial into the operations stages. These pure helpers compute the
 * TARGET `pipeline_stage_id` for each transition the bible's
 * `useDealsTrialsData` mutations perform — extracted so the rules are unit-
 * tested in isolation (RULE J) and the hook/store layer stays a thin executor.
 *
 * Bible source: HotSeatersMVP/src/hooks/useDealsTrialsData.js @ 29ae47e3
 *   - markAsWon       → first OPERATIONS stage (by order) + won_date + job_number
 *   - restoreDeal     → first SALES stage (by order)
 *   - revertToDeal    → last SALES stage (by order)
 *   - restoreTrial    → last OPERATIONS stage (by order) iff not already ops
 *
 * No I/O here (RULE: business-rules are pure). The hook applies the result.
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */

import type { PipelineStage } from '@/shared/db/lookups-selectors';

/** A deal is a trial whose current pipeline stage is a SALES-type stage. */
export function isDealStage(
  stageId: string | null | undefined,
  stages: readonly PipelineStage[],
): boolean {
  if (!stageId) return false;
  return stages.some((s) => s.id === stageId && s.type === 'sales');
}

/** A trial (operations) is a trial whose current stage is OPERATIONS-type. */
export function isOperationsStage(
  stageId: string | null | undefined,
  stages: readonly PipelineStage[],
): boolean {
  if (!stageId) return false;
  return stages.some((s) => s.id === stageId && s.type === 'operations');
}

function byOrderAsc(a: PipelineStage, b: PipelineStage): number {
  return a.order - b.order;
}
function byOrderDesc(a: PipelineStage, b: PipelineStage): number {
  return b.order - a.order;
}

/** First (lowest-order) stage of a given type, or null if none configured. */
export function firstStageOfType(
  type: 'sales' | 'operations',
  stages: readonly PipelineStage[],
): PipelineStage | null {
  return [...stages].filter((s) => s.type === type).sort(byOrderAsc)[0] ?? null;
}

/** Last (highest-order) stage of a given type, or null if none configured. */
export function lastStageOfType(
  type: 'sales' | 'operations',
  stages: readonly PipelineStage[],
): PipelineStage | null {
  return [...stages].filter((s) => s.type === type).sort(byOrderDesc)[0] ?? null;
}

/**
 * Target stage when WINNING a deal → first operations stage.
 * Bible markAsWonMutation. Throws if no operations stage is configured
 * (mirrors the bible's "No operations pipeline stages configured" guard).
 */
export function resolveWonStageId(stages: readonly PipelineStage[]): string {
  const stage = firstStageOfType('operations', stages);
  if (!stage) throw new Error('No operations pipeline stages configured');
  return stage.id;
}

/**
 * Target stage when RESTORING a lost deal → first sales stage.
 * Bible restoreDealMutation.
 */
export function resolveRestoredDealStageId(stages: readonly PipelineStage[]): string {
  const stage = firstStageOfType('sales', stages);
  if (!stage) throw new Error('No sales pipeline stages configured');
  return stage.id;
}

/**
 * Target stage when REVERTING a won trial back to a deal → last sales stage.
 * Bible revertToDealMutation.
 */
export function resolveRevertToDealStageId(stages: readonly PipelineStage[]): string {
  const stage = lastStageOfType('sales', stages);
  if (!stage) throw new Error('No sales pipeline stages configured');
  return stage.id;
}

/**
 * Target stage when RESTORING a completed trial → last operations stage,
 * but ONLY if the trial is not already at an operations stage (bible
 * restoreTrialMutation). Returns null when no stage change is required.
 */
export function resolveRestoredTrialStageId(
  currentStageId: string | null | undefined,
  stages: readonly PipelineStage[],
): string | null {
  if (isOperationsStage(currentStageId, stages)) return null;
  const stage = lastStageOfType('operations', stages);
  return stage?.id ?? null;
}
