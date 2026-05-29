/**
 * use-needs-attention — sales "needs attention" counter for the
 * NeedsAttentionBanner (and the Deal Tracker sidebar badge).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 712–756 +
 * HotSeatersMVP/src/hooks/useMyStaleDealsCount.js.
 *
 * The Leads→Deals re-architecture (change-D07) pivoted this banner from a
 * LEADS model to a DEALS+prospects model. The counted scope is now:
 *   • Deals — active sales-stage Trials (not lost/settled), anchored by trial.
 *   • Contact-only prospects — is_active_prospect Attorneys with no sales-stage
 *     Trial pointing at them, anchored by attorney.
 * "Needs attention" = no pending next step OR overdue OR due-today.
 *
 * Counters:
 *   • myCount    — items owned by the current user (deal.consultant_id === me,
 *                  or the prospect's firm client.sales_lead === me).
 *   • totalCount — all qualifying items company-wide (owner-only display).
 *
 * Data sources (RULE C — this hook composes other hooks, never reaches the
 * network itself):
 *   • useDealsTrialsData('deals') — D02/D04 trials + Tier-1 pipelineStages.
 *   • useSalesActivities()        — D04 sales-activity seam (attorneys +
 *                                   pending activities, company-scoped REST).
 *   • useClientsList()            — Tier-A clients (firm.sales_lead ownership).
 *   • useTier1() / useCurrentUser() — role + my UserInfo id.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';
import { useDealsTrialsData } from '@/features/deals/hooks/use-deals-trials-data';
import { useSalesActivities } from '@/features/deals/hooks/use-sales-activities';
import {
  computeStaleDealCounts,
  type AttorneyLike,
  type ClientLike,
  type PipelineStageLike,
  type SalesActivityLike,
  type StaleDealsCounts,
  type TrialLike,
} from '@/features/dashboard/business-rules/stale-deals';

export interface NeedsAttentionResult extends StaleDealsCounts {
  isLoading: boolean;
  /** True when the banner has anything worth showing for the current user. */
  shouldRender: boolean;
  /** Bible-correct primary copy (varies by owner vs. sales view). */
  headline: string;
  /** Bible-correct secondary copy (varies by owner vs. sales view). */
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
  const isOwner = role === 'owner';
  const { userInfo } = useCurrentUser();
  const myUserInfoId = userInfo?.id ?? null;
  const nowMs = opts.now?.getTime();

  const { clients, isLoading: clientsLoading } = useClientsList();
  const {
    trials,
    pipelineStages,
    isLoading: trialsLoading,
  } = useDealsTrialsData({ scope: 'deals' });
  const {
    attorneys,
    salesActivities,
    isLoading: activitiesLoading,
  } = useSalesActivities();

  return useMemo<NeedsAttentionResult>(() => {
    if (!companyId) return EMPTY;
    const now = nowMs !== undefined ? new Date(nowMs) : new Date();

    const pendingActivities = salesActivities.filter(
      (a) => a.status === 'pending',
    ) as unknown as SalesActivityLike[];

    const counts = computeStaleDealCounts({
      trials: trials as unknown as TrialLike[],
      pipelineStages: pipelineStages as unknown as PipelineStageLike[],
      attorneys: attorneys as unknown as AttorneyLike[],
      clients: clients as unknown as ClientLike[],
      pendingActivities,
      myUserInfoId,
      now,
    });

    // Bible Dashboard.jsx line 713:
    //   showStaleWidget && (staleMyCount > 0 || (isOwner && staleTotalCount > 0))
    // The role-level showStaleWidget gate lives in the widget registry; the
    // per-data gate is here.
    const shouldRender = counts.myCount > 0 || (isOwner && counts.totalCount > 0);

    // Bible Dashboard.jsx lines 737–752.
    const headline = isOwner
      ? `${counts.myCount} of yours / ${counts.totalCount} total need attention`
      : `${counts.myCount} ${counts.myCount === 1 ? 'deal item needs' : 'deal items need'} attention`;
    const subhead = isOwner
      ? 'Overdue or missing a next step — open Deal Tracker to follow up.'
      : 'Overdue or no next step scheduled — open Deal Tracker to follow up.';

    return {
      ...counts,
      isLoading: clientsLoading || trialsLoading || activitiesLoading,
      shouldRender,
      headline,
      subhead,
    };
  }, [
    companyId,
    isOwner,
    myUserInfoId,
    nowMs,
    clients,
    trials,
    pipelineStages,
    attorneys,
    salesActivities,
    clientsLoading,
    trialsLoading,
    activitiesLoading,
  ]);
}
