/**
 * trial-segment-utils.ts — TypeScript port of
 * HotSeatersMVP/src/lib/trialSegmentUtils.js (the bible).
 *
 * Pure functions. No I/O, no React, no entity-graph access.
 * Ported line-for-line; only changes are:
 *   - TypeScript types (UUID strings instead of ObjectId hex)
 *   - `lodash-es` is NOT used here (MVP didn't use it either).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { parseISO, differenceInDays } from 'date-fns';

export interface TrialLike {
  start_date?: string | null;
  end_date?: string | null;
}

export interface TrialSegmentLike {
  id: string;
  segment_number?: number | null | undefined;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  label?: string | null | undefined;
}

export interface TrialServiceLike {
  segment_id?: string | null;
}

export interface ActiveWindow {
  segment_id: string | null;
  segment_number: number;
  start_date: string;
  end_date: string;
  label: string;
}

/**
 * Get the active date windows for a trial.
 * - If trial has segments, returns those sorted by segment_number.
 * - Otherwise, returns a single window with the trial's own start/end.
 *
 * Single source of truth for "when is this trial active?".
 */
export function getTrialActiveWindows(
  trial: TrialLike,
  segments: TrialSegmentLike[] | null | undefined,
): ActiveWindow[] {
  if (segments && segments.length > 0) {
    return [...segments]
      .sort((a, b) => (a.segment_number ?? 0) - (b.segment_number ?? 0))
      .map((seg) => ({
        segment_id: seg.id,
        segment_number: seg.segment_number ?? 0,
        start_date: seg.start_date ?? '',
        end_date: seg.end_date ?? '',
        label: seg.label || `Segment ${seg.segment_number ?? 0}`,
      }));
  }

  return [
    {
      segment_id: null,
      segment_number: 1,
      start_date: trial.start_date ?? '',
      end_date: trial.end_date ?? '',
      label: 'Trial Dates',
    },
  ];
}

/**
 * Get the effective trial start/end dates for a specific TrialService.
 *
 * If the service has a segment_id, use that segment's dates;
 * otherwise, use the trial's own dates.
 */
export function getServiceSegmentDates(
  service: TrialServiceLike,
  trial: TrialLike,
  segments: TrialSegmentLike[] | null | undefined,
): { start_date: string; end_date: string; segment_number: number } {
  if (service.segment_id && segments && segments.length > 0) {
    const segment = segments.find((s) => s.id === service.segment_id);
    if (segment) {
      return {
        start_date: segment.start_date ?? '',
        end_date: segment.end_date ?? '',
        segment_number: segment.segment_number ?? 0,
      };
    }
  }
  return {
    start_date: trial.start_date ?? '',
    end_date: trial.end_date ?? '',
    segment_number: 1,
  };
}

/**
 * Count the total number of active trial days across all segments.
 */
export function getTotalActiveTrialDays(
  trial: TrialLike,
  segments: TrialSegmentLike[] | null | undefined,
): number {
  const windows = getTrialActiveWindows(trial, segments);
  return windows.reduce((total, w) => {
    if (!w.start_date || !w.end_date) return total;
    const start = parseISO(w.start_date);
    const end = parseISO(w.end_date);
    return total + differenceInDays(end, start) + 1;
  }, 0);
}

/**
 * Check if a trial has multiple segments (i.e., continued mid-trial).
 */
export function hasMultipleSegments(
  segments: TrialSegmentLike[] | null | undefined,
): boolean {
  return !!segments && segments.length > 1;
}

/**
 * Compute the bookend start/end across all segments. Returns null if no
 * segments. Caller persists.
 */
export function calculateTrialBookendDates(
  segments: TrialSegmentLike[] | null | undefined,
): { start_date: string; end_date: string } | null {
  if (!segments || segments.length === 0) return null;
  const sorted = [...segments].sort(
    (a, b) => (a.segment_number ?? 0) - (b.segment_number ?? 0),
  );
  return {
    start_date: sorted[0]!.start_date ?? '',
    end_date: sorted[sorted.length - 1]!.end_date ?? '',
  };
}
