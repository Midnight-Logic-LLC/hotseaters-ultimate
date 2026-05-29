/**
 * use-deals-trials-data.ts — DealTracker / Trials data hook (port of the
 * bible's `useDealsTrialsData`).
 *
 * A "deal" is a `trial` at a SALES-type pipeline stage; a "trial" (operations)
 * is the same entity at an OPERATIONS-type stage. This hook reads the company's
 * trials via Pattern-4 (`useTrialsList` → PGlite live query), partitions them
 * by the requested scope, and exposes the stage-transition actions the
 * DealTracker / Trials surfaces need.
 *
 * Architecture adaptation from the bible (RULE C/D):
 *   - bible TanStack `useQuery` over `getDealsTrialsData` edge fn → the port's
 *     `useTrialsList` Pattern-4 live read (no REST round-trip; auto-refresh).
 *   - bible `base44.entities.Trial.update(...)` mutations → the trials-store
 *     `updateTrial` / `deleteTrial` actions.
 *   - stage-transition target resolution → pure
 *     `business-rules/deal-stage-transitions` (RULE J), unit-tested in isolation.
 *   - Tier-1 (pipelineStages, services, consultants) → `useTier1()`.
 *
 * RULE B: components consume THIS hook, never the store. RULE C: this hook
 * calls the store + tier-1 hook only. HotSeatersMVP is the bible.
 */

import { useCallback, useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { updateTrial, deleteTrial } from '@/features/trials/stores/trials-store';
import type { Trial } from '@/features/trials/entities';
import type { PipelineStage, LookupRow } from '@/shared/db/lookups-selectors';
import {
  isDealStage,
  isOperationsStage,
  resolveWonStageId,
  resolveRestoredDealStageId,
  resolveRevertToDealStageId,
  resolveRestoredTrialStageId,
} from '@/features/deals/business-rules/deal-stage-transitions';

export type DealsScope = 'deals' | 'trials';

export interface UseDealsTrialsDataResult {
  scope: DealsScope;
  companyId: string | null;
  isLoading: boolean;
  /** Tier-1 (from the global provider, not a payload). */
  pipelineStages: PipelineStage[];
  serviceCategories: LookupRow[];
  consultantTiers: LookupRow[];
  /** All company trials (both scopes), unpartitioned. */
  trials: Trial[];
  /** Trials matching the requested scope (deals = sales stages, trials = ops). */
  scopedTrials: Trial[];
  /** Refresh — Pattern-4 live queries auto-update; no-op kept for API compat. */
  invalidate: () => void;
  // ── Stage-transition actions (RULE J via pure resolvers) ──
  updateStage: (id: string, pipelineStageId: string) => Promise<void>;
  markAsWon: (id: string, jobNumber?: string | null) => Promise<void>;
  restoreDeal: (id: string) => Promise<void>;
  revertToDeal: (id: string) => Promise<void>;
  restoreTrial: (id: string) => Promise<void>;
  /** Hard delete of the trial row. Cascade of children is handled in D04. */
  deleteDeal: (id: string) => Promise<void>;
}

function todayIso(): string {
  // Bible uses `new Date().toISOString().split('T')[0]`. Date.now() is fine in
  // app runtime (only the workflow sandbox forbids it).
  return new Date().toISOString().split('T')[0] ?? '';
}

export function useDealsTrialsData({ scope }: { scope: DealsScope }): UseDealsTrialsDataResult {
  if (scope !== 'deals' && scope !== 'trials') {
    throw new Error(`useDealsTrialsData: scope must be 'deals' or 'trials', got ${scope}`);
  }

  const { company, pipelineStages, serviceCategories, consultantTiers, isLoading: t1Loading } =
    useTier1();
  const companyId = company?.id ?? null;

  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });

  // Partition trials by scope using the pipeline-stage type (RULE J).
  const scopedTrials = useMemo(() => {
    if (scope === 'deals') {
      return trials.filter((t) => isDealStage(t.pipeline_stage_id, pipelineStages));
    }
    return trials.filter((t) => isOperationsStage(t.pipeline_stage_id, pipelineStages));
  }, [trials, pipelineStages, scope]);

  const updateStage = useCallback(async (id: string, pipelineStageId: string) => {
    await updateTrial(id, { pipeline_stage_id: pipelineStageId });
  }, []);

  const markAsWon = useCallback(
    async (id: string, jobNumber?: string | null) => {
      const stageId = resolveWonStageId(pipelineStages);
      await updateTrial(id, {
        pipeline_stage_id: stageId,
        won_date: todayIso(),
        ...(jobNumber ? { job_number: jobNumber } : {}),
      });
    },
    [pipelineStages],
  );

  const restoreDeal = useCallback(
    async (id: string) => {
      const stageId = resolveRestoredDealStageId(pipelineStages);
      await updateTrial(id, {
        pipeline_stage_id: stageId,
        lost_date: null,
        completion_type: null,
        completion_date: null,
      });
    },
    [pipelineStages],
  );

  const revertToDeal = useCallback(
    async (id: string) => {
      const stageId = resolveRevertToDealStageId(pipelineStages);
      await updateTrial(id, { pipeline_stage_id: stageId, won_date: null });
    },
    [pipelineStages],
  );

  const restoreTrial = useCallback(
    async (id: string) => {
      const current = trials.find((t) => t.id === id)?.pipeline_stage_id ?? null;
      const stageId = resolveRestoredTrialStageId(current, pipelineStages);
      await updateTrial(id, {
        completion_date: null,
        completion_type: null,
        ...(stageId ? { pipeline_stage_id: stageId } : {}),
      });
    },
    [trials, pipelineStages],
  );

  const deleteDeal = useCallback(async (id: string) => {
    // NOTE: child-cascade (services, contacts, time entries, documents, …) is
    // ported in change-D04 (CascadeDeleteDialog). D01 deletes the trial row;
    // the HSH-blocker guard + cascade land with the activity surface.
    await deleteTrial(id);
  }, []);

  const invalidate = useCallback(() => {
    // Pattern-4 live query auto-updates on PGlite change — nothing to do.
  }, []);

  return {
    scope,
    companyId,
    isLoading: t1Loading || !companyId || trialsLoading,
    pipelineStages,
    serviceCategories,
    consultantTiers,
    trials,
    scopedTrials,
    invalidate,
    updateStage,
    markAsWon,
    restoreDeal,
    revertToDeal,
    restoreTrial,
    deleteDeal,
  };
}
