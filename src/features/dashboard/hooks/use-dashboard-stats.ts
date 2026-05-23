/**
 * use-dashboard-stats — composite read-only selector over the entity graph.
 *
 * Aggregates v0.1 Tier-A entities (`trial`, `client`, `user_info`,
 * `metadata_type`, `entity_metadata`) into the headline numbers the legacy
 * `Dashboard.jsx` shows in the key-metrics band.
 *
 * Architectural rule (RULE 3): hooks read from the entity-graph **store**
 * — the canonical store in this app is `useGraphStore` from
 * `@prometheus-ags/prometheus-entity-management`. Components do NOT call the
 * graph directly; they call this hook.
 *
 * Render stability: the selector returns a new object only when the upstream
 * counts/derived numbers actually change (Zustand's shallow equality keeps
 * the derived object identity stable across re-renders).
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';

export interface DashboardStats {
  /** Number of clients scoped to the current company with status='active'. */
  clientsActive: number;
  /** Total number of clients scoped to the current company. */
  clientsTotal: number;
  /** Trials NOT marked completion_type and whose pipeline stage is operations. */
  trialsActive: number;
  /** Subset of `trialsActive` with start_date in the future. */
  trialsUpcoming: number;
  /** Trials with a won_date inside the current calendar year. */
  trialsYtdCount: number;
  /** Active deals (pipeline stage = sales, no completion_type). */
  dealsActive: number;
  /** Sum of estimated_value across active deals. */
  pipelineValue: number;
  /** Same sum weighted by stage.revenue_probability (defaults to 1). */
  pipelineWeighted: number;
  /** Team members in `user_info` for the current company with status='active'. */
  teamActive: number;
}

interface RawTrial {
  id?: string;
  company_id?: string;
  pipeline_stage_id?: string | null;
  completion_type?: string | null;
  start_date?: string | null;
  won_date?: string | null;
  estimated_value?: number | null;
}

interface RawClient {
  id?: string;
  company_id?: string;
  status?: string | null;
}

interface RawUserInfo {
  id?: string;
  company_id?: string | null;
  status?: string | null;
}

interface RawMetadataType {
  id?: string;
  scope?: string | null;
  company_id?: string | null;
}

interface RawEntityMetadata {
  id?: string;
  metadata_type_id?: string | null;
  extra?: Record<string, unknown> | null;
}

const ZERO_STATS: DashboardStats = {
  clientsActive: 0,
  clientsTotal: 0,
  trialsActive: 0,
  trialsUpcoming: 0,
  trialsYtdCount: 0,
  dealsActive: 0,
  pipelineValue: 0,
  pipelineWeighted: 0,
  teamActive: 0,
};

const EMPTY_BUCKET: Record<string, Record<string, unknown>> = Object.freeze({});

export function useDashboardStats(): DashboardStats {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  // Single subscription that returns the raw entity buckets. Zustand's shallow
  // equality keeps this identity-stable when only unrelated entity types change.
  const buckets = useGraphStore(
    useShallow((state) => ({
      trial: state.entities.trial ?? EMPTY_BUCKET,
      client: state.entities.client ?? EMPTY_BUCKET,
      user_info: state.entities.user_info ?? EMPTY_BUCKET,
      metadata_type: state.entities.metadata_type ?? EMPTY_BUCKET,
      entity_metadata: state.entities.entity_metadata ?? EMPTY_BUCKET,
    })),
  );

  return useMemo<DashboardStats>(() => {
    if (!companyId) return ZERO_STATS;

    const trials = Object.values(buckets.trial) as RawTrial[];
    const clients = Object.values(buckets.client) as RawClient[];
    const userInfos = Object.values(buckets.user_info) as RawUserInfo[];
    const metadataTypes = Object.values(buckets.metadata_type) as RawMetadataType[];
    const entityMetadata = Object.values(buckets.entity_metadata) as RawEntityMetadata[];

    // pipeline_stage is a scope inside metadata_type. We need the set of
    // metadata_type ids whose scope = 'pipeline_stage' and whose stage 'type'
    // is 'sales' vs 'operations'. The legacy schema stored type/probability
    // directly on pipeline_stage; in V2 they live in entity_metadata.extra.
    const pipelineStageTypeIds = new Set(
      metadataTypes
        .filter(
          (m) =>
            m.scope === 'pipeline_stage' &&
            (m.company_id === companyId || m.company_id === null),
        )
        .map((m) => m.id)
        .filter((id): id is string => typeof id === 'string'),
    );

    const stageById = new Map<
      string,
      { type: 'sales' | 'operations' | string; probability: number }
    >();
    for (const em of entityMetadata) {
      if (!em.metadata_type_id || !pipelineStageTypeIds.has(em.metadata_type_id)) continue;
      const stageId = (em.extra?.legacy_id as string | undefined) ?? em.id;
      if (!stageId) continue;
      const stageType = (em.extra?.type as string | undefined) ?? '';
      const probability = Number((em.extra?.revenue_probability ?? 1) as number) || 1;
      stageById.set(stageId, { type: stageType, probability });
    }

    const scoped = trials.filter((t) => t.company_id === companyId);

    let trialsActive = 0;
    let trialsUpcoming = 0;
    let dealsActive = 0;
    let pipelineValue = 0;
    let pipelineWeighted = 0;
    const now = Date.now();
    const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();

    for (const t of scoped) {
      if (t.completion_type) continue;
      const stage = t.pipeline_stage_id ? stageById.get(t.pipeline_stage_id) : undefined;
      if (stage?.type === 'operations') {
        trialsActive += 1;
        if (t.start_date && new Date(t.start_date).getTime() > now) {
          trialsUpcoming += 1;
        }
      } else if (stage?.type === 'sales') {
        dealsActive += 1;
        const value = Number(t.estimated_value ?? 0) || 0;
        pipelineValue += value;
        pipelineWeighted += value * stage.probability;
      }
    }

    const trialsYtdCount = scoped.filter(
      (t) => t.won_date && new Date(t.won_date).getTime() >= yearStart,
    ).length;

    const scopedClients = clients.filter((c) => c.company_id === companyId);
    const clientsTotal = scopedClients.length;
    const clientsActive = scopedClients.filter((c) => c.status === 'active').length;

    const teamActive = userInfos.filter(
      (u) => u.company_id === companyId && u.status === 'active',
    ).length;

    return {
      clientsActive,
      clientsTotal,
      trialsActive,
      trialsUpcoming,
      trialsYtdCount,
      dealsActive,
      pipelineValue,
      pipelineWeighted,
      teamActive,
    };
  }, [companyId, buckets]);
}
