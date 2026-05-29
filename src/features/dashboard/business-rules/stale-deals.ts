/**
 * stale-deals.ts — pure derivation of the "Needs Attention" deal+prospect
 * counts for the dashboard banner and the Deal Tracker sidebar badge.
 *
 * Bible: HotSeatersMVP/src/hooks/useMyStaleDealsCount.js — the fetch+subscribe
 * machinery lives in the bible hook; this module isolates the pure compute so
 * it can be unit-tested without React (the port's use-needs-attention hook
 * supplies the data via the D04 sales-activity seam + Tier-1 + trials).
 *
 * An item "needs attention" when it has any of (bible isStale, lines 131–132):
 *   • NO pending scheduled SalesActivity (no next step), OR
 *   • A pending SalesActivity whose scheduled_date is in the past (overdue), OR
 *   • A pending SalesActivity whose scheduled_date is today (due today).
 * i.e. `isStale(sched) = !sched || sched <= todayStr`. This matches the
 * DealUrgencyBanner three-bucket logic so the badge equals the banner total.
 *
 * Scope (bible lines 134–148):
 *   • Deals — active sales-stage Trials (NOT completion_type 'deal_lost' /
 *     'deal_settled'; pipeline stage.type === 'sales'), anchored by trial_id.
 *   • Contact-only prospects — Attorneys with is_active_prospect === true,
 *     contact_status !== 'transferred', and NOT the primary contact on any
 *     active sales-stage Trial. Anchored by attorney_id (no trial_id).
 *
 * Ownership (bible lines 153–162):
 *   • Deal     → deal.consultant_id === myUserInfoId.
 *   • Prospect → prospect's firm client.sales_lead === myUserInfoId.
 */

export interface TrialLike {
  id: string;
  pipeline_stage_id?: string | null;
  completion_type?: string | null;
  consultant_id?: string | null;
  primary_contact_id?: string | null;
}

export interface PipelineStageLike {
  id: string;
  type?: string | null;
}

export interface SalesActivityLike {
  trial_id?: string | null;
  attorney_id?: string | null;
  scheduled_date?: string | null;
  status?: string | null;
}

export interface AttorneyLike {
  id: string;
  client_id?: string | null;
  is_active_prospect?: boolean | null;
  contact_status?: string | null;
}

export interface ClientLike {
  id: string;
  sales_lead?: string | null;
}

export interface StaleDealsCounts {
  myCount: number;
  totalCount: number;
}

/** YYYY-MM-DD for `now`, in the local zone (matches the bible's todayStr). */
export function localTodayStr(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface EarliestPending {
  byTrial: Map<string, string>;
  byAttorneyContactOnly: Map<string, string>;
}

/**
 * Earliest pending scheduled_date per anchor (bible lines 117–129). Activities
 * anchored to a trial go in `byTrial`; activities anchored only to an attorney
 * (no trial_id) go in `byAttorneyContactOnly`.
 */
export function earliestPendingByAnchor(
  activities: ReadonlyArray<SalesActivityLike>,
): EarliestPending {
  const byTrial = new Map<string, string>();
  const byAttorneyContactOnly = new Map<string, string>();
  for (const a of activities) {
    if (a.status !== 'pending') continue;
    if (!a.scheduled_date) continue;
    if (a.trial_id) {
      const prev = byTrial.get(a.trial_id);
      if (!prev || a.scheduled_date < prev) byTrial.set(a.trial_id, a.scheduled_date);
    } else if (a.attorney_id) {
      const prev = byAttorneyContactOnly.get(a.attorney_id);
      if (!prev || a.scheduled_date < prev) {
        byAttorneyContactOnly.set(a.attorney_id, a.scheduled_date);
      }
    }
  }
  return { byTrial, byAttorneyContactOnly };
}

/**
 * Compute my-count + total-count for the Needs Attention banner / badge.
 * Pure — no I/O, no clock pulled from the ambient env.
 */
export function computeStaleDealCounts(args: {
  trials: ReadonlyArray<TrialLike>;
  pipelineStages: ReadonlyArray<PipelineStageLike>;
  attorneys: ReadonlyArray<AttorneyLike>;
  clients: ReadonlyArray<ClientLike>;
  pendingActivities: ReadonlyArray<SalesActivityLike>;
  /** Current user's UserInfo id (mine vs. theirs). */
  myUserInfoId: string | null;
  now: Date;
}): StaleDealsCounts {
  const todayStr = localTodayStr(args.now);
  const { byTrial, byAttorneyContactOnly } = earliestPendingByAnchor(args.pendingActivities);
  const stageById = new Map(args.pipelineStages.map((s) => [s.id, s]));
  const clientById = new Map(args.clients.map((c) => [c.id, c]));

  // Matches DealUrgencyBanner: no-next-step OR overdue OR due-today.
  const isStale = (sched: string | undefined): boolean => !sched || sched <= todayStr;

  // Deals: active sales-stage trials (not lost/settled).
  const activeDeals = args.trials.filter((t) => {
    if (t.completion_type === 'deal_lost' || t.completion_type === 'deal_settled') return false;
    const stage = t.pipeline_stage_id ? stageById.get(t.pipeline_stage_id) : undefined;
    return stage?.type === 'sales';
  });

  // Contact-only prospects: is_active_prospect, not transferred, and NOT the
  // primary contact on any active sales-stage trial.
  const salesStageContactIds = new Set(
    activeDeals.map((d) => d.primary_contact_id).filter((v): v is string => Boolean(v)),
  );
  const prospects = args.attorneys.filter(
    (a) =>
      a.is_active_prospect === true &&
      a.contact_status !== 'transferred' &&
      !salesStageContactIds.has(a.id),
  );

  let myCount = 0;
  let totalCount = 0;

  for (const deal of activeDeals) {
    if (!isStale(byTrial.get(deal.id))) continue;
    totalCount += 1;
    if (args.myUserInfoId && deal.consultant_id === args.myUserInfoId) myCount += 1;
  }

  for (const prospect of prospects) {
    if (!isStale(byAttorneyContactOnly.get(prospect.id))) continue;
    totalCount += 1;
    const firm = prospect.client_id ? clientById.get(prospect.client_id) : undefined;
    if (args.myUserInfoId && firm?.sales_lead === args.myUserInfoId) myCount += 1;
  }

  return { myCount, totalCount };
}
