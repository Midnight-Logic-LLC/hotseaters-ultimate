import { describe, it, expect } from 'vitest';
import { buildChartData, type BuildChartDataInput } from '../revenue-projection-chart-data';
import type { DetailedRecord } from '@/features/sales/components/revenue-projections-types';

function rec(over: Partial<DetailedRecord>): DetailedRecord {
  return {
    taskDate: 'Jan 1',
    billingDateKey: '2026-01-15',
    dealTrial: 'Case A',
    taskName: 'Svc',
    dateRange: 'Jan 1 - Jan 2',
    dailyValue: 0,
    daysAssigned: 1,
    projectedValue: 0,
    fullValue: 0,
    dailyHshPayout: 0,
    isHSH: false,
    ...over,
  };
}

const base: Omit<BuildChartDataInput, 'showCumulative'> = {
  detailedRecords: [],
  invoices: [],
  payments: [],
  caseNames: [],
  timePeriod: 'month',
  // FY 2026 starting Jan 1 (local time).
  fiscalYearStart: new Date(2026, 0, 1),
  monthlyBreakeven: 0,
  annualRevenueTarget: 0,
  breakevenPerPeriod: 0,
  goalPerPeriod: 0,
};

describe('buildChartData (monthly)', () => {
  it('produces 12 month buckets', () => {
    const data = buildChartData({ ...base, showCumulative: false });
    expect(data).toHaveLength(12);
    expect(data[0]!.month).toBe('Jan 26');
    expect(data[11]!.month).toBe('Dec 26');
  });

  it('buckets projected + full per case into the billing month', () => {
    const detailedRecords = [
      rec({ billingDateKey: '2026-01-15', dealTrial: 'Case A', projectedValue: 100, fullValue: 150 }),
      rec({ billingDateKey: '2026-01-20', dealTrial: 'Case A', projectedValue: 50, fullValue: 50 }),
      rec({ billingDateKey: '2026-02-10', dealTrial: 'Case B', projectedValue: 200, fullValue: 300 }),
    ];
    const data = buildChartData({
      ...base,
      detailedRecords,
      caseNames: ['Case A', 'Case B'],
      showCumulative: false,
    });
    const jan = data[0]!;
    expect(jan.projected).toBe(150);
    expect(jan.fullPotential).toBe(200);
    // Full-potential delta is the topmost stacked segment (full − projected).
    expect(jan.fullPotentialDelta).toBe(50);
    expect(jan['proj_Case A']).toBe(150);
    expect(jan['full_Case A']).toBe(200);
    const feb = data[1]!;
    expect(feb.projected).toBe(200);
    expect(feb.fullPotential).toBe(300);
    expect(feb.fullPotentialDelta).toBe(100);
  });

  it('sums realized payments + unpaid invoices into the period', () => {
    const data = buildChartData({
      ...base,
      payments: [{ payment_date: '2026-01-05', amount: 500 }],
      invoices: [
        { id: 'i1', invoice_date: '2026-01-08', total: 300, status: 'sent' },
        { id: 'i2', invoice_date: '2026-01-09', total: 99, status: 'paid' },
      ],
      showCumulative: false,
    });
    expect(data[0]!.revenue).toBe(500);
    // Paid invoice is excluded from the unpaid bucket.
    expect(data[0]!.unpaid).toBe(300);
  });

  it('cumulative mode carries running totals + goal/breakeven lines', () => {
    const detailedRecords = [
      rec({ billingDateKey: '2026-01-15', dealTrial: 'Case A', projectedValue: 100, fullValue: 100 }),
      rec({ billingDateKey: '2026-02-15', dealTrial: 'Case A', projectedValue: 100, fullValue: 100 }),
    ];
    const data = buildChartData({
      ...base,
      detailedRecords,
      caseNames: ['Case A'],
      monthlyBreakeven: 10,
      annualRevenueTarget: 120,
      breakevenPerPeriod: 10,
      goalPerPeriod: 10,
      showCumulative: true,
    });
    expect(data[0]!.projected).toBe(100);
    expect(data[1]!.projected).toBe(200); // running
    expect(data[0]!.cumulativeBreakeven).toBe(10);
    expect(data[1]!.cumulativeBreakeven).toBe(20);
    expect(data[0]!.cumulativeGoal).toBe(10);
    expect(data[11]!.cumulativeGoal).toBe(120);
  });
});

describe('buildChartData (weekly)', () => {
  it('produces 52 week buckets', () => {
    const data = buildChartData({ ...base, timePeriod: 'week', showCumulative: false });
    expect(data).toHaveLength(52);
  });
});
