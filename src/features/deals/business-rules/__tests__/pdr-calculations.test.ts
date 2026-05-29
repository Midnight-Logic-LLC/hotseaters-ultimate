import { describe, test, expect } from 'vitest';
import {
  calculateProjectedDailyRevenue,
  formatPdrDebugInfo,
} from '@/features/deals/business-rules/pdr-calculations';

describe('calculateProjectedDailyRevenue', () => {
  const trial = {
    start_date: '2026-01-10',
    end_date: '2026-01-12',
    default_daily_minimum_hours: 8,
  };

  // ── Branch 1: no rate ──
  test('returns zero PDR and N/A formula when the service has no rate', () => {
    const result = calculateProjectedDailyRevenue(
      { rate: 0, final_billing_method: 'hourly' },
      trial,
    );
    expect(result).toEqual({
      pdr: 0,
      preTrialPdr: null,
      inTrialPdr: null,
      formula: 'N/A',
    });
  });

  test('returns zero PDR and N/A formula when the service is null', () => {
    const result = calculateProjectedDailyRevenue(null, trial);
    expect(result.pdr).toBe(0);
    expect(result.formula).toBe('N/A');
  });

  // ── Branch 2: daily_minimum (checked before split) ──
  test('daily_minimum uses dailyMinimumHours × rate, no date math', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 200,
        final_billing_method: 'daily_minimum',
        dailyMinimumHours: 8,
        start_date: '2026-01-10',
        end_date: '2026-01-12',
      },
      trial,
    );
    expect(result.pdr).toBe(1600);
    expect(result.preTrialPdr).toBeNull();
    expect(result.inTrialPdr).toBeNull();
    expect(result.formula).toBe('200/hr×8hr=$1600.00/day');
  });

  test('daily_minimum falls back to trial default_daily_minimum_hours', () => {
    const result = calculateProjectedDailyRevenue(
      { rate: 100, final_billing_method: 'daily_minimum' },
      { start_date: '2026-01-10', end_date: '2026-01-12', default_daily_minimum_hours: 6 },
    );
    expect(result.pdr).toBe(600);
    expect(result.formula).toBe('100/hr×6hr=$600.00/day');
  });

  test('daily_minimum falls back to 8 hours when no value is supplied', () => {
    const result = calculateProjectedDailyRevenue(
      { rate: 100, final_billing_method: 'daily_minimum' },
      { start_date: '2026-01-10', end_date: '2026-01-12' },
    );
    expect(result.pdr).toBe(800);
    expect(result.formula).toBe('100/hr×8hr=$800.00/day');
  });

  // ── Branch 3: split ──
  test('split returns null main PDR with separate pre/in-trial PDRs', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 100,
        final_billing_method: 'split',
        start_date: '2026-01-05', // 5 days before the trial start
        pre_trial_estimated_hours: 20,
        dailyMinimumHours: 8,
      },
      trial,
    );
    // daysBeforeTrial = differenceInDays('2026-01-10','2026-01-05') = 5
    // preTrialPdr = 20 * 100 / 5 = 400
    expect(result.pdr).toBeNull();
    expect(result.preTrialPdr).toBe(400);
    // inTrialPdr = 8 * 100 = 800
    expect(result.inTrialPdr).toBe(800);
    expect(result.formula).toBe('Split: Pre=$400.00/day, In=$800.00/day');
    expect(result.preTrialFormula).toBe('20hr×$100/hr÷5d=$400.00/day');
    expect(result.inTrialFormula).toBe('100/hr×8hr=$800.00/day');
  });

  test('split with zero days before trial yields a zero pre-trial PDR', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 100,
        final_billing_method: 'split',
        start_date: '2026-01-10', // same as trial start → daysBeforeTrial = 0
        pre_trial_estimated_hours: 20,
        dailyMinimumHours: 8,
      },
      trial,
    );
    expect(result.preTrialPdr).toBe(0);
    expect(result.inTrialPdr).toBe(800);
    expect(result.preTrialFormula).toBe('20hr×$100/hr÷0d=$0.00/day');
  });

  // ── Branch 4: hourly ──
  test('hourly divides total hours over the inclusive day span', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 100,
        final_billing_method: 'hourly',
        start_date: '2026-01-10',
        end_date: '2026-01-12', // 3 inclusive days
        estimated_quantity: 30,
      },
      trial,
    );
    // pdr = 30 * 100 / 3 = 1000
    expect(result.pdr).toBe(1000);
    expect(result.preTrialPdr).toBeNull();
    expect(result.inTrialPdr).toBeNull();
    expect(result.formula).toBe('30hr×$100/hr÷3d=$1000.00/day');
  });

  test('hourly with zero estimated hours yields a zero PDR', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 100,
        final_billing_method: 'hourly',
        start_date: '2026-01-10',
        end_date: '2026-01-12',
        estimated_quantity: 0,
      },
      trial,
    );
    expect(result.pdr).toBe(0);
    expect(result.formula).toBe('0hr×$100/hr÷3d=$0.00/day');
  });

  test('hourly resolves service dates from a matching segment', () => {
    const result = calculateProjectedDailyRevenue(
      {
        rate: 100,
        final_billing_method: 'hourly',
        segment_id: 'seg-1',
        estimated_quantity: 20,
      },
      trial,
      [{ id: 'seg-1', segment_number: 2, start_date: '2026-02-01', end_date: '2026-02-05' }],
    );
    // segment span = 5 inclusive days → pdr = 20 * 100 / 5 = 400
    expect(result.pdr).toBe(400);
    expect(result.formula).toBe('20hr×$100/hr÷5d=$400.00/day');
  });
});

describe('formatPdrDebugInfo', () => {
  test('returns just the formula string', () => {
    const formula = formatPdrDebugInfo(
      { rate: 200, final_billing_method: 'daily_minimum', dailyMinimumHours: 8 },
      { start_date: '2026-01-10', end_date: '2026-01-12' },
    );
    expect(formula).toBe('200/hr×8hr=$1600.00/day');
  });
});
