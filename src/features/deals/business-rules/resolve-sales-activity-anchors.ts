/**
 * resolve-sales-activity-anchors.ts — port of
 * HotSeatersMVP/src/lib/resolveSalesActivityAnchors.js.
 *
 * Phase 2 (CRM Refactor): resolve the canonical anchor pair for a
 * `sales_activity` row from the `attorney` record at write-time. Every
 * sales_activity must carry BOTH `attorney_id` and `client_id`; this helper
 * returns the pair so callers can't forget to stamp `client_id`.
 *
 * Adaptation (RULE 0 / RULE C): the bible reaches the network directly
 * (`base44.entities.Attorney.get`). The port keeps the pure decision logic
 * here and injects the attorney-fetch as a dependency, so the hint
 * short-circuit and the error branches are unit-testable WITHOUT a network.
 * The write-side lookup itself lives in the sales-activity store and is passed
 * in by the hook (RULE D).
 *
 * Returns: { attorney_id, client_id }.
 * Throws if the attorney can't be resolved or has no `client_id`
 * (a data-integrity bug, surfaced rather than silently swallowed).
 *
 * HotSeatersMVP is the bible.
 */

export interface SalesActivityAnchors {
  attorney_id: string;
  client_id: string;
}

/** Minimal attorney shape the resolver needs (just the client_id link). */
export interface AnchorAttorney {
  id: string;
  client_id?: string | null;
}

/** Fetch the attorney by id (store-provided in the app; mocked in tests). */
export type FetchAttorney = (
  attorneyId: string,
) => Promise<AnchorAttorney | null>;

export interface ResolveAnchorsDeps {
  fetchAttorney: FetchAttorney;
}

export async function resolveSalesActivityAnchors(
  attorneyId: string | null | undefined,
  clientIdHint: string | null | undefined,
  deps: ResolveAnchorsDeps,
): Promise<SalesActivityAnchors> {
  if (!attorneyId) {
    throw new Error('resolveSalesActivityAnchors: attorneyId is required');
  }
  // Prefer the already-known Attorney.client_id from surrounding state so we
  // avoid an extra round-trip. Only fetch when the hint is missing.
  if (clientIdHint) {
    return { attorney_id: attorneyId, client_id: clientIdHint };
  }
  const attorney = await deps.fetchAttorney(attorneyId);
  if (!attorney) {
    throw new Error(
      `resolveSalesActivityAnchors: Attorney ${attorneyId} not found`,
    );
  }
  if (!attorney.client_id) {
    throw new Error(
      `resolveSalesActivityAnchors: Attorney ${attorneyId} has no client_id`,
    );
  }
  return { attorney_id: attorneyId, client_id: attorney.client_id };
}
