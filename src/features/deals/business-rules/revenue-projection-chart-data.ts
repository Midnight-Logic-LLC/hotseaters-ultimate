/**
 * revenue-projection-chart-data.ts — pure builder for the Revenue Projections
 * chart series.
 *
 * Ported EXACTLY (RULE J) from the `finalChartData` / `nonCumulativeChartData`
 * useMemos in HotSeatersMVP/src/components/sales/RevenueProjectionsTab.jsx
 * (lines 72–202). Splits 52 weekly / 12 monthly fiscal periods and, per period,
 * sums realized revenue (payments), unpaid invoices, and per-case projected /
 * full-potential values from the detailed billing records. Cumulative mode
 * carries running totals and adds the cumulative goal/breakeven line series.
 *
 * Pure: no I/O, no React. HotSeatersMVP is the bible.
 */

import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  addDays,
} from 'date-fns';
import type {
  ChartRow,
  DetailedRecord,
  PaymentRow,
  UnpaidInvoiceRow,
} from '@/features/sales/components/revenue-projections-types';

export type ChartPeriod = 'week' | 'month';

/** Period payment row — needs a date for bucketing. */
export interface ChartPaymentRow extends PaymentRow {
  payment_date?: string | null;
}

/** Period invoice row — needs an issue date + status for the unpaid bucket. */
export interface ChartInvoiceRow extends UnpaidInvoiceRow {
  id?: string | null;
  invoice_date?: string | null;
  status?: string | null;
}

export interface BuildChartDataInput {
  detailedRecords: DetailedRecord[];
  invoices: ChartInvoiceRow[];
  payments: ChartPaymentRow[];
  caseNames: string[];
  timePeriod: ChartPeriod;
  fiscalYearStart: Date;
  showCumulative: boolean;
  /** Per-period dollar goals — only used to seed the cumulative line series. */
  monthlyBreakeven: number;
  annualRevenueTarget: number;
  breakevenPerPeriod: number;
  goalPerPeriod: number;
}

interface PeriodWindow {
  label: string;
  start: Date;
  end: Date;
}

