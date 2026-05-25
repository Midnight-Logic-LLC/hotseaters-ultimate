/**
 * use-team-month — monthly hours + revenue per active consultant (+ HSH).
 *
 * Same data sources as use-team-week, different window (current calendar
 * month). Composes useTeam + useEntityView (TimeEntry + Assignments) +
 * Phase A aggregateTeamStats.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 617–658.
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTeam } from '@/features/company/hooks/use-team';
import {
  fetchTimeEntriesForCompany,
  type TimeEntryRow,
} from '@/features/time-entries/stores/time-entries-store';
import {
  fetchAssignmentsHiredByCompany,
  type SubcontractAssignmentRow,
} from '@/features/subcontracts/stores/subcontracts-store';
import {
  aggregateTeamStats,
  filterTimeEntriesInWindow,
  type ConsultantLike,
  type SubcontractAssignmentRow as BizAssignmentRow,
  type TeamMemberStat,
  type TimeEntryRow as BizTimeEntryRow,
} from '@/features/dashboard/business-rules/team-performance';

export interface TeamMonthResult {
  stats: TeamMemberStat[];
  isLoading: boolean;
}

const EMPTY: TeamMemberStat[] = Object.freeze([] as TeamMemberStat[]) as TeamMemberStat[];

export interface UseTeamMonthOptions {
  now?: Date;
}

/** Returns [start-of-month 00:00, end-of-month 23:59:59.999]. */
function monthWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function useTeamMonth(opts: UseTeamMonthOptions = {}): TeamMonthResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const nowMs = opts.now?.getTime();
  const { start, end } = useMemo(
    () => monthWindow(nowMs !== undefined ? new Date(nowMs) : new Date()),
    [nowMs],
  );

  const { members, isLoading: teamLoading } = useTeam(companyId);

  const timeEntryView = useEntityView<TimeEntryRow>({
    type: 'TimeEntry',
    baseQueryKey: ['TimeEntry', 'month', companyId ?? '__none__', start.toISOString(), end.toISOString()],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchTimeEntriesForCompany(companyId, {
        since: start.toISOString(),
        until: end.toISOString(),
      });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const assignmentView = useEntityView<SubcontractAssignmentRow>({
    type: 'SubcontractAssignment',
    baseQueryKey: ['SubcontractAssignment', 'hiredBy', companyId ?? '__none__', 'active'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchAssignmentsHiredByCompany(companyId, { status: 'active' });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  return useMemo<TeamMonthResult>(() => {
    if (!companyId) return { stats: EMPTY, isLoading: false };
    const consultants: ConsultantLike[] = members
      .filter((m) => m.account_status === 'active')
      .map((m) => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        status: 'active',
      }));
    const windowEntries = filterTimeEntriesInWindow(
      timeEntryView.items as unknown as BizTimeEntryRow[],
      start,
      end,
    );
    const stats = aggregateTeamStats({
      consultants,
      windowEntries,
      subcontractAssignments: assignmentView.items as unknown as BizAssignmentRow[],
    });
    return {
      stats: stats.length > 0 ? stats : EMPTY,
      isLoading: teamLoading || timeEntryView.isLoading || assignmentView.isLoading,
    };
  }, [
    companyId,
    members,
    timeEntryView.items,
    assignmentView.items,
    start,
    end,
    teamLoading,
    timeEntryView.isLoading,
    assignmentView.isLoading,
  ]);
}
