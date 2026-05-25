/**
 * DashboardPage page-shell smoke test.
 *
 * Asserts the shell:
 *   • renders the dashboard-page testid,
 *   • renders EmptyDashboard when useDashboardEmpty returns isEmpty,
 *   • otherwise renders every widget the registry returns.
 *
 * Visual parity + role-permutation assertions live in change-409
 * (Playwright). This spec covers shape only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Stub all transitive supabase use so module imports don't crash.
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

const mockUseDashboardWidgets = vi.fn();
const mockUseDashboardLayout = vi.fn();
const mockUseDashboardEmpty = vi.fn();

vi.mock('@/features/dashboard/hooks/use-dashboard-widgets', () => ({
  useDashboardWidgets: () => mockUseDashboardWidgets(),
  useDashboardLayout: () => mockUseDashboardLayout(),
}));
vi.mock('@/features/dashboard/hooks/use-dashboard-empty', () => ({
  useDashboardEmpty: () => mockUseDashboardEmpty(),
}));
vi.mock('@/features/dashboard/components/empty-dashboard', () => ({
  EmptyDashboard: () => <div data-testid="empty-dashboard">Empty</div>,
}));

import { DashboardPage } from '../dashboard-page';

function FakeWidget({ id }: { id: string }) {
  return <div data-testid={`widget-${id}`}>{id}</div>;
}

beforeEach(() => {
  mockUseDashboardLayout.mockReturnValue({
    kpiGridClass: 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
    quickActionsGridClass: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  });
  mockUseDashboardEmpty.mockReturnValue({ isEmpty: false, isLoading: false });
});

describe('DashboardPage', () => {
  it('renders the page testid', () => {
    mockUseDashboardWidgets.mockReturnValue([]);
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-page')).toBeTruthy();
  });

  it('renders EmptyDashboard when useDashboardEmpty.isEmpty=true', () => {
    mockUseDashboardEmpty.mockReturnValue({ isEmpty: true, isLoading: false });
    mockUseDashboardWidgets.mockReturnValue([
      { id: 'kpi-active-trials', Component: () => <FakeWidget id="kpi-active-trials" />, slot: 'kpi', enabledFor: () => true },
    ]);
    render(<DashboardPage />);
    expect(screen.getByTestId('empty-dashboard')).toBeTruthy();
    // Widgets NOT rendered when the empty splash is showing.
    expect(screen.queryByTestId('widget-kpi-active-trials')).toBeNull();
  });

  it('renders one widget per registry spec when not empty', () => {
    mockUseDashboardWidgets.mockReturnValue([
      { id: 'kpi-active-trials', Component: () => <FakeWidget id="kpi-active-trials" />, slot: 'kpi', enabledFor: () => true },
      { id: 'recent-activity-card', Component: () => <FakeWidget id="recent-activity-card" />, slot: 'main-3', enabledFor: () => true },
      { id: 'quick-actions-bar', Component: () => <FakeWidget id="quick-actions-bar" />, slot: 'footer', enabledFor: () => true },
    ]);
    render(<DashboardPage />);
    expect(screen.getByTestId('widget-kpi-active-trials')).toBeTruthy();
    expect(screen.getByTestId('widget-recent-activity-card')).toBeTruthy();
    expect(screen.getByTestId('widget-quick-actions-bar')).toBeTruthy();
  });

  it('applies the kpiGridClass returned by useDashboardLayout to the KPI row', () => {
    // Simulate the narrow (trial_consultant) layout via the hook.
    mockUseDashboardLayout.mockReturnValue({
      kpiGridClass: 'grid grid-cols-2',
      quickActionsGridClass: 'grid grid-cols-2 sm:grid-cols-4',
    });
    mockUseDashboardWidgets.mockReturnValue([
      { id: 'kpi-active-trials', Component: () => <FakeWidget id="kpi-active-trials" />, slot: 'kpi', enabledFor: () => true },
    ]);
    const { container } = render(<DashboardPage />);
    const section = container.querySelector('section[aria-label="Key metrics"]');
    expect(section).not.toBeNull();
    expect(section?.className).toContain('grid-cols-2');
    expect(section?.className).not.toContain('xl:grid-cols-6');
  });
});
