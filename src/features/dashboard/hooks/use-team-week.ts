/**
 * use-team-week — weekly hours + revenue per active consultant (+ HSH
 * subcontractor merge), for the current company.
 *
 * Composes:
 *   • useTeam(companyId)              — TeamMember subscription
 *   • useEntities<TimeEntryRow>       — time entries in window (Tier-C REST)
 *   • useEntities<SubcontractAssignmentRow> — HSH assignments (Tier-C REST)
 *   • Phase A team-performance        — aggregateTeamStats
 *
 * 2.0 migration: replaced useEntityView (inline remoteFetch closures) with
 * useEntities (transport-registry-backed).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 210–217, 542–577.
 */

import { useMemo } from 'react';
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTeam } from '@/features/company/hooks/use-team';
import {
  aggregateTeamStats,
  filterTimeEntriesInWindow,
  type ConsultantLike,
  type SubcontractAssignmentRow as BizAssignmentRow,
  type TeamMemberStat,
  type TimeEntryRow as BizTimeEntryRow,
} from '@/features/dashboard/business-rules/team-performance';

interface TimeEntryRow { id: string; user_id: string | null; start_time: string | null; end_time: string | null; duration_hours: number | null; amount: number | null; }
interface SubcontractAssignmentRow { id: string; subcontractor_company_id: string | null; status: string | null; hours_per_week: number | null; rate: number | null; }

export interface TeamWeekResult {
  stats: TeamMemberStat[];
  isLoading: boolean;
}

const EMPTY: TeamMemberStat[] = Object.freeze([] as TeamMemberStat[]) as TeamMemberStat[];

export interface UseTeamWeekOptions {
  /** Reference "now" — defaults to `new Date()`. Tests pin this. */
  now?: Date;
}

/** Returns Sunday 00:00..Saturday 23:59:59.999 of the week containing `now`. */
function weekWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function useTeamWeek(opts: UseTeamWeekOptions = {}): TeamWeekResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const nowMs = opts.now?.getTime();
  const { start, end } = useMemo(
    () => weekWindow(nowMs !== undefined ? new Date(nowMs) : new Date()),
    [nowMs],
  );

  const { members, isLoading: teamLoading } = useTeam(companyId);

  const { items: timeEntries, isLoading: timeLoading } = useEntities<TimeEntryRow>('TimeEntry', {
    filter: companyId
      ? [
          { field: 'company_id', op: 'eq', value: companyId },
          { field: 'start_time', op: 'gte', value: start.toISOString() },
          { field: 'start_time', op: 'lte', value: end.toISOString() },
        ]
      : null,
    enabled: !!companyId,
  });

  const { items: assignments, isLoading: assignmentsLoading } = useEntities<SubcontractAssignmentRow>('SubcontractAssignment', {
    filter: companyId
      ? [
          { field: 'hiring_company_id', op: 'eq', value: companyId },
          { field: 'status', op: 'eq', value: 'active' },
        ]
      : null,
    enabled: !!companyId,
  });

  return useMemo<TeamWeekResult>(() => {
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
      timeEntries as unknown as BizTimeEntryRow[],
      start,
      end,
    );
    const stats = aggregateTeamStats({
      consultants,
      windowEntries,
      subcontractAssignments: assignments as unknown as BizAssignmentRow[],
    });
    return {
      stats: stats.length > 0 ? stats : EMPTY,
      isLoading: teamLoading || timeLoading || assignmentsLoading,
    };
  }, [
    companyId,
    members,
    timeEntries,
    assignments,
    start,
    end,
    teamLoading,
    timeLoading,
    assignmentsLoading,
  ]);
}
