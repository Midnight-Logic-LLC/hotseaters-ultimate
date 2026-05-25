/**
 * stale-leads.ts — pure derivation of the "Needs Attention" lead counts.
 *
 * Bible: HotSeatersMVP/src/hooks/useMyStaleLeadsCount.js — the
 * fetch+subscribe machinery lives in the bible hook; this module
 * isolates the pure logic so it can be unit-tested without React.
 *
 * Stale rule (bible lines 118–123):
 *   - lead has NO pending scheduled activity → stale.
 *   - lead has earliest pending activity scheduled BEFORE today → stale.
 *
 * Ownership rule (bible lines 153–158):
 *   - lead → attorney_id → attorney.client_id → client.sales_lead.
 *   - lead is "mine" when client.sales_lead === current_user_info_id.
 */

export interface LeadLike {
  id: string;
  attorney_id?: string | null;
}

export interface ActivityLike {
  lead_id?: string | null;
  scheduled_date?: string | null;
  status?: string | null;
}

export interface AttorneyLike {
  id: string;
  client_id?: string | null;
}

export interface ClientLike {
  id: string;
  sales_lead?: string | null;
}

export interface StaleLeadsCounts {
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

/** Map of lead_id → earliest pending scheduled_date. */
export function earliestPendingByLead(
  activities: ReadonlyArray<ActivityLike>,
): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of activities) {
    if (a.status !== 'pending') continue;
    if (!a.lead_id || !a.scheduled_date) continue;
    const existing = m.get(a.lead_id);
    if (!existing || a.scheduled_date < existing) {
      m.set(a.lead_id, a.scheduled_date);
    }
  }
  return m;
}

/**
 * Compute my-count + total-count for the Needs Attention banner.
 * Pure — no I/O, no clock pulled from the ambient env.
 */
export function computeStaleLeadCounts(args: {
  leads: ReadonlyArray<LeadLike>;
  pendingActivities: ReadonlyArray<ActivityLike>;
  attorneys: ReadonlyArray<AttorneyLike>;
  clients: ReadonlyArray<ClientLike>;
  /** Current user's UserInfo id (mine vs. theirs). */
  myUserInfoId: string | null;
  now: Date;
}): StaleLeadsCounts {
  const todayStr = localTodayStr(args.now);
  const earliest = earliestPendingByLead(args.pendingActivities);
  const clientById = new Map(args.clients.map((c) => [c.id, c]));
  const attorneyById = new Map(args.attorneys.map((a) => [a.id, a]));

  const ownerOfLead = (lead: LeadLike): string | null => {
    const att = lead.attorney_id ? attorneyById.get(lead.attorney_id) : undefined;
    if (!att?.client_id) return null;
    const cli = clientById.get(att.client_id);
    return cli?.sales_lead ?? null;
  };

  let myCount = 0;
  let totalCount = 0;
  for (const lead of args.leads) {
    const sched = earliest.get(lead.id);
    const isStale = !sched || sched < todayStr;
    if (!isStale) continue;
    totalCount += 1;
    if (args.myUserInfoId && ownerOfLead(lead) === args.myUserInfoId) {
      myCount += 1;
    }
  }
  return { myCount, totalCount };
}
