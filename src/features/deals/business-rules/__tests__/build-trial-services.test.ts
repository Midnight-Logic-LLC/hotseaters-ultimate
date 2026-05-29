import { describe, test, expect } from 'vitest';
import {
  buildTrialServices,
  calculateRetainer,
  type BuildContext,
  type BuilderService,
} from '@/features/deals/business-rules/build-trial-services';
import type { DealFormData } from '@/features/deals/components/deal-wizard-types';

const HOURLY_SERVICE: BuilderService = {
  id: 'svc-hourly',
  name: 'Graphics',
  base_rate: 100,
  rate_type: 'hourly',
  has_daily_minimum: false,
};
const DAILY_MIN_SERVICE: BuilderService = {
  id: 'svc-dm',
  name: 'Trial Tech',
  base_rate: 200,
  rate_type: 'hourly',
  has_daily_minimum: true,
};

function baseDealData(overrides: Partial<DealFormData> = {}): DealFormData {
  return {
    client_id: 'client-1',
    primary_contact_id: '',
    secondary_contact_ids: [],
    consultant_id: 'c-1',
    case_name: 'Smith v. Jones',
    case_style: '',
    case_number: '',
    court: '',
    judge: '',
    case_type: '',
    side: '',
    retainer_value: '',
    override_daily_minimum_hours: '',
    courthouse: '',
    city: '',
    state: '',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    frp_client_id: '',
    frp_contact_id: '',
    services: [],
    ...overrides,
  };
}

function makeCtx(overrides: Partial<BuildContext>): BuildContext {
  const dealData = overrides.dealData ?? baseDealData();
  return {
    dealData,
    services: [HOURLY_SERVICE, DAILY_MIN_SERVICE],
    segments: [],
    preTrialServices: [],
    inTrialServices: [],
    calculateRate: (_id, baseRate) => baseRate,
    dailyMinimumHours: 8,
    isExistingTrial: true, // disable the "today floor" so dates are deterministic
    calculateTrialDays: () => 3,
    calculateServiceDays: () => 3,
    billForWeekends: true,
    ...overrides,
  };
}

describe('buildTrialServices', () => {
  test('returns no rows when nothing is selected', () => {
    expect(buildTrialServices(makeCtx({})).length).toBe(0);
  });

  test('builds an hourly pre-trial row with the expected total + phase', () => {
    const ctx = makeCtx({
      preTrialServices: [
        { id: 1, service_id: 'svc-hourly', quantity: 5, lead_days: 3, split_billing: false },
      ],
    });
    const [row] = buildTrialServices(ctx);
    expect(row).toBeDefined();
    expect(row?.service_id).toBe('svc-hourly');
    expect(row?.final_billing_method).toBe('hourly');
    expect(row?.service_phase).toBe('pre_trial');
    expect(row?.estimated_quantity).toBe(5);
    expect(row?.estimated_total).toBe(500); // 5h × $100
    expect(row?.is_instance_in_trial).toBe(false);
    expect(row?.display_order).toBe(0);
    // lead_days=3 before 2026-06-10 → start 2026-06-07, end day-before-trial 2026-06-09
    expect(row?.start_date).toBe('2026-06-07');
    expect(row?.end_date).toBe('2026-06-09');
  });

  test('builds a daily-minimum in-trial row with day-count × hours × rate', () => {
    const ctx = makeCtx({
      inTrialServices: [{ id: 2, service_id: 'svc-dm', split_billing: false }],
      calculateServiceDays: () => 3,
    });
    const [row] = buildTrialServices(ctx);
    expect(row?.final_billing_method).toBe('daily_minimum');
    expect(row?.service_phase).toBe('in_trial');
    // estimated_quantity = serviceDays(3) × dailyMin(8) = 24 hours
    expect(row?.estimated_quantity).toBe(24);
    expect(row?.estimated_total).toBe(24 * 200);
    expect(row?.is_instance_in_trial).toBe(true);
    // daily_minimum PDR = 8 × 200 = 1600
    expect(row?.projected_daily_revenue).toBe(1600);
  });

  test('display_order continues across pre-trial then in-trial rows', () => {
    const ctx = makeCtx({
      preTrialServices: [
        { id: 1, service_id: 'svc-hourly', quantity: 2, lead_days: 1, split_billing: false },
      ],
      inTrialServices: [{ id: 2, service_id: 'svc-dm', split_billing: false }],
    });
    const rows = buildTrialServices(ctx);
    expect(rows.map((r) => r.display_order)).toEqual([0, 1]);
  });

  test('preserves the saved row id for existing (uuid) instances', () => {
    const ctx = makeCtx({
      preTrialServices: [
        { id: 'uuid-abc', service_id: 'svc-hourly', quantity: 1, lead_days: 0, split_billing: false },
      ],
    });
    const [row] = buildTrialServices(ctx);
    expect(row?.id).toBe('uuid-abc');
  });
});

describe('calculateRetainer', () => {
  test('floors estimated/divisor × multiplier, never below the minimum', () => {
    // 40000 / 15000 = 2.66 → floor 2 → 2 × 5000 = 10000
    expect(
      calculateRetainer(40000, {
        retainer_divisor: 15000,
        retainer_multiplier: 5000,
        retainer_minimum: 1000,
      }),
    ).toBe(10000);
  });

  test('returns the minimum when the computed retainer is lower', () => {
    expect(
      calculateRetainer(1000, {
        retainer_divisor: 15000,
        retainer_multiplier: 5000,
        retainer_minimum: 1000,
      }),
    ).toBe(1000);
  });

  test('falls back to the bible defaults when company config is null', () => {
    // defaults: divisor 15000, multiplier 5000, minimum 1000
    // 30000 / 15000 = 2 → 2 × 5000 = 10000
    expect(
      calculateRetainer(30000, {
        retainer_divisor: null,
        retainer_multiplier: null,
        retainer_minimum: null,
      }),
    ).toBe(10000);
  });
});
