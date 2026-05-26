/**
 * use-active-trial-stats — per-active-trial hours+revenue stats.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 661–670.
 *
 * Active = operations-stage AND completion_type IS NULL. For each active
 * trial: sum duration_hours + amount of all time entries for that trial
 * (across all consultants, all time — bible doesn't window this list).
 * Joined to client.firm_name. Sorted by revenue desc.
 *
 * 2.0 migration: replaced useEntityView (inline remoteFetch) with useEntities.
 */

import { useMemo } from 'react';
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  activeTrials as bibleActiveTrials,
  type PipelineStageLike,
  type TrialLike,
} from '@/features/dashboard/business-rules/pipeline-aggregation';
import {
  computeActiveTrialStats,
  type ActiveTrialStat,
  type ClientForStats,
  type TimeEntryRow as BizTimeEntryRow,
  type TrialForStats,
} from '@/features/dashboard/business-rules/team-performance';

interface TimeEntryRow { id: string; trial_id: string | null; duration_hours: number | null; amount: number | null; }

export interface ActiveTrialStatsResult {
  stats: ActiveTrialStat[];
  isLoading: boolean;
}

const EMPTY: ActiveTrialStat[] = Object.freeze([] as ActiveTrialStat[]) as ActiveTrialStat[];

export function useActiveTrialStats(): ActiveTrialStatsResult {
  const { company, pipelineStages } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });
  const { clients, isLoading: clientsLoading } = useClientsList();

  // ALL time entries for the company — no window per bible.
  const { items: timeEntries, isLoading: timeLoading } = useEntities<TimeEntryRow>('TimeEntry', {
    filter: companyId
      ? [{ field: 'company_id', op: 'eq', value: companyId }]
      : null,
    enabled: !!companyId,
  });

  return useMemo<ActiveTrialStatsResult>(() => {
    if (!companyId) return { stats: EMPTY, isLoading: false };
    const stageLikes: PipelineStageLike[] = pipelineStages.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      revenue_probability: s.revenue_probability,
      is_active: s.is_active,
    }));
    const active = bibleActiveTrials(trials as unknown as TrialLike[], stageLikes);
    const trialsForStats: TrialForStats[] = active.map((t) => ({
      id: t.id,
      case_name: t.case_name ?? null,
      client_id: t.client_id ?? null,
    }));
    const clientsForStats: ClientForStats[] = clients.map((c) => ({
      id: c.id,
      firm_name: c.firm_name,
    }));
    const stats = computeActiveTrialStats({
      activeTrials: trialsForStats,
      timeEntries: timeEntries as unknown as BizTimeEntryRow[],
      clients: clientsForStats,
    });
    return {
      stats: stats.length > 0 ? stats : EMPTY,
      isLoading: trialsLoading || clientsLoading || timeLoading,
    };
  }, [
    companyId,
    trials,
    clients,
    pipelineStages,
    timeEntries,
    trialsLoading,
    clientsLoading,
    timeLoading,
  ]);
}
