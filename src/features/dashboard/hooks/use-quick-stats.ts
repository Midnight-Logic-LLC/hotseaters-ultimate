/**
 * use-quick-stats — secondary counters for the Quick Stats card.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 222–224, 935–989.
 *
 * Returns 6 counters (rendered conditionally on company flags):
 *   • activeClients      — count of clients with status='active'.
 *   • teamMembers        — count of active team members.
 *   • outstandingAmount  — $ from invoices in sent/overdue (Phase A).
 *   • avgHoursPerWeek    — total hrs / active consultants (Phase A).
 *   • openHshPosts       — subcontract_request status='open' (HSH-post-jobs only).
 *   • activeHshGigs      — subcontract_assignment subcontractor=us, active.
 *
 * 2.0 migration: replaced useEntityView (inline remoteFetch closures) with
 * useEntities (transport-registry-backed). The transport looks up by entity
 * type; no fetch closure or normalize needed here. Filter specs compile to the
 * same PostgREST params the old closures built manually.
 */

import { useMemo } from 'react';
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTeam } from '@/features/company/hooks/use-team';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import { computeOutstandingInvoices } from '@/features/dashboard/business-rules/revenue-aggregation';
import {
  avgHoursPerActiveConsultant,
  filterTimeEntriesInWindow,
  type ConsultantLike,
  type TimeEntryRow as BizTimeEntryRow,
} from '@/features/dashboard/business-rules/team-performance';

// Row types — kept minimal; only the fields the business rules need.
interface InvoiceRow { id: string; status: string | null; total: number | null; }
interface TimeEntryRow { id: string; start_time: string | null; end_time: string | null; duration_hours: number | null; }
interface SubcontractRequestRow { id: string; status: string | null; }
interface SubcontractAssignmentRow { id: string; status: string | null; subcontractor_id: string | null; }

export interface QuickStatsResult {
  activeClients: number;
  teamMembers: number;
  outstandingAmount: number;
  avgHoursPerWeek: number;
  /** Undefined when company.marketplace_post_jobs is false. */
  openHshPosts: number | undefined;
  /** Undefined when company.marketplace_fill_jobs is false. */
  activeHshGigs: number | undefined;
  isLoading: boolean;
}

const EMPTY: QuickStatsResult = Object.freeze({
  activeClients: 0,
  teamMembers: 0,
  outstandingAmount: 0,
  avgHoursPerWeek: 0,
  openHshPosts: undefined,
  activeHshGigs: undefined,
  isLoading: false,
});

export interface UseQuickStatsOptions {
  /** Reference "now" for week window. Defaults to `new Date()`. */
  now?: Date;
}

function weekWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function useQuickStats(opts: UseQuickStatsOptions = {}): QuickStatsResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const postJobs = company?.marketplace_post_jobs ?? false;
  const fillJobs = company?.marketplace_fill_jobs ?? false;
  const nowMs = opts.now?.getTime();
  const { start, end } = useMemo(
    () => weekWindow(nowMs !== undefined ? new Date(nowMs) : new Date()),
    [nowMs],
  );

  const { members, isLoading: teamLoading } = useTeam(companyId);
  const { clients, isLoading: clientsLoading } = useClientsList();

  // Outstanding invoices (sent | overdue) — Tier-C REST via transport registry.
  const { items: invoices, isLoading: invoicesLoading } = useEntities<InvoiceRow>('Invoice', {
    filter: companyId
      ? [
          { field: 'company_id', op: 'eq', value: companyId },
          { field: 'status', op: 'in', value: ['sent', 'overdue'] },
        ]
      : null,
    enabled: !!companyId,
  });

  // Time entries in the current week — Tier-C REST.
  const { items: weekTimeEntries, isLoading: timeLoading } = useEntities<TimeEntryRow>('TimeEntry', {
    filter: companyId
      ? [
          { field: 'company_id', op: 'eq', value: companyId },
          { field: 'start_time', op: 'gte', value: start.toISOString() },
          { field: 'start_time', op: 'lte', value: end.toISOString() },
        ]
      : null,
    enabled: !!companyId,
  });

  // Open HSH post-job listings — gate on company flag.
  const { items: openRequests, isLoading: requestsLoading } = useEntities<SubcontractRequestRow>('SubcontractRequest', {
    filter: companyId
      ? [
          { field: 'company_id', op: 'eq', value: companyId },
          { field: 'status', op: 'eq', value: 'open' },
        ]
      : null,
    enabled: !!companyId && postJobs,
  });

  // Active HSH gigs where we are the subcontractor — gate on company flag.
  const { items: activeGigs, isLoading: gigsLoading } = useEntities<SubcontractAssignmentRow>('SubcontractAssignment', {
    filter: companyId
      ? [
          { field: 'subcontractor_id', op: 'eq', value: companyId },
          { field: 'status', op: 'eq', value: 'active' },
        ]
      : null,
    enabled: !!companyId && fillJobs,
  });

  return useMemo<QuickStatsResult>(() => {
    if (!companyId) return EMPTY;
    const activeClients = clients.filter((c) => (c as { status?: string | null }).status === 'active').length;
    const consultants: ConsultantLike[] = members
      .filter((m) => m.account_status === 'active')
      .map((m) => ({
        id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        status: 'active',
      }));
    const outstanding = computeOutstandingInvoices(invoices);
    const windowEntries = filterTimeEntriesInWindow(
      weekTimeEntries as unknown as BizTimeEntryRow[],
      start,
      end,
    );
    const avg = avgHoursPerActiveConsultant({ consultants, windowEntries });
    const out: QuickStatsResult = {
      activeClients,
      teamMembers: consultants.length,
      outstandingAmount: outstanding.amount,
      avgHoursPerWeek: avg,
      openHshPosts: postJobs ? openRequests.length : undefined,
      activeHshGigs: fillJobs ? activeGigs.length : undefined,
      isLoading:
        teamLoading ||
        clientsLoading ||
        invoicesLoading ||
        timeLoading ||
        (postJobs ? requestsLoading : false) ||
        (fillJobs ? gigsLoading : false),
    };
    return out;
  }, [
    companyId,
    clients,
    members,
    invoices,
    invoicesLoading,
    weekTimeEntries,
    timeLoading,
    openRequests,
    requestsLoading,
    activeGigs,
    gigsLoading,
    postJobs,
    fillJobs,
    start,
    end,
    teamLoading,
    clientsLoading,
  ]);
}
