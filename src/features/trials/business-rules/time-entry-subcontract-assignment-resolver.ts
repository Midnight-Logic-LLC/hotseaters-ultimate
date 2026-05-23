/**
 * time-entry-subcontract-assignment-resolver.ts — TypeScript port of
 * HotSeatersMVP/src/lib/timeEntrySubcontractAssignmentResolver.js (the bible).
 *
 * Pure function. Single replacement for the legacy triangulation by
 * (consultant_id, trial_id, status='active').
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface SubcontractResolverEntry {
  subcontract_assignment_id?: string | null;
}

export interface SubcontractAssignmentCandidate {
  id: string;
}

export function resolveSubcontractAssignmentForEntry<
  T extends SubcontractAssignmentCandidate,
>(
  timeEntry: SubcontractResolverEntry | null | undefined,
  subcontractAssignments: T[] | null | undefined,
): T | null {
  if (!timeEntry?.subcontract_assignment_id || !subcontractAssignments?.length) {
    return null;
  }
  return (
    subcontractAssignments.find(
      (a) => a.id === timeEntry.subcontract_assignment_id,
    ) ?? null
  );
}
