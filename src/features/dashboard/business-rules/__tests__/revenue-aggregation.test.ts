import { describe, expect, it } from 'vitest';
import {
  computeMonthOverMonthRevenue,
  computeOutstandingInvoices,
  computeRevenuePerTrialYtd,
  computeRevenueYtd,
  computeTrialsYtdCount,
  computeUnbilledTime,
  sumInvoicesInRange,
} from '../revenue-aggregation';

// Pin "now" to 2026-03-15 so month/year math is stable.
const NOW = new Date('2026-03-15T12:00:00Z');

describe('sumInvoicesInRange', () => {
  it('sums totals within the window, ignores outside', () => {
    const invoices = [
      { invoice_date: '2026-03-01', total: 100 },
      { invoice_date: '2026-03-31', total: 250 },
      { invoice_date: '2026-02-28', total: 999 }, // outside
      { invoice_date: null, total: 50 }, // null
      { invoice_date: '2026-03-15', total: null }, // null total -> 0
    ];
    expect(sumInvoicesInRange(invoices, new Date('2026-03-01'), new Date('2026-03-31T23:59:59Z'))).toBe(350);
  });
});

describe('computeRevenueYtd', () => {
  it('sums invoices from Jan 1 through now', () => {
    const invoices = [
      { invoice_date: '2026-01-15', total: 1000 },
      { invoice_date: '2026-02-10', total: 500 },
      { invoice_date: '2025-12-30', total: 9999 }, // last year
    ];
    expect(computeRevenueYtd(invoices, NOW)).toBe(1500);
  });

  it('returns 0 for no invoices', () => {
    expect(computeRevenueYtd([], NOW)).toBe(0);
  });
});

describe('computeTrialsYtdCount', () => {
  it('counts trials won this year', () => {
    const trials = [
      { won_date: '2026-01-15' },
      { won_date: '2026-02-20' },
      { won_date: '2025-11-01' },
      { won_date: null },
    ];
    expect(computeTrialsYtdCount(trials, NOW)).toBe(2);
  });
});

describe('computeRevenuePerTrialYtd', () => {
  it('divides revenue by count', () => {
    expect(computeRevenuePerTrialYtd(10_000, 4)).toBe(2500);
  });
  it('returns 0 when no trials won (no Infinity)', () => {
    expect(computeRevenuePerTrialYtd(10_000, 0)).toBe(0);
  });
});

describe('computeMonthOverMonthRevenue', () => {
  it('computes signed change percentage', () => {
    const invoices = [
      { invoice_date: '2026-03-01', total: 1000 },
      { invoice_date: '2026-03-15', total: 500 },
      { invoice_date: '2026-02-10', total: 1000 },
    ];
    const r = computeMonthOverMonthRevenue(invoices, NOW);
    expect(r.thisMonth).toBe(1500);
    expect(r.lastMonth).toBe(1000);
    expect(r.changePct).toBeCloseTo(50, 5);
  });

  it('reports negative change', () => {
    const invoices = [
      { invoice_date: '2026-03-01', total: 500 },
      { invoice_date: '2026-02-10', total: 1000 },
    ];
    expect(computeMonthOverMonthRevenue(invoices, NOW).changePct).toBeCloseTo(-50, 5);
  });

  it('returns 0% (not Infinity) when prior month is 0', () => {
    const invoices = [{ invoice_date: '2026-03-01', total: 500 }];
    expect(computeMonthOverMonthRevenue(invoices, NOW).changePct).toBe(0);
  });
});

describe('computeOutstandingInvoices', () => {
  it('sums and counts sent + overdue only', () => {
    const invoices = [
      { status: 'sent', total: 100 },
      { status: 'overdue', total: 200 },
      { status: 'paid', total: 999 },
      { status: 'draft', total: 50 },
      { status: null, total: 1 },
    ];
    const r = computeOutstandingInvoices(invoices);
    expect(r.amount).toBe(300);
    expect(r.count).toBe(2);
  });
});

describe('computeUnbilledTime', () => {
  it('sums approved entries with no invoice', () => {
    const entries = [
      { status: 'approved', invoice_id: null, amount: 100, duration_hours: 2 },
      { status: 'approved', invoice_id: 'inv-1', amount: 500, duration_hours: 5 }, // billed
      { status: 'pending', invoice_id: null, amount: 75, duration_hours: 1 }, // not approved
      { status: 'approved', invoice_id: null, amount: null, duration_hours: null }, // null safe
    ];
    const r = computeUnbilledTime(entries);
    expect(r.amount).toBe(100);
    expect(r.hours).toBe(2);
  });
});