/** Build the 52 weekly / 12 monthly period windows for the fiscal year. */
function buildPeriods(fiscalYearStart: Date, timePeriod: ChartPeriod): PeriodWindow[] {
  if (timePeriod === 'week') {
    const fiscalYearDay = fiscalYearStart.getDay();
    const daysUntilSunday = fiscalYearDay === 0 ? 0 : 7 - fiscalYearDay;
    const firstSunday = addDays(fiscalYearStart, daysUntilSunday);
    return Array.from({ length: 52 }, (_, i) => {
      const start = addDays(firstSunday, i * 7);
      const end = addDays(start, 6);
      return { label: format(start, 'MMM d'), start, end };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const monthDate = addMonths(fiscalYearStart, i);
    return {
      label: format(monthDate, 'MMM yy'),
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    };
  });
}

/** Compute the non-cumulative per-period base rows. */
function buildBaseRows(
  periods: PeriodWindow[],
  input: BuildChartDataInput,
): ChartRow[] {
  const { detailedRecords, invoices, payments, caseNames } = input;

  // Pre-parse each item's date ONCE up front, rather than re-parsing inside the
  // per-period filter (was parseISO'd twice per item per period). `null` marks
  // a missing/empty date so the period filter skips it.
  const parsedPayments = payments.map((p) => ({
    payment: p,
    date: p.payment_date ? parseISO(p.payment_date) : null,
  }));
  const parsedInvoices = invoices.map((inv) => ({
    invoice: inv,
    date: inv.invoice_date ? parseISO(inv.invoice_date) : null,
  }));

  return periods.map((period) => {
    const row: ChartRow = {
      month: period.label,
      revenue: 0,
      unpaid: 0,
      projected: 0,
      fullPotential: 0,
      fullPotentialDelta: 0,
    };

    const periodPayments = parsedPayments
      .filter((p) => p.date && p.date >= period.start && p.date <= period.end)
      .map((p) => p.payment);
    row.revenue = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    row._payments = periodPayments;

    const periodInvoices = parsedInvoices
      .filter((inv) => inv.date && inv.date >= period.start && inv.date <= period.end)
      .map((inv) => inv.invoice);
    const unpaidInvoices = periodInvoices.filter((inv) => inv.status !== 'paid');
    row.unpaid = unpaidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    row._unpaidInvoices = unpaidInvoices;

    const periodRecords = detailedRecords.filter((record) => {
      const recordDate = parseISO(record.billingDateKey);
      return recordDate >= period.start && recordDate <= period.end;
    });

    let totalProjected = 0;
    let totalFullPotential = 0;
    caseNames.forEach((caseName) => {
      const caseRecords = periodRecords.filter((r) => r.dealTrial === caseName);
      const proj = caseRecords.reduce((sum, r) => sum + r.projectedValue, 0);
      const full = caseRecords.reduce((sum, r) => sum + r.fullValue, 0);
      row[`proj_${caseName}`] = proj;
      row[`full_${caseName}`] = full;
      totalProjected += proj;
      totalFullPotential += full;
    });

    row.projected = totalProjected;
    row.fullPotentialDelta = Math.max(0, totalFullPotential - totalProjected);
    row.fullPotential = totalFullPotential;

    return row;
  });
}

/**
 * buildChartData — the chart's primary series. When `showCumulative` is true,
 * carries running totals and emits cumulative goal/breakeven line points.
 */
export function buildChartData(input: BuildChartDataInput): ChartRow[] {
  const periods = buildPeriods(input.fiscalYearStart, input.timePeriod);
  const data = buildBaseRows(periods, input);

  if (!input.showCumulative) return data;

  const {
    caseNames,
    monthlyBreakeven,
    annualRevenueTarget,
    breakevenPerPeriod,
    goalPerPeriod,
  } = input;

  let cumRevenue = 0;
  let cumUnpaid = 0;
  const cumPayments: ChartPaymentRow[] = [];
  const cumUnpaidInvoices: ChartInvoiceRow[] = [];
  const cumProj: Record<string, number> = {};
  const cumFull: Record<string, number> = {};
  caseNames.forEach((c) => {
    cumProj[c] = 0;
    cumFull[c] = 0;
  });

  return data.map((item, i) => {
    cumRevenue += item.revenue;
    cumUnpaid += item.unpaid;
    if (item._payments) cumPayments.push(...(item._payments as ChartPaymentRow[]));
    if (item._unpaidInvoices) cumUnpaidInvoices.push(...(item._unpaidInvoices as ChartInvoiceRow[]));

    const row: ChartRow = {
      month: item.month,
      revenue: cumRevenue,
      unpaid: cumUnpaid,
      projected: 0,
      fullPotential: 0,
      fullPotentialDelta: 0,
      _payments: [...cumPayments],
      _unpaidInvoices: [...cumUnpaidInvoices],
    };

    let totalProj = 0;
    let totalFull = 0;
    caseNames.forEach((c) => {
      cumProj[c] = (cumProj[c] ?? 0) + ((item[`proj_${c}`] as number) || 0);
      cumFull[c] = (cumFull[c] ?? 0) + ((item[`full_${c}`] as number) || 0);
      row[`proj_${c}`] = cumProj[c];
      row[`full_${c}`] = cumFull[c];
      totalProj += cumProj[c] ?? 0;
      totalFull += cumFull[c] ?? 0;
    });
    row.projected = totalProj;
    row.fullPotentialDelta = Math.max(0, totalFull - totalProj);
    row.fullPotential = totalFull;

    if (monthlyBreakeven > 0) row.cumulativeBreakeven = breakevenPerPeriod * (i + 1);
    if (annualRevenueTarget > 0) row.cumulativeGoal = goalPerPeriod * (i + 1);
    return row;
  });
}
