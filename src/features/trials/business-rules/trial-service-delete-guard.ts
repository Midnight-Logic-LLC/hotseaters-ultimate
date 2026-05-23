/**
 * trial-service-delete-guard.ts — TypeScript port of
 * HotSeatersMVP/src/lib/trialServiceDeleteGuard.js (the bible).
 *
 * **Pure-function port.** The MVP file pulled SubcontractRequest /
 * SubcontractAssignment rows over the base44 SDK (I/O). Per RULE 3, I/O
 * cannot live in `business-rules/*` — so the I/O wrapper is the caller's
 * responsibility (a feature hook will fetch the candidate rows via
 * `useEntityList` and pass them into `findHSHBlockers` here).
 *
 * The blocker decision logic itself is ported line-for-line.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface SubcontractRequestLike {
  trial_service_id?: string | null;
  status?: string | null;
  service_name?: string | null;
}

export interface SubcontractAssignmentLike {
  trial_service_id?: string | null;
  status?: string | null;
  consultant_first_name?: string | null;
  consultant_last_name?: string | null;
}

export interface BlockerResult {
  blocked: boolean;
  requests: SubcontractRequestLike[];
  assignments: SubcontractAssignmentLike[];
}

/**
 * Pure variant of MVP `checkHSHBlockers`.
 *
 * Given pre-fetched company-scoped request/assignment lists, return the
 * blockers for the trial-service ids about to be deleted.
 *
 * Blocking criteria (verbatim from MVP):
 *   - SubcontractRequest with status ∈ {open, in_progress} AND
 *     trial_service_id ∈ ids
 *   - SubcontractAssignment with status === "active" AND
 *     trial_service_id ∈ ids
 */
export function findHSHBlockers(
  trialServiceIds: ReadonlyArray<string | null | undefined>,
  allRequests: SubcontractRequestLike[],
  allAssignments: SubcontractAssignmentLike[],
): BlockerResult {
  const ids = (trialServiceIds ?? []).filter(
    (v): v is string => typeof v === 'string' && v.length > 0,
  );
  if (ids.length === 0) {
    return { blocked: false, requests: [], assignments: [] };
  }
  const idSet = new Set(ids);

  const requests = allRequests.filter(
    (r) =>
      r.trial_service_id != null &&
      idSet.has(r.trial_service_id) &&
      (r.status === 'open' || r.status === 'in_progress'),
  );
  const assignments = allAssignments.filter(
    (a) =>
      a.trial_service_id != null &&
      idSet.has(a.trial_service_id) &&
      a.status === 'active',
  );

  return {
    blocked: requests.length > 0 || assignments.length > 0,
    requests,
    assignments,
  };
}

/**
 * Build a human-readable summary of the blockers for a confirm/error dialog.
 * Returns null when nothing blocks. Ported verbatim from MVP.
 */
export function formatBlockerSummary({
  requests,
  assignments,
}: {
  requests?: SubcontractAssignmentLike[] | SubcontractRequestLike[] | null;
  assignments?: SubcontractAssignmentLike[] | null;
}): string | null {
  const r = (requests ?? []) as SubcontractRequestLike[];
  const a = assignments ?? [];
  if (r.length === 0 && a.length === 0) return null;

  const lines: string[] = [];
  if (a.length > 0) {
    lines.push(
      `${a.length} active HSH agreement${a.length === 1 ? '' : 's'}: ` +
        a
          .map((x) =>
            `${x.consultant_first_name ?? ''} ${x.consultant_last_name ?? ''}`
              .trim() || 'unnamed',
          )
          .join(', '),
    );
  }
  if (r.length > 0) {
    lines.push(
      `${r.length} open HSH job posting${r.length === 1 ? '' : 's'}: ` +
        r.map((x) => x.service_name ?? 'unnamed').join(', '),
    );
  }
  return lines.join(' • ');
}
