/**
 * time-entry-trial-service-resolver.ts — TypeScript port of
 * HotSeatersMVP/src/lib/timeEntryTrialServiceResolver.js (the bible).
 *
 * Pure function. No I/O. Single replacement for legacy
 * trialServices.find(ts => ts.trial_id === entry.trial_id
 *                        && ts.service_id === entry.service_id)
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface TrialServiceResolverEntry {
  trial_service_id?: string | null;
}

export interface TrialServiceCandidate {
  id: string;
}

/**
 * Resolve the canonical TrialService row for a given TimeEntry.
 *
 * See the MVP file header for the intentional null cases:
 *  - travel-time entries discriminated by `original_trial_service_id`
 *  - subcontractor-side HSH entries (no local TrialService)
 *  - missing trial_service_id (no fallback by design)
 */
export function resolveTrialServiceForEntry<T extends TrialServiceCandidate>(
  timeEntry: TrialServiceResolverEntry | null | undefined,
  trialServices: T[] | null | undefined,
): T | null {
  if (!timeEntry?.trial_service_id || !trialServices?.length) return null;
  return (
    trialServices.find((ts) => ts.id === timeEntry.trial_service_id) ?? null
  );
}
