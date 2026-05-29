import { describe, expect, it } from 'vitest';
import {
  computeStaleDealCounts,
  earliestPendingByAnchor,
  localTodayStr,
} from '../stale-deals';

const NOW = new Date(2026, 2, 15, 12, 0, 0); // 2026-03-15 local
const TODAY = '2026-03-15';
const PAST = '2026-03-01';
const FUTURE = '2026-03-20';

const stages = [
  { id: 'sales', type: 'sales' },
  { id: 'ops', type: 'operations' },
];

describe('localTodayStr', () => {
  it('emits YYYY-MM-DD in local zone', () => {
    expect(localTodayStr(NOW)).toBe(TODAY);
  });
});

describe('earliestPendingByAnchor', () => {
  it('keeps the earliest pending date per trial and per contact-only attorney', () => {
    const { byTrial, byAttorneyContactOnly } = earliestPendingByAnchor([
      { trial_id: 't1', scheduled_date: FUTURE, status: 'pending' },
      { trial_id: 't1', scheduled_date: PAST, status: 'pending' },
      { attorney_id: 'a1', scheduled_date: FUTURE, status: 'pending' }, // contact-only
      { attorney_id: 'a1', scheduled_date: TODAY, status: 'pending' },
      { trial_id: 't2', scheduled_date: PAST, status: 'done' }, // not pending
      { trial_id: 't3', scheduled_date: null, status: 'pending' }, // no date
    ]);
    expect(byTrial.get('t1')).toBe(PAST);
    expect(byTrial.has('t2')).toBe(false);
    expect(byTrial.has('t3')).toBe(false);
    expect(byAttorneyContactOnly.get('a1')).toBe(TODAY);
  });

  it('prefers trial_id over attorney_id when both present (trial anchor)', () => {
    const { byTrial, byAttorneyContactOnly } = earliestPendingByAnchor([
      { trial_id: 't1', attorney_id: 'a1', scheduled_date: PAST, status: 'pending' },
    ]);
    expect(byTrial.get('t1')).toBe(PAST);
    expect(byAttorneyContactOnly.has('a1')).toBe(false);
  });
});

describe('computeStaleDealCounts — deals (sales-stage trials)', () => {
  const clients = [{ id: 'cl', sales_lead: 'me' }];
  const attorneys: never[] = [];

  it('counts a sales-stage deal with no next step as stale', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(1);
  });

  it('counts an overdue deal as stale', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'other' }],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [{ trial_id: 'd1', scheduled_date: PAST, status: 'pending' }],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(0); // owned by 'other'
  });

  it('counts a due-today deal as stale (<= today)', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [{ trial_id: 'd1', scheduled_date: TODAY, status: 'pending' }],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(1);
  });

  it('does NOT count a deal with a future next step', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [{ trial_id: 'd1', scheduled_date: FUTURE, status: 'pending' }],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(0);
    expect(r.myCount).toBe(0);
  });

  it('excludes lost and settled deals', () => {
    const r = computeStaleDealCounts({
      trials: [
        { id: 'd1', pipeline_stage_id: 'sales', completion_type: 'deal_lost', consultant_id: 'me' },
        {
          id: 'd2',
          pipeline_stage_id: 'sales',
          completion_type: 'deal_settled',
          consultant_id: 'me',
        },
      ],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(0);
  });

  it('excludes operations-stage trials (not deals)', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 't-ops', pipeline_stage_id: 'ops', consultant_id: 'me' }],
      pipelineStages: stages,
      attorneys,
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(0);
  });
});

describe('computeStaleDealCounts — contact-only prospects', () => {
  const clients = [
    { id: 'cl-mine', sales_lead: 'me' },
    { id: 'cl-other', sales_lead: 'someone-else' },
  ];

  it('counts an active prospect with no sales-stage trial as stale (owned via firm.sales_lead)', () => {
    const r = computeStaleDealCounts({
      trials: [],
      pipelineStages: stages,
      attorneys: [{ id: 'a1', client_id: 'cl-mine', is_active_prospect: true }],
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(1);
  });

  it('excludes a prospect who is the primary contact on an active sales-stage trial', () => {
    const r = computeStaleDealCounts({
      trials: [
        { id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me', primary_contact_id: 'a1' },
      ],
      pipelineStages: stages,
      attorneys: [{ id: 'a1', client_id: 'cl-mine', is_active_prospect: true }],
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    // a1 is excluded as a prospect (it's the deal's primary contact); only the
    // deal itself counts.
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(1);
  });

  it('excludes non-prospect attorneys and transferred prospects', () => {
    const r = computeStaleDealCounts({
      trials: [],
      pipelineStages: stages,
      attorneys: [
        { id: 'a1', client_id: 'cl-mine', is_active_prospect: false },
        { id: 'a2', client_id: 'cl-mine', is_active_prospect: true, contact_status: 'transferred' },
      ],
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(0);
  });

  it('counts a prospect owned by someone else toward total only', () => {
    const r = computeStaleDealCounts({
      trials: [],
      pipelineStages: stages,
      attorneys: [{ id: 'a1', client_id: 'cl-other', is_active_prospect: true }],
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(1);
    expect(r.myCount).toBe(0);
  });

  it('does NOT count a prospect with a future contact-only next step', () => {
    const r = computeStaleDealCounts({
      trials: [],
      pipelineStages: stages,
      attorneys: [{ id: 'a1', client_id: 'cl-mine', is_active_prospect: true }],
      clients,
      pendingActivities: [{ attorney_id: 'a1', scheduled_date: FUTURE, status: 'pending' }],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(0);
  });
});

describe('computeStaleDealCounts — myCount vs totalCount', () => {
  const clients = [
    { id: 'cl-mine', sales_lead: 'me' },
    { id: 'cl-other', sales_lead: 'someone-else' },
  ];

  it('aggregates deals + prospects with mixed ownership', () => {
    const r = computeStaleDealCounts({
      trials: [
        { id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }, // stale, mine
        { id: 'd2', pipeline_stage_id: 'sales', consultant_id: 'other' }, // stale, theirs
      ],
      pipelineStages: stages,
      attorneys: [
        { id: 'a1', client_id: 'cl-mine', is_active_prospect: true }, // stale, mine
        { id: 'a2', client_id: 'cl-other', is_active_prospect: true }, // stale, theirs
      ],
      clients,
      pendingActivities: [],
      myUserInfoId: 'me',
      now: NOW,
    });
    expect(r.totalCount).toBe(4);
    expect(r.myCount).toBe(2);
  });

  it('counts 0 mine when not authenticated', () => {
    const r = computeStaleDealCounts({
      trials: [{ id: 'd1', pipeline_stage_id: 'sales', consultant_id: 'me' }],
      pipelineStages: stages,
      attorneys: [{ id: 'a1', client_id: 'cl-mine', is_active_prospect: true }],
      clients,
      pendingActivities: [],
      myUserInfoId: null,
      now: NOW,
    });
    expect(r.totalCount).toBe(2);
    expect(r.myCount).toBe(0);
  });
});
