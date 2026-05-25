/**
 * trial-projections.ts — per-task daily projected revenue, split-billing,
 * weekend exclusion, billing-date logic.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 252–401.
 *
 * This is the most complex calculation in the dashboard surface. Preserve
 * behavior byte-for-byte against the bible — RULE J of CLAUDE.md.
 *
 * Pure. All inputs (now, company settings, trials, stages, services,
 * trialServices) are passed in. Returns:
 *   • `tasksWithDailyRevenue` — per-task enriched record with the day-rate
 *     (or split-day-rates) already adjusted by the stage probability.
 *   • `projectedInvoiceMap` — Map<dateKey, $$> bucketed by billing date
 *     for `RevenueTrend` to consume.
 */

import { format, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Types — narrow shapes used by this module only (we don't import the
// full entity types to keep the file pure + decoupled from sync layout).
// ---------------------------------------------------------------------------

export interface ProjectionCompanySettings {
  invoice_period?: 'weekly' | 'monthly' | 'per_trial' | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  per_trial_billing_days_after_end?: number | null;
}

export interface ProjectionStageLike {
  id: string;
  revenue_probability?: number | null;
}

export interface ProjectionTrialLike {
  id: string;
  pipeline_stage_id?: string | null;
  start_date?: string | null;
  bill_for_weekends?: boolean | null;
}

export interface ProjectionServiceLike {
  id: string;
}

export interface ProjectionTrialServiceLike {
  trial_id?: string | null;
  service_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  projected_daily_revenue?: number | null;
  final_billing_method?: 'split' | 'daily_minimum' | 'fixed' | string | null;
  pre_trial_projected_daily_revenue?: number | null;
  in_trial_projected_daily_revenue?: number | null;
}

/** Per-task enriched shape (bible lines 261–298). */
export interface SplitDailyRevenue {
  isSplit: true;
  preTrialDailyRevenue: number;
  inTrialDailyRevenue: number;
  preTrialDays: number;
  inTrialDays: number;
}
export type DailyRevenue = number | SplitDailyRevenue;

export interface TaskWithDailyRevenue {
  trial_id: string | null | undefined;
  service_id: string | null | undefined;
  startDate: Date;
  endDate: Date;
  dailyRevenue: DailyRevenue;
  final_billing_method: ProjectionTrialServiceLike['final_billing_method'];
  trial: ProjectionTrialLike | undefined;
  service: ProjectionServiceLike | undefined;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Bible lines 304–325. Computes the billing date for work performed on
 * `date`, given the company's invoice period settings.
 */
export function getBillingDate(
  date: Date,
  invoicePeriod: ProjectionCompanySettings['invoice_period'] | undefined,
  weeklyBillingDay: string | null | undefined,
  monthlyBillingDate: number | null | undefined,
  perTrialBillingDays: number | null | undefined,
): Date {
  if (invoicePeriod === 'weekly') {
    const targetDay = WEEKDAYS.indexOf(weeklyBillingDay ?? 'Friday');
    const safeTarget = targetDay >= 0 ? targetDay : WEEKDAYS.indexOf('Friday');
    const currentDay = getDayOfWeek(date);
    let daysUntilBilling = (safeTarget - currentDay + 7) % 7;
    if (daysUntilBilling === 0) daysUntilBilling = 7;
    const out = new Date(date);
    out.setDate(date.getDate() + daysUntilBilling);
    return out;
  }
  if (invoicePeriod === 'monthly') {
    const year = date.getMonth() === 11 ? date.getFullYear() + 1 : date.getFullYear();
    const month = date.getMonth() === 11 ? 0 : date.getMonth() + 1;
    return new Date(year, month, monthlyBillingDate ?? 1);
  }
  // per_trial — billing date is N days after the task end date.
  const out = new Date(date);
  out.setDate(date.getDate() + (perTrialBillingDays ?? 7));
  return out;
}

/**
 * Bible lines 253–298. Enriches each `trial_service` with `dailyRevenue`
 * (scalar or split shape), date parsing, and trial/service lookups.
 */
export function enrichTasksWithDailyRevenue(args: {
  trialServices: ReadonlyArray<ProjectionTrialServiceLike>;
  trials: ReadonlyArray<ProjectionTrialLike>;
  stages: ReadonlyArray<ProjectionStageLike>;
  services: ReadonlyArray<ProjectionServiceLike>;
}): TaskWithDailyRevenue[] {
  const trialById = new Map(args.trials.map((t) => [t.id, t]));
  const stageById = new Map(args.stages.map((s) => [s.id, s]));
  const serviceById = new Map(args.services.map((s) => [s.id, s]));

  return args.trialServices
    .filter((ts) => {
      if (!ts.start_date || !ts.end_date) return false;
      return Boolean(ts.projected_daily_revenue) || ts.final_billing_method === 'split';
    })
    .map((ts) => {
      const trial = ts.trial_id ? trialById.get(ts.trial_id) : undefined;
      const stage = trial?.pipeline_stage_id ? stageById.get(trial.pipeline_stage_id) : undefined;
      const probabilityRaw = stage?.revenue_probability;
      const probability =
        typeof probabilityRaw === 'number' && Number.isFinite(probabilityRaw) ? probabilityRaw : 1;
      const service = ts.service_id ? serviceById.get(ts.service_id) : undefined;

      const startDate = parseISO(ts.start_date as string);
      const endDate = parseISO(ts.end_date as string);
      const trialStartDate = trial?.start_date ? parseISO(trial.start_date) : null;

      let dailyRevenue: DailyRevenue;
      if (ts.final_billing_method === 'split' && trialStartDate) {
        const daysBefore = Math.max(
          0,
          Math.ceil((trialStartDate.getTime() - startDate.getTime()) / MS_PER_DAY),
        );
        const daysIn = Math.max(
          0,
          Math.ceil((endDate.getTime() - trialStartDate.getTime()) / MS_PER_DAY) + 1,
        );
        dailyRevenue = {
          isSplit: true,
          preTrialDailyRevenue: (ts.pre_trial_projected_daily_revenue ?? 0) * probability,
          inTrialDailyRevenue: (ts.in_trial_projected_daily_revenue ?? 0) * probability,
          preTrialDays: daysBefore,
          inTrialDays: daysIn,
        };
      } else {
        dailyRevenue = (ts.projected_daily_revenue ?? 0) * probability;
      }

      return {
        trial_id: ts.trial_id,
        service_id: ts.service_id,
        startDate,
        endDate,
        dailyRevenue,
        final_billing_method: ts.final_billing_method,
        trial,
        service,
      };
    });
}

/**
 * Bible lines 327–401. Walks each enriched task and emits projected
 * billable revenue keyed by the billing date.
 */
export function buildProjectedInvoiceMap(args: {
  tasks: ReadonlyArray<TaskWithDailyRevenue>;
  company: ProjectionCompanySettings | null | undefined;
}): Map<string, number> {
  const out = new Map<string, number>();
  const invoicePeriod = args.company?.invoice_period ?? 'monthly';
  const weeklyBillingDay = args.company?.weekly_billing_day ?? 'Friday';
  const monthlyBillingDate = args.company?.monthly_billing_date ?? 1;
  const perTrialBillingDays = args.company?.per_trial_billing_days_after_end ?? 7;

  for (const task of args.tasks) {
    const trialStart = task.trial?.start_date ? parseISO(task.trial.start_date) : null;
    const billWeekends = task.trial?.bill_for_weekends !== false;

    if (invoicePeriod === 'per_trial') {
      // Bible lines 339–366 — bill the whole task at end + N days.
      const billingDate = getBillingDate(
        task.endDate,
        invoicePeriod,
        weeklyBillingDay,
        monthlyBillingDate,
        perTrialBillingDays,
      );
      const dateKey = format(billingDate, 'yyyy-MM-dd');

      let totalRevenue: number;
      if (isSplitRevenue(task.dailyRevenue)) {
        totalRevenue =
          task.dailyRevenue.preTrialDailyRevenue * task.dailyRevenue.preTrialDays +
          task.dailyRevenue.inTrialDailyRevenue * task.dailyRevenue.inTrialDays;
      } else {
        const totalDays = billWeekends
          ? Math.max(1, Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / MS_PER_DAY) + 1)
          : countWeekdays(task.startDate, task.endDate);
        totalRevenue = task.dailyRevenue * totalDays;
      }

      out.set(dateKey, (out.get(dateKey) ?? 0) + totalRevenue);
      continue;
    }

    // Bible lines 367–401 — daily iteration; weekly/monthly billing.
    for (
      let d = new Date(task.startDate);
      d <= task.endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const currentDate = new Date(d);
      // Skip weekends only for daily_minimum + bill_for_weekends == false.
      if (!billWeekends && task.final_billing_method === 'daily_minimum') {
        const dow = currentDate.getDay();
        if (dow === 0 || dow === 6) continue;
      }
      const billingDate = getBillingDate(
        currentDate,
        invoicePeriod,
        weeklyBillingDay,
        monthlyBillingDate,
        perTrialBillingDays,
      );
      const dateKey = format(billingDate, 'yyyy-MM-dd');

      let dayRevenue: number;
      if (isSplitRevenue(task.dailyRevenue)) {
        dayRevenue =
          trialStart && currentDate < trialStart
            ? task.dailyRevenue.preTrialDailyRevenue
            : task.dailyRevenue.inTrialDailyRevenue;
      } else {
        dayRevenue = task.dailyRevenue;
      }
      out.set(dateKey, (out.get(dateKey) ?? 0) + dayRevenue);
    }
  }
  return out;
}

function isSplitRevenue(dr: DailyRevenue): dr is SplitDailyRevenue {
  return typeof dr === 'object' && dr !== null && 'isSplit' in dr && dr.isSplit;
}

/** Bible lines 351–362 — count weekdays in [start, end]. */
export function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, count);
}
