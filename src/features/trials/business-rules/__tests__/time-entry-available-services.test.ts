import { describe, it, expect } from 'vitest';
import { getAvailableServicesForEntry } from '../time-entry-available-services';

const services = [
  { id: 'svc-jury', name: 'Jury Consultation', base_rate: 200 },
  { id: 'svc-trial', name: 'Trial Consultation', base_rate: 250 },
  {
    id: 'svc-travel',
    name: 'Travel Time',
    base_rate: 100,
    travel_multiplier: 0.5,
  },
];

const trialServices = [
  {
    id: 'ts-jury-1',
    trial_id: 't1',
    service_id: 'svc-jury',
    rate: 220,
    travel_eligible: true,
  },
  {
    id: 'ts-jury-2',
    trial_id: 't1',
    service_id: 'svc-jury',
    rate: 230,
    travel_eligible: false,
  },
];

describe('getAvailableServicesForEntry — regular entries', () => {
  it('returns assigned TrialServices keyed ts-{id}', () => {
    const result = getAvailableServicesForEntry(
      { entry_type: 'regular', trial_id: 't1', consultant_id: 'c1' },
      {
        services,
        trialServices,
        trialServiceAssignments: [
          { trial_id: 't1', consultant_id: 'c1', trial_service_id: 'ts-jury-1' },
          { trial_id: 't1', consultant_id: 'c1', trial_service_id: 'ts-jury-2' },
        ],
        subcontractAssignments: [],
      },
    );
    const tsItems = result.filter((r) => !r.isTravelTime);
    expect(tsItems.map((r) => r._virtualId).sort()).toEqual([
      'ts-ts-jury-1',
      'ts-ts-jury-2',
    ]);
  });

  it('includes Travel Time only for travel_eligible trial services', () => {
    const result = getAvailableServicesForEntry(
      { entry_type: 'regular', trial_id: 't1', consultant_id: 'c1' },
      {
        services,
        trialServices,
        trialServiceAssignments: [
          { trial_id: 't1', consultant_id: 'c1', trial_service_id: 'ts-jury-1' },
          { trial_id: 't1', consultant_id: 'c1', trial_service_id: 'ts-jury-2' },
        ],
        subcontractAssignments: [],
      },
    );
    const travel = result.filter((r) => r.isTravelTime);
    expect(travel).toHaveLength(1);
    expect(travel[0]!.originalTrialServiceId).toBe('ts-jury-1');
    // base_rate = ts.rate (220) * multiplier (0.5)
    expect(travel[0]!.base_rate).toBe(110);
  });
});

describe('getAvailableServicesForEntry — hiring_company', () => {
  it('emits one item per TrialService in the trial, not per service_id', () => {
    const result = getAvailableServicesForEntry(
      { entry_type: 'hiring_company', trial_id: 't1' },
      {
        services,
        trialServices,
        trialServiceAssignments: [],
        subcontractAssignments: [],
      },
    );
    const tsItems = result.filter((r) => !r.isTravelTime);
    expect(tsItems).toHaveLength(2);
    expect(new Set(tsItems.map((r) => r._trialServiceId))).toEqual(
      new Set(['ts-jury-1', 'ts-jury-2']),
    );
  });
});

describe('getAvailableServicesForEntry — subcontractor', () => {
  const subs = [
    {
      id: 'sa-1',
      consultant_id: 'c1',
      trial_id: 't1',
      status: 'active',
      mapped_service_id: 'svc-jury',
      agreed_rate: 300,
      trial_service_id: 'ts-jury-1',
    },
    {
      id: 'sa-2',
      consultant_id: 'c1',
      trial_id: 't1',
      status: 'inactive',
      mapped_service_id: 'svc-jury',
      agreed_rate: 310,
      trial_service_id: 'ts-jury-2',
    },
  ];

  it('emits one item per active SubcontractAssignment keyed sa-{id}', () => {
    const result = getAvailableServicesForEntry(
      { entry_type: 'subcontractor', trial_id: 't1', consultant_id: 'c1' },
      {
        services,
        trialServices,
        trialServiceAssignments: [],
        subcontractAssignments: subs,
      },
    );
    const main = result.filter((r) => !r.isTravelTime);
    expect(main).toHaveLength(1);
    expect(main[0]!._virtualId).toBe('sa-sa-1');
    expect(main[0]!.base_rate).toBe(300);
  });
});
