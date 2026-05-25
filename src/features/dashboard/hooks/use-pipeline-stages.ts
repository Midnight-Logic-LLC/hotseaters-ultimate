/**
 * use-pipeline-stages — dashboard-feature view of the Tier1 pipeline-stage
 * lookup with an optional `type` filter (sales / operations).
 *
 * Pure composition over `useTier1().pipelineStages` (Phase B, change-405).
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 164 / 177.
 *
 * Architectural rule (RULE 3): hooks read from stores/context only.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

export type PipelineStageType = 'sales' | 'operations';

export interface UseDashboardPipelineStagesOptions {
  /** Optional filter — when omitted, returns all active stages. */
  type?: PipelineStageType;
}

/** Stable empty array so referential identity is preserved across renders. */
const EMPTY: ReadonlyArray<PipelineStage> = Object.freeze([]);

export function useDashboardPipelineStages(
  opts: UseDashboardPipelineStagesOptions = {},
): ReadonlyArray<PipelineStage> {
  const { pipelineStages } = useTier1();
  const filterType = opts.type;
  return useMemo(() => {
    if (pipelineStages.length === 0) return EMPTY;
    if (!filterType) return pipelineStages;
    return pipelineStages.filter((s) => s.type === filterType);
  }, [pipelineStages, filterType]);
}
