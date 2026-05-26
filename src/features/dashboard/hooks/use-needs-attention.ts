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
 * 2.0 migration: replaced useEntityView (inline remoteFetch closures) with
 * useEntities (transport-registry-backed).
 *
 * The LEAD_RADAR_AVAILABLE flag gates all three entity fetches until the
 * `lead`, `sales_activity`, and `attorney` tables land in the V2 schema.
 * Flip it to `true` when the schema is ready; zero other changes needed.
 */

import { useMemo } from 'react';
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import {
  computeStaleLeadCounts,
  type ActivityLike,
  type AttorneyLike,
  type ClientLike,
  type LeadLike,
  type StaleLeadsCounts,
} from '@/features/dashboard/business-rules/stale-leads';

interface LeadRow { id: string; attorney_id: string | null; }
interface SalesActivityRow { id: string; lead_id: string | null; status: string | null; due_date: string | null; }
interface AttorneyRow { id: string; client_id: string | null; }

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

/**
 * Feature flag — flip to `true` when the offline-first phase wires the
 * `lead`, `sales_activity`, and `attorney` tables into Postgres + RLS +
 * sync-config. Until then this hook short-circuits to EMPTY and disables
 * the underlying `useEntities` REST calls, so we never fire
 * `/rest/v1/lead?...` against a schema where those tables don't exist
 * (which returns 400 → TerminalError, no retry storm).
 *
 * The NeedsAttentionBanner widget consumes `shouldRender` and renders
 * nothing when false, so flipping this flag is a true no-op for users
 * until the schema is ready.
 *
 * Exposed via a getter so unit tests can override it without mocking the
 * whole module. Production code MUST NOT call the setter.
 */
let LEAD_RADAR_AVAILABLE = false;

/** Test-only — flip the feature flag from a spec. */
export function __setLeadRadarAvailableForTests(value: boolean): void {
  LEAD_RADAR_AVAILABLE = value;
}

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

  const { items: leads, isLoading: leadsLoading } = useEntities<LeadRow>('Lead', {
    filter: companyId
      ? [{ field: 'company_id', op: 'eq', value: companyId }]
      : null,
    enabled: LEAD_RADAR_AVAILABLE && !!companyId,
  });

  const { items: activities, isLoading: activitiesLoading } = useEntities<SalesActivityRow>('SalesActivity', {
    filter: companyId
      ? [
          { field: 'company_id', op: 'eq', value: companyId },
          { field: 'status', op: 'eq', value: 'pending' },
        ]
      : null,
    enabled: LEAD_RADAR_AVAILABLE && !!companyId,
  });

  const { items: attorneys, isLoading: attorneysLoading } = useEntities<AttorneyRow>('Attorney', {
    filter: companyId
      ? [{ field: 'company_id', op: 'eq', value: companyId }]
      : null,
    enabled: LEAD_RADAR_AVAILABLE && !!companyId,
  });

  return useMemo<NeedsAttentionResult>(() => {
    if (!LEAD_RADAR_AVAILABLE) return EMPTY;
    if (!companyId) return EMPTY;
    const now = nowMs !== undefined ? new Date(nowMs) : new Date();
    const clientsForRule: ClientLike[] = clients.map((c) => ({
      id: c.id,
      sales_lead: (c as { sales_lead?: string | null }).sales_lead ?? null,
    }));
    const counts = computeStaleLeadCounts({
      leads: leads as unknown as LeadLike[],
      pendingActivities: activities as unknown as ActivityLike[],
      attorneys: attorneys as unknown as AttorneyLike[],
      clients: clientsForRule,
      myUserInfoId,
      now,
    });
    const shouldRender = isOwnerView ? counts.totalCount > 0 : counts.myCount > 0;
    const headline = isOwnerView
      ? `${counts.totalCount} Lead${counts.totalCount !== 1 ? 's' : ''} Need Attention`
      : `${counts.myCount} of Your Lead${counts.myCount !== 1 ? 's' : ''} ${counts.myCount !== 1 ? 'Need' : 'Needs'} Attention`;
    const subhead = 'No activity logged in the last 7 days';
    return {
      ...counts,
      isLoading: clientsLoading || leadsLoading || activitiesLoading || attorneysLoading,
      shouldRender,
      headline,
      subhead,
    };
  }, [
    companyId,
    isOwnerView,
    myUserInfoId,
    nowMs,
    clients,
    leads,
    activities,
    attorneys,
    clientsLoading,
    leadsLoading,
    activitiesLoading,
    attorneysLoading,
  ]);
}
