/**
 * use-needs-attention — sales-stale-leads counter for the NeedsAttentionBanner.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 56–59, 711–755 +
 * useMyStaleLeadsCount.js.
 *
 * Counters:
 *   • myCount    — stale leads where the current user is the sales_lead.
 *   • totalCount — stale leads company-wide (owner-only display).
 *
 * Stale = no pending activity OR earliest pending activity is overdue.
 * "Mine" walks lead.attorney_id → attorney.client_id → client.sales_lead.
 *
 * All four entities (Lead, SalesActivity, Attorney, Client) are read via
 * hybrid REST through the lead-radar store. Client is technically already
 * Tier-A via useClientsList, but we keep one unified hybrid path here so
 * the test surface is uniform; useClientsList still gets used for the
 * Tier-A path elsewhere in the dashboard (use-quick-stats etc.).
 *
 * Visibility (banner only renders for owner / sales / is_sales — that
 * gate lives in the widget registry, not here).
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  fetchAttorneysForCompany,
  fetchLeadsForCompany,
  fetchPendingActivitiesForCompany,
  type AttorneyRow,
  type LeadRow,
  type SalesActivityRow,
} from '@/features/lead-radar/stores/lead-radar-store';
import {
  computeStaleLeadCounts,
  type ActivityLike,
  type AttorneyLike,
  type ClientLike,
  type LeadLike,
  type StaleLeadsCounts,
} from '@/features/dashboard/business-rules/stale-leads';

export interface NeedsAttentionResult extends StaleLeadsCounts {
  isLoading: boolean;
  /** True when the banner has anything worth showing for the current user. */
  shouldRender: boolean;
  /** Bible-correct primary copy (varies by owner vs. sales view). */
  headline: string;
  /** Bible-correct secondary copy. */
  subhead: string;
}

const EMPTY: NeedsAttentionResult = Object.freeze({
  myCount: 0,
  totalCount: 0,
  isLoading: false,
  shouldRender: false,
  headline: '',
  subhead: '',
});

export interface UseNeedsAttentionOptions {
  /** Reference "now" for stale comparisons. Defaults to `new Date()`. */
  now?: Date;
}

export function useNeedsAttention(opts: UseNeedsAttentionOptions = {}): NeedsAttentionResult {
  const { company, role } = useTier1();
  const companyId = company?.id ?? null;
  const isOwnerView = role === 'owner';
  const { userInfo } = useCurrentUser();
  const myUserInfoId = userInfo?.id ?? null;
  const nowMs = opts.now?.getTime();

  const { clients, isLoading: clientsLoading } = useClientsList();

  const leadView = useEntityView<LeadRow>({
    type: 'Lead',
    baseQueryKey: ['Lead', 'byCompany', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchLeadsForCompany(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const activityView = useEntityView<SalesActivityRow>({
    type: 'SalesActivity',
    baseQueryKey: ['SalesActivity', 'pending', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchPendingActivitiesForCompany(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const attorneyView = useEntityView<AttorneyRow>({
    type: 'Attorney',
    baseQueryKey: ['Attorney', 'byCompany', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchAttorneysForCompany(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  return useMemo<NeedsAttentionResult>(() => {
    if (!companyId) return EMPTY;
    const now = nowMs !== undefined ? new Date(nowMs) : new Date();
    const leads = leadView.items as unknown as LeadLike[];
    const pendingActivities = activityView.items as unknown as ActivityLike[];
    const attorneys = attorneyView.items as unknown as AttorneyLike[];
    const clientsForRule: ClientLike[] = clients.map((c) => ({
      id: c.id,
      sales_lead: (c as { sales_lead?: string | null }).sales_lead ?? null,
    }));
    const counts = computeStaleLeadCounts({
      leads,
      pendingActivities,
      attorneys,
      clients: clientsForRule,
      myUserInfoId,
      now,
    });
    const isLoading =
      clientsLoading ||
      leadView.isLoading ||
      activityView.isLoading ||
      attorneyView.isLoading;
    // Bible copy: owners see "X of yours / Y total need attention" with
    // owner-specific subhead; non-owners (sales) see plural-aware copy.
    const headline = isOwnerView
      ? `${counts.myCount} of yours / ${counts.totalCount} total need attention`
      : `${counts.myCount} ${counts.myCount === 1 ? 'lead needs' : 'leads need'} attention`;
    const subhead = isOwnerView
      ? 'Overdue or missing a next step — open Lead Radar to follow up.'
      : 'Overdue or no next step scheduled — open Lead Radar to follow up.';
    // Banner hides when nothing to say: zero mine AND (not owner OR zero total).
    const shouldRender =
      !isLoading && (counts.myCount > 0 || (isOwnerView && counts.totalCount > 0));
    return {
      myCount: counts.myCount,
      totalCount: counts.totalCount,
      isLoading,
      shouldRender,
      headline,
      subhead,
    };
  }, [
    companyId,
    isOwnerView,
    leadView.items,
    leadView.isLoading,
    activityView.items,
    activityView.isLoading,
    attorneyView.items,
    attorneyView.isLoading,
    clients,
    clientsLoading,
    myUserInfoId,
    nowMs,
  ]);
}
