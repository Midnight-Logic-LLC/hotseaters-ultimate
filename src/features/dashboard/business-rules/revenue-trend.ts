/**
 * revenue-trend.ts — fiscal-year monthly + weekly revenue trend buckets,
 * cumulative toggle, least-squares trend line, and annual revenue goal.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 403–525.
 *
 * Pure. Receives bucketed inputs + projection map; emits the recharts-ready
 * datasets. No I/O, no Date.now() — caller injects `now`.
 */

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns';

export interface InvoiceForTrend {
  invoice_date?: string | null;
  total?: number | null;
}

export interface TrendPoint {
  label: string;
  revenue: number;
  projected: number;
}

export interface TrendPointWithTrend extends TrendPoint {
  trend: number | null;
}

export type TrendPeriod = 'month' | 'week';

/** Bible lines 116–120: derive fiscal year for `now`, given start month. */
export function deriveCurrentFiscalYear(
  now: Date,
  fiscalYearStartMonth: number,
): number {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1;
}

/** Bible line 404: 5 fiscal years centered on `fiscalYear`. */
export function availableFiscalYears(fiscalYear: number): number[] {
  return Array.from({ length: 5 }, (_, i) => fiscalYear - 2 + i);
}

/** Bible lines 407–410: fiscal-year start + end. */
export function fiscalYearBoundaries(args: {
  fiscalYear: number;
  fiscalYearStartMonth: number;
}): { start: Date; end: Date } {
  const start = new Date(args.fiscalYear, args.fiscalYearStartMonth - 1, 1);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(0); // last day of prior month
  return { start, end };
}

/**
 * Bible lines 412–437: 12-month buckets across the fiscal year, each
 * carrying actual revenue (from invoices) + projected revenue (from the
 * projection map).
 */
export function monthlyTrend(args: {
  invoices: ReadonlyArray<InvoiceForTrend>;
  /** dateKey (YYYY-MM-DD) → projected revenue (already computed). */
  projectedInvoices: ReadonlyMap<string, number>;
  fiscalYearStart: Date;
}): TrendPoint[] {
  const { invoices, projectedInvoices, fiscalYearStart } = args;
  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = addMonths(fiscalYearStart, i);
    const mStart = startOfMonth(monthDate);
    const mEnd = endOfMonth(monthDate);

    let revenue = 0;
    for (const inv of invoices) {
      if (!inv.invoice_date) continue;
      const d = parseISO(inv.invoice_date);
      if (d >= mStart && d <= mEnd) revenue += inv.total ?? 0;
    }

    let projected = 0;
    for (const [dateKey, amount] of projectedInvoices.entries()) {
      const d = parseISO(dateKey);
      if (d >= mStart && d <= mEnd) projected += amount;
    }

    return {
      label: format(monthDate, 'MMM yy'),
      revenue,
      projected,
    };
  });
}

/**
 * Bible lines 439–468: 52 weekly buckets starting from the Sunday on/after
 * fiscal year start.
 */
export function weeklyTrend(args: {
  invoices: ReadonlyArray<InvoiceForTrend>;
  projectedInvoices: ReadonlyMap<string, number>;
  fiscalYearStart: Date;
}): TrendPoint[] {
  const { invoices, projectedInvoices, fiscalYearStart } = args;
  const fyDay = fiscalYearStart.getDay();
  const daysUntilSunday = fyDay === 0 ? 0 : 7 - fyDay;
  const firstSunday = addDays(fiscalYearStart, daysUntilSunday);

  return Array.from({ length: 52 }, (_, i) => {
    const wStart = addDays(firstSunday, i * 7);
    const wEnd = addDays(wStart, 6);

    let revenue = 0;
    for (const inv of invoices) {
      if (!inv.invoice_date) continue;
      const d = parseISO(inv.invoice_date);
      if (d >= wStart && d <= wEnd) revenue += inv.total ?? 0;
    }

    let projected = 0;
    for (const [dateKey, amount] of projectedInvoices.entries()) {
      const d = parseISO(dateKey);
      if (d >= wStart && d <= wEnd) projected += amount;
    }

    return {
      label: format(wStart, 'MMM d'),
      revenue,
      projected,
    };
  });
}

/** Bible lines 473–484: cumulative running totals. */
export function toCumulative(points: ReadonlyArray<TrendPoint>): TrendPoint[] {
  let r = 0;
  let p = 0;
  return points.map((pt) => {
    r += pt.revenue;
    p += pt.projected;
    return { label: pt.label, revenue: r, projected: p };
  });
}

/**
 * Bible lines 489–514: linear least-squares regression of (revenue +
 * projected). Negative trend values are clamped to null (chart skips them).
 */
export function leastSquaresTrend(
  points: ReadonlyArray<TrendPoint>,
): Array<number | null> {
  const n = points.length;
  if (n === 0) return [];
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  points.forEach((pt, i) => {
    const x = i;
    const y = pt.revenue + pt.projected;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return points.map(() => null);
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return points.map((_, i) => {
    const v = slope * i + intercept;
    return v < 0 ? null : v;
  });
}

/** Combine the recharts-ready dataset with a trend column. */
export function attachTrend(
  points: ReadonlyArray<TrendPoint>,
): TrendPointWithTrend[] {
  const t = leastSquaresTrend(points);
  return points.map((pt, i) => ({ ...pt, trend: t[i] ?? null }));
}

/**
 * Bible lines 522–525: revenue goal per period — annual target ÷ N
 * periods, or the full annual target when cumulative.
 */
export function revenueGoalForPeriod(args: {
  annualRevenueTarget: number;
  period: TrendPeriod;
  cumulative: boolean;
}): number {
  if (args.cumulative) return args.annualRevenueTarget;
  const periods = args.period === 'week' ? 52 : 12;
  return args.annualRevenueTarget / periods;
}
