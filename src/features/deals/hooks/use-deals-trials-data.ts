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
import {
  createTrial,
  updateTrial,
  deleteTrial,
  fetchTrialServices,
  createTrialService,
  updateTrialService,
  deleteTrialService,
  fetchTrialContacts,
  createTrialContact,
  deleteTrialContact,
} from '@/features/trials/stores/trials-store';
import type { Trial, TrialService } from '@/features/trials/entities';
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
  // ── Deal create / update orchestration (change-D03) ──
  /**
   * Create a new deal: insert the `trial`, then create its `trial_service`
   * rows and `trial_contact` (secondary-contact) rows. Mirrors the bible's
   * `createDealMutation`. Returns the created trial.
   */
  createDeal: (input: DealWritePayload) => Promise<Trial>;
  /**
   * Update an existing deal: patch the `trial`, then diff its `trial_service`
   * rows (create/update/delete) and replace its `trial_contact` rows. Mirrors
   * the bible's `updateDealMutation`. Returns the updated trial.
   */
  updateDeal: (input: DealWritePayload & { id: string }) => Promise<Trial>;
}

/** Service row as produced by the wizard's `buildServicesFromAnswers`. */
export type DealServiceInput = Partial<TrialService> & { id?: string };

export interface DealWritePayload {
  /** Trial column patch (case fields, dates, retainer, etc.). */
  trialData: Partial<Trial>;
  /** Built trial_service rows (existing rows carry a string `id`). */
  services?: DealServiceInput[];
  /** attorney_id list for the trial's secondary contacts. */
  secondaryContacts?: string[];
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

  const createDeal = useCallback(
    async ({ trialData, services, secondaryContacts }: DealWritePayload): Promise<Trial> => {
      if (!companyId) throw new Error('createDeal: no active company');
      const trial = await createTrial({ ...trialData, company_id: companyId });
      if (services && services.length > 0) {
        for (const service of services) {
          // New rows: strip any client-generated numeric id; the DB assigns one.
          const { id: _id, ...rest } = service;
          await createTrialService({ ...rest, trial_id: trial.id, company_id: companyId });
        }
      }
      if (secondaryContacts && secondaryContacts.length > 0) {
        for (const attorneyId of secondaryContacts) {
          await createTrialContact({
            trial_id: trial.id,
            attorney_id: attorneyId,
            company_id: companyId,
          });
        }
      }
      return trial;
    },
    [companyId],
  );

  const updateDeal = useCallback(
    async ({
      id,
      trialData,
      services,
      secondaryContacts,
    }: DealWritePayload & { id: string }): Promise<Trial> => {
      if (!companyId) throw new Error('updateDeal: no active company');
      const trial = await updateTrial(id, trialData);

      if (services !== undefined) {
        const existing = await fetchTrialServices(id);
        const incomingIds = new Set(
          services.map((s) => s.id).filter((v): v is string => typeof v === 'string'),
        );
        const toDeleteIds = existing
          .filter((ts) => !incomingIds.has(ts.id))
          .map((ts) => ts.id);

        // TODO(D04 HSH guard): the bible blocks removing a service that has an
        // active HotSeatHub assignment/request via `checkHSHBlockers`. The port
        // has the pure `findHSHBlockers` rule (features/trials/business-rules/
        // trial-service-delete-guard) but loading the HSH assignment/request
        // inventory belongs to the D04 sales-activity / HSH surface. Until then
        // service removal proceeds unguarded — wire `findHSHBlockers` here once
        // the HSH data path is hooked up.

        for (const tsId of toDeleteIds) {
          await deleteTrialService(tsId);
        }

        for (const service of services) {
          const { id: serviceId, ...rest } = service;
          if (typeof serviceId === 'string' && incomingIds.has(serviceId)) {
            await updateTrialService(serviceId, {
              ...rest,
              trial_id: id,
              company_id: companyId,
            });
          } else {
            await createTrialService({ ...rest, trial_id: id, company_id: companyId });
          }
        }
      }

      if (secondaryContacts !== undefined) {
        const existingContacts = await fetchTrialContacts(id);
        for (const tc of existingContacts) {
          await deleteTrialContact(tc.id);
        }
        for (const attorneyId of secondaryContacts) {
          await createTrialContact({
            trial_id: id,
            attorney_id: attorneyId,
            company_id: companyId,
          });
        }
      }

      return trial;
    },
    [companyId],
  );

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
    createDeal,
    updateDeal,
  };
}
