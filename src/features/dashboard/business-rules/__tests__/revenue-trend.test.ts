import { describe, expect, it } from 'vitest';
import {
  attachTrend,
  availableFiscalYears,
  deriveCurrentFiscalYear,
  fiscalYearBoundaries,
  leastSquaresTrend,
  monthlyTrend,
  revenueGoalForPeriod,
  toCumulative,
  weeklyTrend,
} from '../revenue-trend';

describe('deriveCurrentFiscalYear', () => {
  it('returns current calendar year when month >= fiscal start', () => {
    expect(deriveCurrentFiscalYear(new Date(2026, 6, 1), 1)).toBe(2026);
    expect(deriveCurrentFiscalYear(new Date(2026, 6, 1), 7)).toBe(2026);
  });
  it('returns previous calendar year when month < fiscal start', () => {
    expect(deriveCurrentFiscalYear(new Date(2026, 2, 15), 7)).toBe(2025);
  });
});

describe('availableFiscalYears', () => {
  it('emits 5 years centered on FY', () => {
    expect(availableFiscalYears(2026)).toEqual([2024, 2025, 2026, 2027, 2028]);
  });
});

describe('fiscalYearBoundaries', () => {
  it('returns first and last day of the 12-month fiscal year', () => {
    const r = fiscalYearBoundaries({ fiscalYear: 2026, fiscalYearStartMonth: 7 });
    expect(r.start).toEqual(new Date(2026, 6, 1));
    // FY starting July 1, 2026 ends June 30, 2027.
    expect(r.end).toEqual(new Date(2027, 5, 30));
  });
});

describe('monthlyTrend', () => {
  it('produces 12 buckets and accumulates revenue + projected per month', () => {
    const invoices = [
      { invoice_date: '2026-01-15', total: 1000 },
      { invoice_date: '2026-02-10', total: 500 },
    ];
    const projected = new Map<string, number>([
      ['2026-01-20', 250],
      ['2026-04-01', 100],
    ]);
    const r = monthlyTrend({
      invoices,
      projectedInvoices: projected,
      fiscalYearStart: new Date(2026, 0, 1),
    });
    expect(r.length).toBe(12);
    expect(r[0]).toEqual({ label: 'Jan 26', revenue: 1000, projected: 250 });
    expect(r[1]).toEqual({ label: 'Feb 26', revenue: 500, projected: 0 });
    expect(r[3]).toEqual({ label: 'Apr 26', revenue: 0, projected: 100 });
  });
});

describe('weeklyTrend', () => {
  it('produces 52 buckets starting from the first Sunday on/after FY start', () => {
    const r = weeklyTrend({
      invoices: [],
      projectedInvoices: new Map(),
      fiscalYearStart: new Date(2026, 0, 1), // Thu — first Sunday is Jan 4
    });
    expect(r.length).toBe(52);
    expect(r[0]?.label).toBe('Jan 4');
    expect(r[1]?.label).toBe('Jan 11');
  });
});

describe('toCumulative', () => {
  it('builds running totals over revenue + projected', () => {
    const r = toCumulative([
      { label: 'A', revenue: 100, projected: 50 },
      { label: 'B', revenue: 200, projected: 25 },
      { label: 'C', revenue: 0, projected: 0 },
    ]);
    expect(r).toEqual([
      { label: 'A', revenue: 100, projected: 50 },
      { label: 'B', revenue: 300, projected: 75 },
      { label: 'C', revenue: 300, projected: 75 },
    ]);
  });
});

describe('leastSquaresTrend', () => {
  it('returns a strictly increasing line for monotonically increasing inputs', () => {
    const pts = [
      { label: '1', revenue: 100, projected: 0 },
      { label: '2', revenue: 200, projected: 0 },
      { label: '3', revenue: 300, projected: 0 },
      { label: '4', revenue: 400, projected: 0 },
    ];
    const t = leastSquaresTrend(pts);
    expect(t[0]).toBeCloseTo(100, 5);
    expect(t[1]).toBeCloseTo(200, 5);
    expect(t[2]).toBeCloseTo(300, 5);
    expect(t[3]).toBeCloseTo(400, 5);
  });

  it('clamps negative trend values to null', () => {
    const pts = [
      { label: '1', revenue: 400, projected: 0 },
      { label: '2', revenue: 300, projected: 0 },
      { label: '3', revenue: 200, projected: 0 },
      { label: '4', revenue: 100, projected: 0 },
    ];
    const t = leastSquaresTrend(pts);
    expect(t[0]).toBeCloseTo(400, 5);
    expect(t[3]).toBeCloseTo(100, 5);
    // Add more points that drive trend below zero
    const longer = [
      ...pts,
      { label: '5', revenue: 50, projected: 0 },
      { label: '6', revenue: 25, projected: 0 },
      { label: '7', revenue: 0, projected: 0 },
      { label: '8', revenue: 0, projected: 0 },
      { label: '9', revenue: 0, projected: 0 },
    ];
    const t2 = leastSquaresTrend(longer);
    expect(t2[t2.length - 1]).toBeNull();
  });
});

describe('attachTrend', () => {
  it('returns same length with trend column', () => {
    const r = attachTrend([
      { label: 'A', revenue: 100, projected: 0 },
      { label: 'B', revenue: 200, projected: 0 },
    ]);
    expect(r.length).toBe(2);
    expect(r[0]).toMatchObject({ label: 'A', revenue: 100, projected: 0 });
    expect(typeof r[0]?.trend === 'number' || r[0]?.trend === null).toBe(true);
  });
});

describe('revenueGoalForPeriod', () => {
  it('returns full annual target when cumulative', () => {
    expect(revenueGoalForPeriod({ annualRevenueTarget: 1_200_000, period: 'month', cumulative: true })).toBe(1_200_000);
  });
  it('divides by 12 for monthly', () => {
    expect(revenueGoalForPeriod({ annualRevenueTarget: 1_200_000, period: 'month', cumulative: false })).toBe(100_000);
  });
  it('divides by 52 for weekly', () => {
    expect(revenueGoalForPeriod({ annualRevenueTarget: 520_000, period: 'week', cumulative: false })).toBe(10_000);
  });
});
