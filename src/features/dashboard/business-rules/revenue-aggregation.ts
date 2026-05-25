/**
 * revenue-aggregation.ts — pure revenue calculations for the dashboard.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 184–207, 672–677.
 *
 * All functions are pure: they accept already-loaded invoice rows + a
 * deterministic `now` reference, and return numbers. No I/O, no clocks
 * pulled from the ambient environment — the caller injects `now` so
 * tests can pin time.
 */

import { parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface InvoiceLike {
  invoice_date?: string | null;
  total?: number | null;
  status?: string | null;
  invoice_id?: string | null;
  amount?: number | null;
  duration_hours?: number | null;
}

export interface TimeEntryLike {
  status?: string | null;
  invoice_id?: string | null;
  amount?: number | null;
  duration_hours?: number | null;
}

const OUTSTANDING_STATUSES = new Set(['sent', 'overdue']);

function inRange(iso: string | null | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const d = parseISO(iso);
  return d >= start && d <= end;
}

/** Sum of `total` across invoices whose `invoice_date` falls in [start, end]. */
export function sumInvoicesInRange(
  invoices: ReadonlyArray<InvoiceLike>,
  start: Date,
  end: Date,
): number {
  return invoices.reduce(
    (sum, i) => (inRange(i.invoice_date, start, end) ? sum + (i.total ?? 0) : sum),
    0,
  );
}

/** Year-to-date revenue: sum of invoice totals dated on/after Jan 1 of `now.year`. */
export function computeRevenueYtd(
  invoices: ReadonlyArray<InvoiceLike>,
  now: Date,
): number {
  const start = new Date(now.getFullYear(), 0, 1);
  // Use a sentinel "now" as end so a future-dated invoice (rare) still counts.
  return sumInvoicesInRange(invoices, start, now);
}

/** Count of trials with `won_date >= Jan 1 of now.year`. */
export function computeTrialsYtdCount<T extends { won_date?: string | null }>(
  trials: ReadonlyArray<T>,
  now: Date,
): number {
  const start = new Date(now.getFullYear(), 0, 1);
  let count = 0;
  for (const t of trials) {
    if (t.won_date && parseISO(t.won_date) >= start) count += 1;
  }
  return count;
}

/** Revenue ÷ wonTrials, with zero-protection. Bible line 677. */
export function computeRevenuePerTrialYtd(
  revenueYtd: number,
  trialsYtdCount: number,
): number {
  if (trialsYtdCount <= 0) return 0;
  return revenueYtd / trialsYtdCount;
}

export interface MonthOverMonth {
  thisMonth: number;
  lastMonth: number;
  /** Signed % change. 0 when lastMonth is 0 (avoids divide-by-zero / Infinity). */
  changePct: number;
}

/** Bible lines 184–199 — current vs prior calendar month, % delta. */
export function computeMonthOverMonthRevenue(
  invoices: ReadonlyArray<InvoiceLike>,
  now: Date,
): MonthOverMonth {
  const thisStart = startOfMonth(now);
  const thisEnd = endOfMonth(now);
  const lastStart = startOfMonth(subMonths(now, 1));
  const lastEnd = endOfMonth(subMonths(now, 1));

  const thisMonth = sumInvoicesInRange(invoices, thisStart, thisEnd);
  const lastMonth = sumInvoicesInRange(invoices, lastStart, lastEnd);
  const changePct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  return { thisMonth, lastMonth, changePct };
}

export interface Outstanding {
  amount: number;
  count: number;
}

/** Sum + count of invoices in `sent` or `overdue` status. Bible lines 205–206. */
export function computeOutstandingInvoices(
  invoices: ReadonlyArray<InvoiceLike>,
): Outstanding {
  let amount = 0;
  let count = 0;
  for (const i of invoices) {
    if (i.status && OUTSTANDING_STATUSES.has(i.status)) {
      amount += i.total ?? 0;
      count += 1;
    }
  }
  return { amount, count };
}

export interface Unbilled {
  amount: number;
  hours: number;
}

/**
 * Approved time entries that haven't been attached to an invoice yet.
 * Bible lines 201–203.
 */
export function computeUnbilledTime(
  timeEntries: ReadonlyArray<TimeEntryLike>,
): Unbilled {
  let amount = 0;
  let hours = 0;
  for (const t of timeEntries) {
    if (t.status === 'approved' && !t.invoice_id) {
      amount += t.amount ?? 0;
      hours += t.duration_hours ?? 0;
    }
  }
  return { amount, hours };
}
