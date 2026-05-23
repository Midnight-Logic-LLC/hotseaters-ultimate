import { describe, it, expect } from 'vitest';
import { calculateDailyMinimumAdjustments } from '../daily-minimum-utils';

const services = [{ id: 'svc-dm', has_daily_minimum: true }];
const trialServices = [
  {
    id: 'ts-1',
    trial_id: 't1',
    service_id: 'svc-dm',
    final_billing_method: 'daily_minimum',
  },
  {
    id: 'ts-hourly',
    trial_id: 't1',
    service_id: 'svc-dm',
    final_billing_method: 'hourly',
  },
];
const company = { default_daily_minimum_hours: 8 };

describe('calculateDailyMinimumAdjustments', () => {
  it('returns empty when no entries', () => {
    expect(
      calculateDailyMinimumAdjustments([], services, null, company, trialServices),
    ).toEqual({});
  });

  it('does not bump when total hours >= daily min', () => {
    const entries = [
      {
        id: 'e1',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T09:00:00Z',
        duration_hours: 9,
        rate: 100,
      },
    ];
    const adj = calculateDailyMinimumAdjustments(
      entries,
      services,
      null,
      company,
      trialServices,
    );
    expect(adj.e1!.wasBumped).toBe(false);
    expect(adj.e1!.billed_duration_hours).toBe(9);
    expect(adj.e1!.billed_amount).toBe(900);
  });

  it('bumps the LAST daily-min entry by start_time', () => {
    const entries = [
      {
        id: 'e1',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T09:00:00Z',
        duration_hours: 3,
        rate: 100,
      },
      {
        id: 'e2',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T13:00:00Z',
        duration_hours: 2,
        rate: 100,
      },
    ];
    const adj = calculateDailyMinimumAdjustments(
      entries,
      services,
      null,
      company,
      trialServices,
    );
    // total 5h, deficit 3h → e2 gets bumped to 5h
    expect(adj.e1!.wasBumped).toBe(false);
    expect(adj.e1!.billed_duration_hours).toBe(3);
    expect(adj.e2!.wasBumped).toBe(true);
    expect(adj.e2!.billed_duration_hours).toBe(5);
    expect(adj.e2!.billed_amount).toBe(500);
  });

  it('does not bump when group has no daily-min service', () => {
    const entries = [
      {
        id: 'e1',
        trial_service_id: 'ts-hourly',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T09:00:00Z',
        duration_hours: 2,
        rate: 100,
      },
    ];
    const adj = calculateDailyMinimumAdjustments(
      entries,
      services,
      null,
      company,
      trialServices,
    );
    expect(adj.e1!.wasBumped).toBe(false);
    expect(adj.e1!.billed_duration_hours).toBe(2);
  });

  it('skips disabled entries and bumps next eligible', () => {
    const entries = [
      {
        id: 'e1',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T09:00:00Z',
        duration_hours: 2,
        rate: 100,
      },
      {
        id: 'e2',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T13:00:00Z',
        duration_hours: 2,
        rate: 100,
      },
    ];
    const adj = calculateDailyMinimumAdjustments(
      entries,
      services,
      null,
      company,
      trialServices,
      new Set(['e2']),
    );
    // e2 disabled → e1 receives the bump (deficit = 4)
    expect(adj.e1!.wasBumped).toBe(true);
    expect(adj.e1!.billed_duration_hours).toBe(6);
    expect(adj.e2!.wasBumped).toBe(false);
  });

  it('no bump when every daily-min entry is disabled', () => {
    const entries = [
      {
        id: 'e1',
        trial_service_id: 'ts-1',
        consultant_id: 'c1',
        trial_id: 't1',
        start_time: '2026-01-02T09:00:00Z',
        duration_hours: 2,
        rate: 100,
      },
    ];
    const adj = calculateDailyMinimumAdjustments(
      entries,
      services,
      null,
      company,
      trialServices,
      new Set(['e1']),
    );
    expect(adj.e1!.wasBumped).toBe(false);
    expect(adj.e1!.billed_duration_hours).toBe(2);
  });
});
