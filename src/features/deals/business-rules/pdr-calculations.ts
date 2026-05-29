/**
 * pdr-calculations.ts — Projected Daily Revenue (PDR) computation.
 *
 * Line-for-line port of HotSeatersMVP/src/components/utils/pdrCalculations.jsx
 * `calculateProjectedDailyRevenue`. Pure module — no I/O, no React (RULE J).
 *
 * IMPORTANT (from the bible): the core math here MUST stay in sync with the
 * identical `calculateProjectedDailyRevenue` inside the backend
 * `functions/updateServiceDates`. If you change the calculation, update that
 * copy too (and vice-versa).
 *
 * The port reuses the existing `getServiceSegmentDates` helper from
 * `features/trials/business-rules/trial-segment-utils` (itself a faithful port
 * of the bible's `lib/trialSegmentUtils.js`). HotSeatersMVP is the bible.
 */

import { parseISO, differenceInDays } from 'date-fns';
import {
  getServiceSegmentDates,
  type TrialSegmentLike,
} from '@/features/trials/business-rules/trial-segment-utils';

/** Billing methods the PDR formula branches on. */
export type PdrBillingMethod = 'hourly' | 'daily_minimum' | 'split' | string;

/**
 * Service shape the PDR formula reads. Mirrors the fields the bible's service
 * object carries through `buildServicesFromAnswers`. All optional fields match
 * the bible's `||` / `?.` fallbacks.
 */
export interface PdrService {
  rate?: number | null | undefined;
  start_date?: string | null | undefined;
  end_date?: string | null | undefined;
  segment_id?: string | null | undefined;
  final_billing_method?: PdrBillingMethod | null | undefined;
  /** Per-service override for daily-minimum hours (set in buildServicesFromAnswers). */
  dailyMinimumHours?: number | null | undefined;
  /** Split-billing only: estimated pre-trial hours. */
  pre_trial_estimated_hours?: number | null | undefined;
  /** Hourly only: estimated quantity (hours). */
  estimated_quantity?: number | null | undefined;
}

/** Trial shape the PDR formula reads. */
export interface PdrTrial {
  start_date?: string | null;
  end_date?: string | null;
  daily_minimum_hours?: number | null;
  default_daily_minimum_hours?: number | null;
}

export interface PdrResult {
  pdr: number | null;
  preTrialPdr: number | null;
  inTrialPdr: number | null;
  formula: string;
  preTrialFormula?: string;
  inTrialFormula?: string;
}

const DEFAULT_DAILY_MINIMUM_HOURS = 8;

/**
 * Calculate Projected Daily Revenue (PDR) for a service/task.
 *
 * Returns `{ pdr, preTrialPdr, inTrialPdr, formula, preTrialFormula?, inTrialFormula? }`.
 * Branch order matches the backend exactly: no-rate → daily_minimum → split →
 * hourly.
 */
export function calculateProjectedDailyRevenue(
  service: PdrService | null | undefined,
  trial: PdrTrial | null | undefined,
  segments?: TrialSegmentLike[] | null,
): PdrResult {
  if (!service || !service.rate) {
    return { pdr: 0, preTrialPdr: null, inTrialPdr: null, formula: 'N/A' };
  }

  const rate = service.rate;

  // Determine the effective "trial start/end" for this service's billing
  // threshold. If the service belongs to a segment, use that segment's dates;
  // otherwise use the trial's dates.
  const segmentDates = getServiceSegmentDates(
    { segment_id: service.segment_id ?? null },
    { start_date: trial?.start_date ?? null, end_date: trial?.end_date ?? null },
    segments,
  );
  const effectiveTrialStart = segmentDates.start_date;

  const startDate = parseISO(service.start_date || effectiveTrialStart);
  const endDate = parseISO(
    service.end_date ||
      segmentDates.end_date ||
      service.start_date ||
      effectiveTrialStart,
  );
  const days = differenceInDays(endDate, startDate) + 1;

  // Daily minimum billing (dark bar) — checked BEFORE split to match backend.
  if (service.final_billing_method === 'daily_minimum') {
    const dailyMinHours =
      service.dailyMinimumHours ||
      trial?.daily_minimum_hours ||
      trial?.default_daily_minimum_hours ||
      DEFAULT_DAILY_MINIMUM_HOURS;
    const pdr = dailyMinHours * rate;
    const formula = `${rate}/hr×${dailyMinHours}hr=$${pdr.toFixed(2)}/day`;
    return { pdr, preTrialPdr: null, inTrialPdr: null, formula };
  }

  // Split billing — use the segment start date as the threshold (not the trial
  // bookend start).
  if (service.final_billing_method === 'split' && effectiveTrialStart) {
    const preTrialHours = service.pre_trial_estimated_hours || 0;
    const dailyMinHours =
      service.dailyMinimumHours ||
      trial?.daily_minimum_hours ||
      trial?.default_daily_minimum_hours ||
      DEFAULT_DAILY_MINIMUM_HOURS;

    const thresholdDate = parseISO(effectiveTrialStart);
    const daysBeforeTrial = Math.max(0, differenceInDays(thresholdDate, startDate));

    // Pre-trial PDR (hourly).
    const preTrialPdr = daysBeforeTrial > 0 ? (preTrialHours * rate) / daysBeforeTrial : 0;
    const preTrialFormula = `${preTrialHours}hr×$${rate}/hr÷${daysBeforeTrial}d=$${preTrialPdr.toFixed(2)}/day`;

    // In-trial PDR (daily minimum).
    const inTrialPdr = dailyMinHours * rate;
    const inTrialFormula = `${rate}/hr×${dailyMinHours}hr=$${inTrialPdr.toFixed(2)}/day`;

    // For split billing, the main PDR is null (use the two separate fields).
    const formula = `Split: Pre=$${preTrialPdr.toFixed(2)}/day, In=$${inTrialPdr.toFixed(2)}/day`;

    return { pdr: null, preTrialPdr, inTrialPdr, formula, preTrialFormula, inTrialFormula };
  }

  // Hourly billing (light bar).
  const estimatedHours = service.estimated_quantity || 0;
  const pdr = estimatedHours > 0 && days > 0 ? (estimatedHours * rate) / days : 0;
  const formula = `${estimatedHours}hr×$${rate}/hr÷${days}d=$${pdr.toFixed(2)}/day`;
  return { pdr, preTrialPdr: null, inTrialPdr: null, formula };
}

/**
 * Format PDR for display in debug info — mirrors the bible's
 * `formatPDRDebugInfo`.
 */
export function formatPdrDebugInfo(
  service: PdrService | null | undefined,
  trial: PdrTrial | null | undefined,
): string {
  const { formula } = calculateProjectedDailyRevenue(service, trial);
  return formula;
}
