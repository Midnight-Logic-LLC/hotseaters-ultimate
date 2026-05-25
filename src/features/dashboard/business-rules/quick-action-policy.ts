/**
 * quick-action-policy.ts — role + feature-flag matrix for Dashboard
 * Quick Actions row.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 1326–1437.
 *
 * Pure. Returns an ordered list of action IDs (caller resolves IDs →
 * label/icon/handler in `use-quick-actions`).
 */

import type { Role as LegacyRole, CompanyFlags } from '@/app/navigation';

export type QuickActionId =
  | 'new-deal'
  | 'log-time'
  | 'add-expense'
  | 'time-off'
  | 'add-client'
  | 'view-schedule'
  | 'hot-seat-hub'
  | 'new-invoice';

export interface QuickActionPolicyInput {
  role: LegacyRole | undefined;
  company: CompanyFlags | null;
}

const TRIAL_CONSULTANT_ACTIONS: QuickActionId[] = [
  'log-time',
  'add-expense',
  'time-off',
  'view-schedule',
];

/** Returns ordered action IDs visible to the given role + company flags. */
export function quickActionsFor(input: QuickActionPolicyInput): QuickActionId[] {
  const { role, company } = input;
  // Trial consultants get a fixed 4-action set (bible lines 1337–1370).
  if (role === 'trial_consultant') {
    return TRIAL_CONSULTANT_ACTIONS;
  }

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isSales = role === 'sales';
  const showSalesActions = isOwnerOrAdmin || isSales;

  const out: QuickActionId[] = [];
  if (showSalesActions) out.push('new-deal');
  out.push('log-time');
  if (showSalesActions) out.push('add-client');
  out.push('view-schedule');
  if (company?.marketplace_post_jobs) out.push('hot-seat-hub');
  if (showSalesActions) out.push('new-invoice');
  return out;
}
