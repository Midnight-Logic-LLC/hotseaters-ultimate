/**
 * use-sales-activities.ts — the deals-feature data seam for sales activities
 * and the attorney write-path (RULE B/C).
 *
 * `sales_activity` and `attorney` are NOT Tier-A synced tables, so — like the
 * lead-radar / dashboard hybrid hooks — this hook reads them over Supabase REST
 * through the sales-activity store (RULE D owns the I/O). Components consume
 * THIS hook; they never import the store or the supabase client.
 *
 * Reads are company-scoped and refreshed via a `reload()` bump after every
 * write so the Deal Tracker cards + urgency banner reflect new activity
 * immediately (the bible relies on react-query invalidation; the port has no
 * query cache for these server-only tables, so we re-fetch the company slice).
 *
 * HotSeatersMVP is the bible.
 */

import { useCallback, useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import {
  resolveSalesActivityAnchors,
  type SalesActivityAnchors,
} from '@/features/deals/business-rules/resolve-sales-activity-anchors';
import {
  fetchSalesActivitiesForTrial,
  fetchSalesActivitiesForAttorney,
  createSalesActivity,
  updateSalesActivity,
  deleteSalesActivity,
  getAttorney,
  setAttorneyProspectStatus,
  createAttorney,
  createClient,
  countSalesActivitiesForTrial,
  deleteSalesActivitiesForTrial,
  type SalesActivityRow,
  type AttorneyRecord,
  type SalesActivityInsert,
  type AttorneyInsert,
  type ClientInsert,
  type ClientRecord,
} from '@/features/deals/stores/sales-activity-store';

export type { SalesActivityRow, AttorneyRecord };

export interface UseSalesActivitiesResult {
  /** All company sales activities (newest first). */
  salesActivities: SalesActivityRow[];
  /** All company attorneys (contacts). */
  attorneys: AttorneyRecord[];
  /** Attorneys flagged as active prospects (drive contact-only cards). */
  prospects: AttorneyRecord[];
  isLoading: boolean;
  error: string | null;
  /** Re-fetch the company slice (called automatically after writes). */
  reload: () => void;

  // ── sales_activity writes ──
  createSalesActivity: (input: SalesActivityInsert) => Promise<void>;
  updateSalesActivity: (
    id: string,
    patch: Partial<SalesActivityRow>,
  ) => Promise<void>;
  deleteSalesActivity: (id: string) => Promise<void>;
  /** Resolve { attorney_id, client_id } via the store's attorney lookup. */
  resolveAnchors: (
    attorneyId: string | null | undefined,
    clientIdHint?: string | null,
  ) => Promise<SalesActivityAnchors>;

  // ── attorney / client writes (contact-wizard create paths) ──
  setAttorneyProspectStatus: (id: string, isActive: boolean) => Promise<void>;
  createAttorney: (input: AttorneyInsert) => Promise<AttorneyRecord>;
  createClient: (input: ClientInsert) => Promise<ClientRecord>;

  // ── activity-history reads (deal or contact) ──
  fetchActivitiesFor: (args: {
    trialId?: string | null | undefined;
    attorneyId?: string | null | undefined;
  }) => Promise<SalesActivityRow[]>;

  // ── deal cascade-delete child cleanup ──
  countSalesActivitiesForTrial: (trialId: string) => Promise<number>;
  deleteSalesActivitiesForTrial: (trialId: string) => Promise<void>;
}

export function useSalesActivities(): UseSalesActivitiesResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  // S03: read the now-synced sales_activity / attorney company slices directly
  // from PGlite via the Tier-A live query instead of REST-fetching on mount.
  // Electric pushes new rows into the local view, so writes no longer need a
  // manual refetch — `reload()` is retained as a stable no-op for callers.
  const { rows: rawActivities, loading: activitiesLoading } =
    useTierAQuery<SalesActivityRow>('sales_activity', companyId);
  const { rows: attorneys, loading: attorneysLoading } =
    useTierAQuery<AttorneyRecord>('attorney', companyId);

  const isLoading = activitiesLoading || attorneysLoading;
  // Local reads degrade to an empty result rather than throwing; preserved in
  // the return shape so callers don't break.
  const error: string | null = null;

  // useTierAQuery orders by `id`; the bible (getSalesPageData) shows activities
  // newest-first by created_at, so re-sort to preserve that contract.
  const salesActivities = useMemo(
    () =>
      [...rawActivities].sort((a, b) => {
        const aTs = a.created_at ?? '';
        const bTs = b.created_at ?? '';
        if (aTs < bTs) return 1;
        if (aTs > bTs) return -1;
        return 0;
      }),
    [rawActivities],
  );

  // Local reads are reactive; nothing to refetch. Kept as a stable no-op so the
  // write paths that call reload() after a mutation keep their signatures.
  const reload = useCallback(() => {}, []);

  const resolveAnchors = useCallback(
    (
      attorneyId: string | null | undefined,
      clientIdHint?: string | null,
    ): Promise<SalesActivityAnchors> =>
      resolveSalesActivityAnchors(attorneyId, clientIdHint, {
        fetchAttorney: getAttorney,
      }),
    [],
  );

  const doCreate = useCallback(
    async (input: SalesActivityInsert) => {
      await createSalesActivity(input);
      reload();
    },
    [reload],
  );

  const doUpdate = useCallback(
    async (id: string, patch: Partial<SalesActivityRow>) => {
      await updateSalesActivity(id, patch);
      reload();
    },
    [reload],
  );

  const doDelete = useCallback(
    async (id: string) => {
      await deleteSalesActivity(id);
      reload();
    },
    [reload],
  );

  const doSetProspect = useCallback(
    async (id: string, isActive: boolean) => {
      await setAttorneyProspectStatus(id, isActive);
      reload();
    },
    [reload],
  );

  const doCreateAttorney = useCallback(
    async (input: AttorneyInsert): Promise<AttorneyRecord> => {
      const created = await createAttorney(input);
      reload();
      return created;
    },
    [reload],
  );

  const doCreateClient = useCallback(
    async (input: ClientInsert): Promise<ClientRecord> => {
      const created = await createClient(input);
      reload();
      return created;
    },
    [reload],
  );

  const doFetchActivitiesFor = useCallback(
    ({
      trialId,
      attorneyId,
    }: {
      trialId?: string | null | undefined;
      attorneyId?: string | null | undefined;
    }): Promise<SalesActivityRow[]> => {
      if (trialId) return fetchSalesActivitiesForTrial(trialId);
      if (attorneyId) return fetchSalesActivitiesForAttorney(attorneyId);
      return Promise.resolve([]);
    },
    [],
  );

  const prospects = useMemo(
    () => attorneys.filter((a) => a.is_active_prospect === true),
    [attorneys],
  );

  return useMemo(
    () => ({
      salesActivities,
      attorneys,
      prospects,
      isLoading,
      error,
      reload,
      createSalesActivity: doCreate,
      updateSalesActivity: doUpdate,
      deleteSalesActivity: doDelete,
      resolveAnchors,
      setAttorneyProspectStatus: doSetProspect,
      createAttorney: doCreateAttorney,
      createClient: doCreateClient,
      fetchActivitiesFor: doFetchActivitiesFor,
      countSalesActivitiesForTrial,
      deleteSalesActivitiesForTrial,
    }),
    [
      salesActivities,
      attorneys,
      prospects,
      isLoading,
      error,
      reload,
      doCreate,
      doUpdate,
      doDelete,
      resolveAnchors,
      doSetProspect,
      doCreateAttorney,
      doCreateClient,
      doFetchActivitiesFor,
    ],
  );
}
