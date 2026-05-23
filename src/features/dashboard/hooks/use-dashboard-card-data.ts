/**
 * use-dashboard-card-data — per-card derived selectors that don't fit in the
 * composite `use-dashboard-stats`. Currently:
 *
 *   - `usePipelineByStage()` — counts + value per sales stage for the
 *     Sales Pipeline card.
 *   - `useRecentWins()` — most-recent trials with a `won_date` for the
 *     Recent Activity card.
 *   - `useDashboardEmpty()` — convenience boolean: true when the company has
 *     no trials, no clients, and no user_info siblings.
 *
 * Reads from `useGraphStore` only.
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';

const EMPTY_BUCKET: Record<string, Record<string, unknown>> = Object.freeze({});

export interface PipelineStageRow {
  id: string;
  name: string;
  count: number;
  value: number;
  probability: number;
}

interface RawMetadataType {
  id?: string;
  scope?: string | null;
  company_id?: string | null;
}

interface RawEntityMetadata {
  id?: string;
  metadata_type_id?: string | null;
  name?: string | null;
  extra?: Record<string, unknown> | null;
}

interface RawTrial {
  id?: string;
  company_id?: string;
  case_name?: string | null;
  pipeline_stage_id?: string | null;
  completion_type?: string | null;
  estimated_value?: number | null;
  won_date?: string | null;
}

export function usePipelineByStage(stageType: 'sales' | 'operations'): PipelineStageRow[] {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const buckets = useGraphStore(
    useShallow((state) => ({
      trial: state.entities.trial ?? EMPTY_BUCKET,
      metadata_type: state.entities.metadata_type ?? EMPTY_BUCKET,
      entity_metadata: state.entities.entity_metadata ?? EMPTY_BUCKET,
    })),
  );

  return useMemo<PipelineStageRow[]>(() => {
    if (!companyId) return [];

    const pipelineTypeIds = new Set(
      (Object.values(buckets.metadata_type) as RawMetadataType[])
        .filter(
          (m) =>
            m.scope === 'pipeline_stage' &&
            (m.company_id === companyId || m.company_id === null),
        )
        .map((m) => m.id)
        .filter((id): id is string => !!id),
    );

    const stages = (Object.values(buckets.entity_metadata) as RawEntityMetadata[])
      .filter((em) => em.metadata_type_id && pipelineTypeIds.has(em.metadata_type_id))
      .filter((em) => ((em.extra?.type as string | undefined) ?? '') === stageType)
      .map((em) => {
        const id = ((em.extra?.legacy_id as string | undefined) ?? em.id) as string;
        return {
          id,
          name: em.name ?? 'Stage',
          probability: Number(em.extra?.revenue_probability ?? 1) || 1,
        };
      });

    const trials = (Object.values(buckets.trial) as RawTrial[]).filter(
      (t) => t.company_id === companyId && !t.completion_type,
    );

    return stages.map<PipelineStageRow>((stage) => {
      const stageTrials = trials.filter((t) => t.pipeline_stage_id === stage.id);
      const count = stageTrials.length;
      const value = stageTrials.reduce(
        (sum, t) => sum + (Number(t.estimated_value ?? 0) || 0),
        0,
      );
      return {
        id: stage.id,
        name: stage.name,
        count,
        value,
        probability: stage.probability,
      };
    });
  }, [companyId, buckets, stageType]);
}

export interface RecentWin {
  id: string;
  case_name: string;
  won_date: string;
}

export function useRecentWins(limit: number = 3): RecentWin[] {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const bucket = useGraphStore(
    useShallow((state) => state.entities.trial ?? EMPTY_BUCKET),
  );

  return useMemo<RecentWin[]>(() => {
    if (!companyId) return [];
    return (Object.values(bucket) as RawTrial[])
      .filter((t): t is RawTrial & { id: string; won_date: string } =>
        Boolean(t.id && t.won_date && t.company_id === companyId),
      )
      .sort((a, b) => new Date(b.won_date).getTime() - new Date(a.won_date).getTime())
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        case_name: t.case_name ?? 'Trial',
        won_date: t.won_date,
      }));
  }, [companyId, bucket, limit]);
}

export function useDashboardEmpty(): boolean {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const counts = useGraphStore(
    useShallow((state) => {
      if (!companyId) return { trials: 0, clients: 0 };
      const trials = Object.values(state.entities.trial ?? EMPTY_BUCKET) as Array<{
        company_id?: string;
      }>;
      const clients = Object.values(state.entities.client ?? EMPTY_BUCKET) as Array<{
        company_id?: string;
      }>;
      return {
        trials: trials.filter((t) => t.company_id === companyId).length,
        clients: clients.filter((c) => c.company_id === companyId).length,
      };
    }),
  );

  return counts.trials === 0 && counts.clients === 0;
}
