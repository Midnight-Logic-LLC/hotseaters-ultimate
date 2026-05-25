/**
 * use-dashboard-widgets — table-driven role + flag matrix.
 *
 * Asserts the visible widget IDs match the bible role matrix
 * (see `.claude/plans/foamy-marinating-hollerith.md` §Bible widget
 * inventory + §Quick Actions role matrix).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Role as LegacyRole } from '@/app/navigation';

// Stub the supabase client because the widget components transitively
// import REST stores + auth-store that construct supabase at module load —
// that crashes in JSDOM where VITE_SUPABASE_URL is unset.
vi.mock('@/shared/db/supabase-client', () => {
  const queryStub = {
    select: () => queryStub,
    eq: () => queryStub,
    in: () => queryStub,
    gte: () => queryStub,
    lte: () => queryStub,
    order: () => queryStub,
    range: () => Promise.resolve({ data: [], error: null }),
    update: () => queryStub,
    insert: () => queryStub,
    delete: () => queryStub,
    single: () => Promise.resolve({ data: null, error: null }),
  };
  const supabase = {
    from: () => queryStub,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: (
        _cb: (event: string, session: unknown) => void,
      ) => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
  return {
    supabase,
    getCurrentSession: () => Promise.resolve(null),
  };
});

const mockUseTier1 = vi.fn();
vi.mock('@/app/tier1-provider', () => ({
  useTier1: () => mockUseTier1(),
}));

import {
  __getDashboardRegistryForTests,
  useDashboardWidgets,
} from '../use-dashboard-widgets';

interface MatrixRow {
  role: LegacyRole | undefined;
  flags: { marketplace_fill_jobs: boolean; marketplace_post_jobs: boolean };
  expected: ReadonlyArray<string>;
}

// Always-on widgets (independent of role).
const ALWAYS_ON = [
  'welcome-header',
  'kpi-active-trials',
  'kpi-trials-ytd',
  'recent-activity-card',
  'active-trial-performance',
  'upcoming-trials-card',
  'quick-actions-bar',
];

const REVENUE_SET = [
  'kpi-revenue-ytd',
  'kpi-pipeline-value',
  'kpi-outstanding',
  'kpi-revenue-per-trial-ytd',
  'quick-stats-card',
  'weekly-team-performance',
  'monthly-team-performance',
  'revenue-trend-card',
];

// Sales-pipeline chart shows for owner/admin/sales only.
const SALES_PIPELINE = 'sales-pipeline-chart';
const NEEDS_ATTENTION = 'needs-attention-banner';

function expectedFor(row: MatrixRow): string[] {
  const set = new Set<string>(ALWAYS_ON);
  if (row.role !== 'trial_consultant') {
    REVENUE_SET.forEach((id) => set.add(id));
  }
  if (row.role === 'owner' || row.role === 'admin' || row.role === 'sales') {
    set.add(SALES_PIPELINE);
  }
  if (row.role === 'owner' || row.role === 'sales') {
    set.add(NEEDS_ATTENTION);
  }
  return [...set];
}

const MATRIX: MatrixRow[] = [
  { role: 'owner', flags: { marketplace_fill_jobs: false, marketplace_post_jobs: false }, expected: [] },
  { role: 'owner', flags: { marketplace_fill_jobs: true, marketplace_post_jobs: true }, expected: [] },
  { role: 'admin', flags: { marketplace_fill_jobs: false, marketplace_post_jobs: false }, expected: [] },
  { role: 'sales', flags: { marketplace_fill_jobs: false, marketplace_post_jobs: false }, expected: [] },
  { role: 'trial_consultant', flags: { marketplace_fill_jobs: false, marketplace_post_jobs: false }, expected: [] },
  { role: undefined, flags: { marketplace_fill_jobs: false, marketplace_post_jobs: false }, expected: [] },
];
MATRIX.forEach((row) => {
  row.expected = expectedFor(row);
});

beforeEach(() => {
  mockUseTier1.mockReset();
});

describe('useDashboardWidgets — role × flag matrix', () => {
  for (const row of MATRIX) {
    const label = `${row.role ?? '(undefined)'} + post=${row.flags.marketplace_post_jobs}`;
    it(label, () => {
      mockUseTier1.mockReturnValue({
        role: row.role,
        company: {
          id: 'co',
          name: 'Co',
          marketplace_fill_jobs: row.flags.marketplace_fill_jobs,
          marketplace_post_jobs: row.flags.marketplace_post_jobs,
        },
      });
      const { result } = renderHook(() => useDashboardWidgets());
      const ids = result.current.map((w) => w.id).sort();
      expect(ids).toEqual([...row.expected].sort());
    });
  }
});

describe('registry shape invariants', () => {
  it('every spec has a unique id', () => {
    const all = __getDashboardRegistryForTests();
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every spec has a valid slot', () => {
    const VALID_SLOTS = new Set([
      'header',
      'banner',
      'kpi',
      'main-1',
      'main-2',
      'main-3',
      'wide',
      'footer',
    ]);
    for (const s of __getDashboardRegistryForTests()) {
      expect(VALID_SLOTS.has(s.slot)).toBe(true);
    }
  });

  it('every spec exposes a Component function reference', () => {
    for (const s of __getDashboardRegistryForTests()) {
      expect(typeof s.Component).toBe('function');
    }
  });
});
