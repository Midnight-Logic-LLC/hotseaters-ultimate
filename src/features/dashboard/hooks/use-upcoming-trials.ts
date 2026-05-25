/**
 * use-upcoming-trials — top N future-starting trials in active operations
 * stages, joined to client firm names.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 182, 1254–1322.
 *
 * Composes useTrialsList + useClientsList + Phase A pipeline-aggregation
 * (activeTrials + upcomingTrialsFrom). Pure derivation; no PGlite reach-in.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  activeTrials as bibleActiveTrials,
  upcomingTrialsFrom,
  type PipelineStageLike,
  type TrialLike,
} from '@/features/dashboard/business-rules/pipeline-aggregation';

const DEFAULT_LIMIT = 5;

export interface UpcomingTrialRow {
  id: string;
  case_name: string;
  start_date: string | null;
  client_id: string | null;
  client_firm_name: string | null;
}

export interface UpcomingTrialsResult {
  items: UpcomingTrialRow[];
  isLoading: boolean;
}

export interface UseUpcomingTrialsOptions {
  /** Top N to return (default 5, matches bible). */
  limit?: number;
  /** Reference "now" for testability; defaults to `new Date()`. */
  now?: Date;
}

const EMPTY: UpcomingTrialRow[] = Object.freeze([] as UpcomingTrialRow[]) as UpcomingTrialRow[];

export function useUpcomingTrials(opts: UseUpcomingTrialsOptions = {}): UpcomingTrialsResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const nowMs = opts.now?.getTime();
  const { company, pipelineStages } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });
  const { clients, isLoading: clientsLoading } = useClientsList();

  return useMemo<UpcomingTrialsResult>(() => {
    if (!companyId) return { items: EMPTY, isLoading: false };
    const stageLikes: PipelineStageLike[] = pipelineStages.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      revenue_probability: s.revenue_probability,
      is_active: s.is_active,
    }));
    const active = bibleActiveTrials(trials as unknown as TrialLike[], stageLikes);
    const now = nowMs !== undefined ? new Date(nowMs) : new Date();
    const upcoming = upcomingTrialsFrom(active, now);

    const sorted = [...upcoming].sort((a, b) => {
      const da = a.start_date ? Date.parse(a.start_date) : Number.POSITIVE_INFINITY;
      const db = b.start_date ? Date.parse(b.start_date) : Number.POSITIVE_INFINITY;
      return da - db;
    });

    const clientById = new Map(clients.map((c) => [c.id, c]));
    const items: UpcomingTrialRow[] = sorted.slice(0, limit).map((t) => {
      const client = t.client_id ? clientById.get(t.client_id) : undefined;
      return {
        id: t.id,
        case_name: t.case_name ?? '',
        start_date: t.start_date ?? null,
        client_id: t.client_id ?? null,
        client_firm_name: client?.firm_name ?? null,
      };
    });

    return {
      items: items.length > 0 ? items : EMPTY,
      isLoading: trialsLoading || clientsLoading,
    };
  }, [
    companyId,
    trials,
    clients,
    pipelineStages,
    limit,
    nowMs,
    trialsLoading,
    clientsLoading,
  ]);
}
