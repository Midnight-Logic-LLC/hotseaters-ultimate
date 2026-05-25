/**
 * use-active-trial-stats — per-active-trial hours+revenue stats.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 661–670.
 *
 * Active = operations-stage AND completion_type IS NULL. For each active
 * trial: sum duration_hours + amount of all time entries for that trial
 * (across all consultants, all time — bible doesn't window this list).
 * Joined to client.firm_name. Sorted by revenue desc.
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  fetchTimeEntriesForCompany,
  type TimeEntryRow,
} from '@/features/time-entries/stores/time-entries-store';
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

  // Active-trial stats need ALL time entries for the company (no window
  // per bible). Hybrid REST until TimeEntry joins SYNC_CONFIG.
  const timeEntryView = useEntityView<TimeEntryRow>({
    type: 'TimeEntry',
    baseQueryKey: ['TimeEntry', 'all', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchTimeEntriesForCompany(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
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
      timeEntries: timeEntryView.items as unknown as BizTimeEntryRow[],
      clients: clientsForStats,
    });
    return {
      stats: stats.length > 0 ? stats : EMPTY,
      isLoading: trialsLoading || clientsLoading || timeEntryView.isLoading,
    };
  }, [
    companyId,
    trials,
    clients,
    pipelineStages,
    timeEntryView.items,
    trialsLoading,
    clientsLoading,
    timeEntryView.isLoading,
  ]);
}
