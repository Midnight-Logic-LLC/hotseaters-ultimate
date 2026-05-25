import { describe, expect, it } from 'vitest';
import {
  activeConsultants,
  aggregateTeamStats,
  avgHoursPerActiveConsultant,
  computeActiveTrialStats,
  filterTimeEntriesInWindow,
} from '../team-performance';

const consultants = [
  { id: 'c1', first_name: 'Ada', last_name: 'Lovelace', status: 'active' },
  { id: 'c2', first_name: 'Alan', last_name: 'Turing', status: 'active' },
  { id: 'c3', first_name: 'Grace', last_name: 'Hopper', status: 'inactive' },
];

const subs = [
  { consultant_id: 'sub-1', consultant_first_name: 'Edsger', consultant_last_name: 'Dijkstra', status: 'active' },
];

const entries = [
  { consultant_id: 'c1', start_time: '2026-03-09T09:00:00Z', duration_hours: 4, amount: 800, trial_id: 't1' },
  { consultant_id: 'c1', start_time: '2026-03-10T10:00:00Z', duration_hours: 2, amount: 400, trial_id: 't1' },
  { consultant_id: 'c2', start_time: '2026-03-11T08:00:00Z', duration_hours: 6, amount: 1200, trial_id: 't2' },
  { consultant_id: 'sub-1', start_time: '2026-03-09T09:00:00Z', duration_hours: 5, amount: 1000, trial_id: 't1' },
  // outside window
  { consultant_id: 'c1', start_time: '2026-02-01T09:00:00Z', duration_hours: 8, amount: 1600, trial_id: 't1' },
];

const WEEK_START = new Date('2026-03-08T00:00:00Z');
const WEEK_END = new Date('2026-03-14T23:59:59Z');

describe('activeConsultants', () => {
  it('filters by status active', () => {
    expect(activeConsultants(consultants).map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});

describe('filterTimeEntriesInWindow', () => {
  it('keeps entries in the window only', () => {
    const r = filterTimeEntriesInWindow(entries, WEEK_START, WEEK_END);
    expect(r.length).toBe(4);
  });
});

describe('aggregateTeamStats', () => {
  it('sums hours+revenue per staff consultant + merges HSH subs', () => {
    const windowEntries = filterTimeEntriesInWindow(entries, WEEK_START, WEEK_END);
    const r = aggregateTeamStats({
      consultants,
      windowEntries,
      subcontractAssignments: subs,
    });
    expect(r).toEqual([
      { name: 'Ada Lovelace', hours: 6, revenue: 1200, isHsh: false },
      { name: 'Alan Turing', hours: 6, revenue: 1200, isHsh: false },
      { name: 'Edsger Dijkstra', hours: 5, revenue: 1000, isHsh: true },
    ]);
  });

  it('does not duplicate when a sub also has a consultant row', () => {
    const dup = [...consultants, { id: 'sub-1', first_name: 'Edsger', last_name: 'Dijkstra', status: 'active' }];
    const windowEntries = filterTimeEntriesInWindow(entries, WEEK_START, WEEK_END);
    const r = aggregateTeamStats({
      consultants: dup,
      windowEntries,
      subcontractAssignments: subs,
    });
    // sub-1 collapsed into staff row → no HSH row
    expect(r.filter((row) => row.isHsh)).toEqual([]);
    expect(r.find((row) => row.name === 'Edsger Dijkstra')?.hours).toBe(5);
  });
});

describe('avgHoursPerActiveConsultant', () => {
  it('returns 0 when no consultants', () => {
    expect(avgHoursPerActiveConsultant({ consultants: [], windowEntries: entries })).toBe(0);
  });
  it('divides total window hours by active count', () => {
    const windowEntries = filterTimeEntriesInWindow(entries, WEEK_START, WEEK_END);
    // 6+6+5 = 17, /2 active = 8.5
    expect(avgHoursPerActiveConsultant({ consultants, windowEntries })).toBe(8.5);
  });
});

describe('computeActiveTrialStats', () => {
  it('aggregates per trial, sorted by revenue desc', () => {
    const clients = [
      { id: 'cl1', firm_name: 'Acme LLP' },
      { id: 'cl2', firm_name: 'Beta PA' },
    ];
    const trials = [
      { id: 't1', case_name: 'Acme v. Doe', client_id: 'cl1' },
      { id: 't2', case_name: 'Beta v. Roe', client_id: 'cl2' },
    ];
    const r = computeActiveTrialStats({ activeTrials: trials, timeEntries: entries, clients });
    expect(r[0]).toEqual({ id: 't1', name: 'Acme v. Doe', client: 'Acme LLP', hours: 19, revenue: 3800 });
    expect(r[1]).toEqual({ id: 't2', name: 'Beta v. Roe', client: 'Beta PA', hours: 6, revenue: 1200 });
  });
});
