import { describe, expect, it } from 'vitest';
import { quickActionsFor } from '../quick-action-policy';

const noFlags = { marketplace_post_jobs: false, marketplace_fill_jobs: false };
const withHsh = { marketplace_post_jobs: true, marketplace_fill_jobs: false };

describe('quickActionsFor (bible parity, Dashboard.jsx lines 1326–1437)', () => {
  it('trial_consultant gets the fixed 4-action set', () => {
    expect(quickActionsFor({ role: 'trial_consultant', company: noFlags })).toEqual([
      'log-time',
      'add-expense',
      'time-off',
      'view-schedule',
    ]);
  });

  it('trial_consultant ignores company flags', () => {
    expect(quickActionsFor({ role: 'trial_consultant', company: withHsh })).toEqual([
      'log-time',
      'add-expense',
      'time-off',
      'view-schedule',
    ]);
  });

  it('owner without HSH sees: New Deal, Log Time, Add Client, View Schedule, New Invoice', () => {
    expect(quickActionsFor({ role: 'owner', company: noFlags })).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'new-invoice',
    ]);
  });

  it('admin = owner shape', () => {
    expect(quickActionsFor({ role: 'admin', company: noFlags })).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'new-invoice',
    ]);
  });

  it('sales without HSH sees the same 5 actions as owner', () => {
    expect(quickActionsFor({ role: 'sales', company: noFlags })).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'new-invoice',
    ]);
  });

  it('owner with HSH sees the HotSeatHub action between schedule and invoice', () => {
    expect(quickActionsFor({ role: 'owner', company: withHsh })).toEqual([
      'new-deal',
      'log-time',
      'add-client',
      'view-schedule',
      'hot-seat-hub',
      'new-invoice',
    ]);
  });

  it('undefined role degrades to trial_consultant-style minimum actions', () => {
    // role-undefined === "other" in the bible falls through the sales-checks:
    // no new-deal, no add-client, no new-invoice, no HSH (unless flag) →
    // just log-time + view-schedule.
    expect(quickActionsFor({ role: undefined, company: noFlags })).toEqual([
      'log-time',
      'view-schedule',
    ]);
  });

  it('undefined role + HSH flag still shows the hot-seat-hub tile', () => {
    expect(quickActionsFor({ role: undefined, company: withHsh })).toEqual([
      'log-time',
      'view-schedule',
      'hot-seat-hub',
    ]);
  });
});
