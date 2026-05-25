import { describe, expect, it } from 'vitest';
import {
  buildProjectedInvoiceMap,
  countWeekdays,
  enrichTasksWithDailyRevenue,
  getBillingDate,
} from '../trial-projections';

describe('getBillingDate', () => {
  it('weekly Friday: a Monday bills the upcoming Friday', () => {
    const monday = new Date(2026, 2, 9); // Mon Mar 9
    const r = getBillingDate(monday, 'weekly', 'Friday', null, null);
    expect(r).toEqual(new Date(2026, 2, 13)); // Fri Mar 13
  });

  it('weekly Friday: a Friday bills next Friday (not today)', () => {
    const friday = new Date(2026, 2, 13);
    const r = getBillingDate(friday, 'weekly', 'Friday', null, null);
    expect(r).toEqual(new Date(2026, 2, 20));
  });

  it('monthly: a March day bills on the chosen day of the next month', () => {
    const day = new Date(2026, 2, 10);
    const r = getBillingDate(day, 'monthly', null, 5, null);
    expect(r).toEqual(new Date(2026, 3, 5)); // Apr 5
  });

  it('monthly: December rolls to January next year', () => {
    const day = new Date(2026, 11, 20);
    const r = getBillingDate(day, 'monthly', null, 1, null);
    expect(r).toEqual(new Date(2027, 0, 1));
  });

  it('per_trial: defaults to +7 days after the input date', () => {
    const d = new Date(2026, 2, 10);
    const r = getBillingDate(d, 'per_trial', null, null, null);
    expect(r).toEqual(new Date(2026, 2, 17));
  });

  it('per_trial: respects perTrialBillingDays', () => {
    const d = new Date(2026, 2, 10);
    const r = getBillingDate(d, 'per_trial', null, null, 30);
    expect(r).toEqual(new Date(2026, 3, 9));
  });
});

describe('countWeekdays', () => {
  it('counts Mon–Fri only', () => {
    // Mar 9 (Mon) – Mar 15 (Sun) → 5 weekdays
    expect(countWeekdays(new Date(2026, 2, 9), new Date(2026, 2, 15))).toBe(5);
  });
  it('minimum is 1 (per bible)', () => {
    expect(countWeekdays(new Date(2026, 2, 14), new Date(2026, 2, 15))).toBe(1);
  });
});

describe('enrichTasksWithDailyRevenue', () => {
  const stages = [{ id: 's-prep', revenue_probability: 1.0 }];
  const trials = [{ id: 't1', pipeline_stage_id: 's-prep', start_date: '2026-03-15' }];
  const services = [{ id: 'svc-1' }];

  it('skips trial_services without dates', () => {
    const r = enrichTasksWithDailyRevenue({
      trialServices: [{ trial_id: 't1', projected_daily_revenue: 100 }],
      trials,
      stages,
      services,
    });
    expect(r).toEqual([]);
  });

  it('skips when neither PDR nor split billing', () => {
    const r = enrichTasksWithDailyRevenue({
      trialServices: [
        { trial_id: 't1', start_date: '2026-03-01', end_date: '2026-03-05' },
      ],
      trials,
      stages,
      services,
    });
    expect(r).toEqual([]);
  });

  it('applies stage probability to single-method PDR', () => {
    const r = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-01',
          end_date: '2026-03-05',
          projected_daily_revenue: 1000,
        },
      ],
      trials,
      stages: [{ id: 's-prep', revenue_probability: 0.5 }],
      services,
    });
    expect(r[0]?.dailyRevenue).toBe(500);
  });

  it('returns a split-shape for final_billing_method=split', () => {
    const r = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-10',
          end_date: '2026-03-20',
          final_billing_method: 'split',
          pre_trial_projected_daily_revenue: 200,
          in_trial_projected_daily_revenue: 800,
        },
      ],
      trials,
      stages,
      services,
    });
    const dr = r[0]?.dailyRevenue;
    expect(dr && typeof dr === 'object' && 'isSplit' in dr).toBe(true);
    if (dr && typeof dr === 'object' && 'isSplit' in dr) {
      expect(dr.preTrialDailyRevenue).toBe(200);
      expect(dr.inTrialDailyRevenue).toBe(800);
      expect(dr.preTrialDays).toBe(5); // Mar 10 → Mar 15
      expect(dr.inTrialDays).toBe(6); // Mar 15 → Mar 20 inclusive (+1)
    }
  });
});

describe('buildProjectedInvoiceMap', () => {
  const stages = [{ id: 's-prep', revenue_probability: 1 }];
  const trials = [{ id: 't1', pipeline_stage_id: 's-prep', start_date: '2026-03-15', bill_for_weekends: true }];
  const services = [{ id: 'svc-1' }];

  it('per_trial bills the full task at end + N days', () => {
    const tasks = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-01',
          end_date: '2026-03-05',
          projected_daily_revenue: 100,
        },
      ],
      trials,
      stages,
      services,
    });
    const r = buildProjectedInvoiceMap({
      tasks,
      company: {
        invoice_period: 'per_trial',
        per_trial_billing_days_after_end: 7,
      },
    });
    // 5 days * $100 = $500 billed on 2026-03-12 (5+7)
    expect(r.get('2026-03-12')).toBe(500);
  });

  it('weekly buckets per-day revenue into the upcoming Friday', () => {
    const tasks = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-09',
          end_date: '2026-03-11',
          projected_daily_revenue: 200,
        },
      ],
      trials,
      stages,
      services,
    });
    const r = buildProjectedInvoiceMap({
      tasks,
      company: { invoice_period: 'weekly', weekly_billing_day: 'Friday' },
    });
    // Mon Mar 9, Tue Mar 10, Wed Mar 11 → all bill on Fri Mar 13
    expect(r.get('2026-03-13')).toBe(600);
  });

  it('monthly buckets per-day revenue into next-month billing date', () => {
    const tasks = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-29',
          end_date: '2026-03-31',
          projected_daily_revenue: 100,
        },
      ],
      trials,
      stages,
      services,
    });
    const r = buildProjectedInvoiceMap({
      tasks,
      company: { invoice_period: 'monthly', monthly_billing_date: 1 },
    });
    // 3 days * $100 = $300 billed on Apr 1
    expect(r.get('2026-04-01')).toBe(300);
  });

  it('skips weekends for daily_minimum tasks when bill_for_weekends=false', () => {
    const trialsNoWeekends = [
      { id: 't1', pipeline_stage_id: 's-prep', start_date: '2026-03-15', bill_for_weekends: false },
    ];
    const tasks = enrichTasksWithDailyRevenue({
      trialServices: [
        {
          trial_id: 't1',
          service_id: 'svc-1',
          start_date: '2026-03-13', // Fri
          end_date: '2026-03-16', // Mon
          projected_daily_revenue: 100,
          final_billing_method: 'daily_minimum',
        },
      ],
      trials: trialsNoWeekends,
      stages,
      services,
    });
    const r = buildProjectedInvoiceMap({
      tasks,
      company: { invoice_period: 'monthly', monthly_billing_date: 1 },
    });
    // Fri + Mon = 2 days * 100 = 200 (Sat/Sun excluded)
    expect(r.get('2026-04-01')).toBe(200);
  });
});
