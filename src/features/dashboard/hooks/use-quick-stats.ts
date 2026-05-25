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
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTeam } from '@/features/company/hooks/use-team';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  fetchInvoicesForCompany,
  type InvoiceRow,
} from '@/features/invoices/stores/invoices-store';
import {
  fetchTimeEntriesForCompany,
  type TimeEntryRow,
} from '@/features/time-entries/stores/time-entries-store';
import {
  fetchAssignmentsAsSubcontractor,
  fetchRequestsForCompany,
  type SubcontractAssignmentRow,
  type SubcontractRequestRow,
} from '@/features/subcontracts/stores/subcontracts-store';
import { computeOutstandingInvoices } from '@/features/dashboard/business-rules/revenue-aggregation';
import {
  avgHoursPerActiveConsultant,
  filterTimeEntriesInWindow,
  type ConsultantLike,
  type TimeEntryRow as BizTimeEntryRow,
} from '@/features/dashboard/business-rules/team-performance';

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

  const invoiceView = useEntityView<InvoiceRow>({
    type: 'Invoice',
    baseQueryKey: ['Invoice', 'outstanding', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchInvoicesForCompany(companyId, {
        status: ['sent', 'overdue'],
      });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const weekTimeView = useEntityView<TimeEntryRow>({
    type: 'TimeEntry',
    baseQueryKey: ['TimeEntry', 'qs-week', companyId ?? '__none__', start.toISOString(), end.toISOString()],
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

  const requestView = useEntityView<SubcontractRequestRow>({
    type: 'SubcontractRequest',
    baseQueryKey: ['SubcontractRequest', 'open', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId && postJobs,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchRequestsForCompany(companyId, { status: 'open' });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const gigView = useEntityView<SubcontractAssignmentRow>({
    type: 'SubcontractAssignment',
    baseQueryKey: ['SubcontractAssignment', 'asSub', companyId ?? '__none__', 'active'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId && fillJobs,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchAssignmentsAsSubcontractor(companyId, { status: 'active' });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
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
    const outstanding = computeOutstandingInvoices(invoiceView.items);
    const windowEntries = filterTimeEntriesInWindow(
      weekTimeView.items as unknown as BizTimeEntryRow[],
      start,
      end,
    );
    const avg = avgHoursPerActiveConsultant({ consultants, windowEntries });
    const out: QuickStatsResult = {
      activeClients,
      teamMembers: consultants.length,
      outstandingAmount: outstanding.amount,
      avgHoursPerWeek: avg,
      openHshPosts: postJobs ? requestView.items.length : undefined,
      activeHshGigs: fillJobs ? gigView.items.length : undefined,
      isLoading:
        teamLoading ||
        clientsLoading ||
        invoiceView.isLoading ||
        weekTimeView.isLoading ||
        (postJobs ? requestView.isLoading : false) ||
        (fillJobs ? gigView.isLoading : false),
    };
    return out;
  }, [
    companyId,
    clients,
    members,
    invoiceView.items,
    invoiceView.isLoading,
    weekTimeView.items,
    weekTimeView.isLoading,
    requestView.items,
    requestView.isLoading,
    gigView.items,
    gigView.isLoading,
    postJobs,
    fillJobs,
    start,
    end,
    teamLoading,
    clientsLoading,
  ]);
}
