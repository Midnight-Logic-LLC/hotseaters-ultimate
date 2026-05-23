/**
 * daily-minimum-utils.ts — TypeScript port of
 * HotSeatersMVP/src/lib/dailyMinimumUtils.js (the bible).
 *
 * Pure function. Ported line-for-line; types are TS, behavior is identical.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export interface TimeEntryLike {
  id: string;
  service_id?: string | null;
  trial_service_id?: string | null;
  subcontract_assignment_id?: string | null;
  consultant_id?: string | null;
  trial_id?: string | null;
  start_time?: string | null;
  start_timezone?: string | null;
  duration_hours?: number | null;
  rate?: number | null;
}

export interface ServiceLike {
  id: string;
  has_daily_minimum?: boolean | null;
}

export interface TrialDailyMinLike {
  daily_minimum_hours?: number | null;
}

export interface CompanyDailyMinLike {
  default_daily_minimum_hours?: number | null;
}

export interface TrialServiceForBilling {
  id: string;
  trial_id?: string | null;
  service_id?: string | null;
  final_billing_method?: string | null;
}

export interface DailyMinAdjustment {
  billed_duration_hours: number;
  billed_amount: number;
  wasBumped: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calculate daily-minimum billing adjustments for time entries.
 *
 * See MVP `dailyMinimumUtils.js` header for the full rule set. Behavior is
 * identical here.
 */
export function calculateDailyMinimumAdjustments(
  selectedEntries: TimeEntryLike[] | null | undefined,
  services: ServiceLike[],
  trial: TrialDailyMinLike | null | undefined,
  company: CompanyDailyMinLike | null | undefined,
  trialServices: TrialServiceForBilling[] | null | undefined,
  disabledEntryIds?: Set<string> | null,
): Record<string, DailyMinAdjustment> {
  const adjustments: Record<string, DailyMinAdjustment> = {};
  if (!selectedEntries?.length) return adjustments;

  const dailyMinHours =
    trial?.daily_minimum_hours ||
    company?.default_daily_minimum_hours ||
    8;

  const tsHasDailyMinBilling = (ts: TrialServiceForBilling) =>
    ts.final_billing_method === 'daily_minimum' ||
    ts.final_billing_method === 'split';

  const isDailyMinEntry = (entry: TimeEntryLike): boolean => {
    // Canonical path (Phase 3) — resolve by trial_service_id.
    if (entry.trial_service_id && trialServices?.length) {
      const ts = trialServices.find((t) => t.id === entry.trial_service_id);
      if (ts) return tsHasDailyMinBilling(ts);
    }

    // HSH fallback: subcontract_assignment_id only.
    if (entry.subcontract_assignment_id && trialServices?.length) {
      const trialTs = trialServices.filter(
        (ts) => ts.trial_id === entry.trial_id,
      );
      if (trialTs.some(tsHasDailyMinBilling)) return true;
    }

    // Regular-entry legacy path.
    const svc = services.find((s) => s.id === entry.service_id);
    if (!svc?.has_daily_minimum) return false;
    if (!trialServices?.length) return true;
    const ts = trialServices.find((t) => t.service_id === entry.service_id);
    if (!ts) return true;
    return tsHasDailyMinBilling(ts);
  };

  // Group by consultant + local-tz date + trial.
  const groups: Record<string, TimeEntryLike[]> = {};
  for (const entry of selectedEntries) {
    let dateStr = 'unknown';
    if (entry.start_time) {
      const tz = entry.start_timezone;
      if (tz) {
        try {
          dateStr = new Date(entry.start_time).toLocaleDateString('en-CA', {
            timeZone: tz,
          });
        } catch {
          dateStr = new Date(entry.start_time).toISOString().split('T')[0]!;
        }
      } else {
        dateStr = new Date(entry.start_time).toISOString().split('T')[0]!;
      }
    }
    const key = `${entry.consultant_id}|${dateStr}|${entry.trial_id}`;
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(entry);
  }

  for (const groupEntries of Object.values(groups)) {
    const hasDailyMinService = groupEntries.some(isDailyMinEntry);

    if (!hasDailyMinService) {
      for (const e of groupEntries) {
        adjustments[e.id] = {
          billed_duration_hours: e.duration_hours ?? 0,
          billed_amount: round2((e.duration_hours ?? 0) * (e.rate ?? 0)),
          wasBumped: false,
        };
      }
      continue;
    }

    const totalHours = groupEntries.reduce(
      (sum, e) => sum + (e.duration_hours ?? 0),
      0,
    );

    if (totalHours >= dailyMinHours) {
      for (const e of groupEntries) {
        adjustments[e.id] = {
          billed_duration_hours: e.duration_hours ?? 0,
          billed_amount: round2((e.duration_hours ?? 0) * (e.rate ?? 0)),
          wasBumped: false,
        };
      }
      continue;
    }

    const disabled = disabledEntryIds || new Set<string>();
    const dailyMinEntries = groupEntries
      .filter((e) => isDailyMinEntry(e) && !disabled.has(e.id))
      .sort(
        (a, b) =>
          new Date(a.start_time ?? 0).getTime() -
          new Date(b.start_time ?? 0).getTime(),
      );

    if (dailyMinEntries.length === 0) {
      for (const e of groupEntries) {
        adjustments[e.id] = {
          billed_duration_hours: e.duration_hours ?? 0,
          billed_amount: round2((e.duration_hours ?? 0) * (e.rate ?? 0)),
          wasBumped: false,
        };
      }
      continue;
    }

    const lastDailyMinEntry = dailyMinEntries[dailyMinEntries.length - 1]!;
    const deficit = dailyMinHours - totalHours;

    for (const e of groupEntries) {
      if (e.id === lastDailyMinEntry.id) {
        const bumpedHours = (e.duration_hours ?? 0) + deficit;
        adjustments[e.id] = {
          billed_duration_hours: round2(bumpedHours),
          billed_amount: round2(bumpedHours * (e.rate ?? 0)),
          wasBumped: true,
        };
      } else {
        adjustments[e.id] = {
          billed_duration_hours: e.duration_hours ?? 0,
          billed_amount: round2((e.duration_hours ?? 0) * (e.rate ?? 0)),
          wasBumped: false,
        };
      }
    }
  }

  return adjustments;
}
