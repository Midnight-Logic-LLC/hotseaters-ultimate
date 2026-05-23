/**
 * trial-service-delete-guard.ts — pure HSH blocker check.
 *
 * Ported from `HotSeatersMVP/src/lib/trialServiceDeleteGuard.js`. The MVP
 * version called `base44.entities.*.filter(...)` to fetch the candidate
 * rows; here we extract the **pure predicate** so the data-fetching seam
 * lives in the store layer (RULE 3). Callers pass in already-loaded
 * subcontract rows.
 *
 * A delete is BLOCKED when at least one of the following is true:
 *   • A `subcontract_request` row with `status` ∈ {open, in_progress}
 *     references one of the `trialServiceIds`.
 *   • A `subcontract_assignment` row with `status === 'active'`
 *     references one of the `trialServiceIds`.
 *
 * Filled / completed / cancelled requests and inactive / completed /
 * cancelled assignments do NOT block — those are historical records and
 * deleting the parent TrialService is fine. See the source MVP file for
 * the full Option-A rationale.
 */

export type SubcontractRequest = {
  trial_service_id: string | null;
  status: string | null;
};

export type SubcontractAssignment = {
  trial_service_id: string | null;
  status: string | null;
};

export interface DeleteGuardResult {
  blocked: boolean;
  blockingRequests: SubcontractRequest[];
  blockingAssignments: SubcontractAssignment[];
}

export function checkTrialServiceDeleteGuard(
  trialServiceIds: ReadonlyArray<string>,
  requests: ReadonlyArray<SubcontractRequest>,
  assignments: ReadonlyArray<SubcontractAssignment>,
): DeleteGuardResult {
  const ids = new Set(trialServiceIds.filter(Boolean));
  if (ids.size === 0) {
    return { blocked: false, blockingRequests: [], blockingAssignments: [] };
  }

  const blockingRequests = requests.filter(
    (r) =>
      r.trial_service_id != null &&
      ids.has(r.trial_service_id) &&
      (r.status === 'open' || r.status === 'in_progress'),
  );

  const blockingAssignments = assignments.filter(
    (a) =>
      a.trial_service_id != null &&
      ids.has(a.trial_service_id) &&
      a.status === 'active',
  );

  return {
    blocked: blockingRequests.length > 0 || blockingAssignments.length > 0,
    blockingRequests,
    blockingAssignments,
  };
}

/** Human-readable summary for confirm/error dialogs. Mirrors MVP. */
export function formatDeleteGuardSummary(result: DeleteGuardResult): string | null {
  if (!result.blocked) return null;
  const lines: string[] = [];
  if (result.blockingAssignments.length > 0) {
    const n = result.blockingAssignments.length;
    lines.push(`${n} active HSH agreement${n === 1 ? '' : 's'}`);
  }
  if (result.blockingRequests.length > 0) {
    const n = result.blockingRequests.length;
    lines.push(`${n} open HSH job posting${n === 1 ? '' : 's'}`);
  }
  return lines.join(' • ');
}
