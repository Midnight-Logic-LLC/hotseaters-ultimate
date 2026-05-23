/**
 * use-recent-trials — top N trials for the current company ordered by
 * `updated_at` descending. Defaults to 5.
 *
 * Reads from the entity-graph store (`useGraphStore`). When trials sync via
 * Electric, the result updates automatically through the Zustand subscription.
 *
 * Architectural rule (RULE 3): hooks read from stores only. No fetch.
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';

export interface RecentTrial {
  id: string;
  case_name: string;
  client_id?: string | null;
  client_name?: string | null;
  pipeline_stage_id?: string | null;
  start_date?: string | null;
  won_date?: string | null;
  updated_at?: string | null;
  completion_type?: string | null;
}

interface RawTrial {
  id?: string;
  company_id?: string;
  case_name?: string | null;
  client_id?: string | null;
  pipeline_stage_id?: string | null;
  start_date?: string | null;
  won_date?: string | null;
  updated_at?: string | null;
  completion_type?: string | null;
}

interface RawClient {
  id?: string;
  company_id?: string;
  firm_name?: string | null;
}

const EMPTY_BUCKET: Record<string, Record<string, unknown>> = Object.freeze({});

const DEFAULT_LIMIT = 5;

export function useRecentTrials(limit: number = DEFAULT_LIMIT): RecentTrial[] {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const buckets = useGraphStore(
    useShallow((state) => ({
      trial: state.entities.trial ?? EMPTY_BUCKET,
      client: state.entities.client ?? EMPTY_BUCKET,
    })),
  );

  return useMemo<RecentTrial[]>(() => {
    if (!companyId) return [];

    const clientsById = new Map<string, RawClient>();
    for (const c of Object.values(buckets.client) as RawClient[]) {
      if (c.id) clientsById.set(c.id, c);
    }

    const trials = (Object.values(buckets.trial) as RawTrial[])
      .filter((t) => t.company_id === companyId && t.id)
      .sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, limit);

    return trials.map<RecentTrial>((t) => {
      const client = t.client_id ? clientsById.get(t.client_id) : undefined;
      return {
        id: t.id as string,
        case_name: t.case_name ?? 'Untitled trial',
        client_id: t.client_id ?? null,
        client_name: client?.firm_name ?? null,
        pipeline_stage_id: t.pipeline_stage_id ?? null,
        start_date: t.start_date ?? null,
        won_date: t.won_date ?? null,
        updated_at: t.updated_at ?? null,
        completion_type: t.completion_type ?? null,
      };
    });
  }, [companyId, buckets, limit]);
}
