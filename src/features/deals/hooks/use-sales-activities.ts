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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import {
  resolveSalesActivityAnchors,
  type SalesActivityAnchors,
} from '@/features/deals/business-rules/resolve-sales-activity-anchors';
import {
  fetchSalesActivitiesForCompany,
  fetchAttorneysForCompany,
  createSalesActivity,
  updateSalesActivity,
  deleteSalesActivity,
  getAttorney,
  setAttorneyProspectStatus,
  countSalesActivitiesForTrial,
  deleteSalesActivitiesForTrial,
  type SalesActivityRow,
  type AttorneyRecord,
  type SalesActivityInsert,
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

  // ── attorney writes ──
  setAttorneyProspectStatus: (id: string, isActive: boolean) => Promise<void>;

  // ── deal cascade-delete child cleanup ──
  countSalesActivitiesForTrial: (trialId: string) => Promise<number>;
  deleteSalesActivitiesForTrial: (trialId: string) => Promise<void>;
}

export function useSalesActivities(): UseSalesActivitiesResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const [salesActivities, setSalesActivities] = useState<SalesActivityRow[]>([]);
  const [attorneys, setAttorneys] = useState<AttorneyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setSalesActivities([]);
      setAttorneys([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      try {
        const [acts, atts] = await Promise.all([
          fetchSalesActivitiesForCompany(companyId),
          fetchAttorneysForCompany(companyId),
        ]);
        if (cancelled) return;
        setSalesActivities(acts);
        setAttorneys(atts);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load activity.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, reloadKey]);

  const reload = useCallback(() => {
    if (aliveRef.current) setReloadKey((k) => k + 1);
  }, []);

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
    ],
  );
}
