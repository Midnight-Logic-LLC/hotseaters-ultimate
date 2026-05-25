import { describe, expect, it } from 'vitest';
import {
  computeStaleLeadCounts,
  earliestPendingByLead,
  localTodayStr,
} from '../stale-leads';

const NOW = new Date(2026, 2, 15, 12, 0, 0); // 2026-03-15 local

describe('localTodayStr', () => {
  it('emits YYYY-MM-DD in local zone', () => {
    expect(localTodayStr(NOW)).toBe('2026-03-15');
  });
});

describe('earliestPendingByLead', () => {
  it('keeps the earliest scheduled date per lead', () => {
    const m = earliestPendingByLead([
      { lead_id: 'a', scheduled_date: '2026-03-20', status: 'pending' },
      { lead_id: 'a', scheduled_date: '2026-03-10', status: 'pending' },
      { lead_id: 'b', scheduled_date: '2026-03-12', status: 'pending' },
      { lead_id: 'a', scheduled_date: '2026-03-05', status: 'done' }, // not pending
      { lead_id: null, scheduled_date: '2026-01-01', status: 'pending' }, // bad
    ]);
    expect(m.get('a')).toBe('2026-03-10');
    expect(m.get('b')).toBe('2026-03-12');
    expect(m.has(null as unknown as string)).toBe(false);
  });
});

describe('computeStaleLeadCounts', () => {
  const leads = [
    { id: 'l1', attorney_id: 'a1' }, // mine, no activity → stale
    { id: 'l2', attorney_id: 'a2' }, // theirs, overdue → stale
    { id: 'l3', attorney_id: 'a1' }, // mine, future scheduled → fresh
    { id: 'l4', attorney_id: 'a3' }, // unowned, stale
  ];
  const pendingActivities = [
    { lead_id: 'l2', scheduled_date: '2026-03-01', status: 'pending' }, // overdue
    { lead_id: 'l3', scheduled_date: '2026-03-20', status: 'pending' }, // future
    { lead_id: 'l4', scheduled_date: null, status: 'pending' },
  ];
  const attorneys = [
    { id: 'a1', client_id: 'cl-mine' },
    { id: 'a2', client_id: 'cl-other' },
    { id: 'a3', client_id: null }, // unowned
  ];
  const clients = [
    { id: 'cl-mine', sales_lead: 'me' },
    { id: 'cl-other', sales_lead: 'someone-else' },
  ];

  it('counts mine vs. total when current user is "me"', () => {
    const r = computeStaleLeadCounts({
      leads,
      pendingActivities,
      attorneys,
      clients,
      myUserInfoId: 'me',
      now: NOW,
    });
    // l1 stale + mine, l2 stale + theirs, l4 stale + unowned. l3 not stale.
    expect(r.totalCount).toBe(3);
    expect(r.myCount).toBe(1);
  });

  it('counts 0 mine when not authenticated', () => {
    const r = computeStaleLeadCounts({
      leads,
      pendingActivities,
      attorneys,
      clients,
      myUserInfoId: null,
      now: NOW,
    });
    expect(r.totalCount).toBe(3);
    expect(r.myCount).toBe(0);
  });
});
