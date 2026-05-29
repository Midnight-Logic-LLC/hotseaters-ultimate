/**
 * use-dashboard-widgets — role-aware widget registry for the dashboard.
 *
 * The registry is the single source of truth for:
 *   • which widgets appear at all (per role + company-flag),
 *   • which grid slot they render into,
 *   • the order they render in.
 *
 * Components MUST NOT contain `role === '…'` literals — the registry
 * owns gating as data, per RULE B + the dashboard-bible-parity-build
 * plan §4.6. Adding a widget = adding a registry row + a widget file +
 * a hook file. Zero edits to `dashboard-page.tsx`.
 *
 * Bible role matrix: see `.claude/plans/foamy-marinating-hollerith.md`
 * §Bible widget inventory + Quick Actions role matrix.
 */

import { useMemo, type ComponentType } from 'react';
import type { Role as LegacyRole, CompanyFlags } from '@/app/navigation';
import { useTier1 } from '@/app/tier1-provider';
import { WelcomeHeader } from '@/features/dashboard/widgets/welcome-header';
import { NeedsAttentionBanner } from '@/features/dashboard/widgets/needs-attention-banner';
import { KpiRevenueYtd } from '@/features/dashboard/widgets/kpi-revenue-ytd';
import { KpiPipelineValue } from '@/features/dashboard/widgets/kpi-pipeline-value';
import { KpiOutstanding } from '@/features/dashboard/widgets/kpi-outstanding';
import { KpiActiveTrials } from '@/features/dashboard/widgets/kpi-active-trials';
import { KpiTrialsYtd } from '@/features/dashboard/widgets/kpi-trials-ytd';
import { KpiRevenuePerTrialYtd } from '@/features/dashboard/widgets/kpi-revenue-per-trial-ytd';
import { SalesPipelineChart } from '@/features/dashboard/widgets/sales-pipeline-chart';
import { QuickStatsCard } from '@/features/dashboard/widgets/quick-stats-card';
import { RecentActivityCard } from '@/features/dashboard/widgets/recent-activity-card';
import { WeeklyTeamPerformance } from '@/features/dashboard/widgets/weekly-team-performance';
import { MonthlyTeamPerformance } from '@/features/dashboard/widgets/monthly-team-performance';
import { ActiveTrialPerformance } from '@/features/dashboard/widgets/active-trial-performance';
import { UpcomingTrialsCard } from '@/features/dashboard/widgets/upcoming-trials-card';
import { RevenueTrendCard } from '@/features/dashboard/widgets/revenue-trend-card';
import { QuickActionsBar } from '@/features/dashboard/widgets/quick-actions-bar';

/**
 * Grid slot — drives where in the page layout the widget renders.
 *  - `header`       — welcome strip above the KPI row (desktop only).
 *  - `banner`       — full-width attention banner above KPIs.
 *  - `kpi`          — KPI tile row (responsive 2 → 3 → 6 grid).
 *  - `main-1`       — first 1-col card in the main row.
 *  - `main-2`       — second 1-col card in the main row.
 *  - `main-3`       — third 1-col card in the main row.
 *  - `wide`         — full-width row below the main row (charts).
 *  - `footer`       — full-width footer row (quick actions).
 */
export type WidgetSlot =
  | 'header'
  | 'banner'
  | 'kpi'
  | 'main-1'
  | 'main-2'
  | 'main-3'
  | 'wide'
  | 'footer';

/**
 * Audience inputs for a widget's visibility predicate. `role` is the legacy
 * company role; `isSales` mirrors the bible's `user_info.is_sales` flag, which
 * grants sales surfaces to any user regardless of their company role.
 */
export interface WidgetAudience {
  role: LegacyRole | undefined;
  isSales: boolean;
}

export interface WidgetSpec {
  id: string;
  Component: ComponentType;
  slot: WidgetSlot;
  /** Returns true when this widget should render for the given audience + flags. */
  enabledFor: (audience: WidgetAudience, company: CompanyFlags | null) => boolean;
}

// Role helpers — bible matrix from Dashboard.jsx 53–58.
const showsRevenueSurface = (role: LegacyRole | undefined): boolean =>
  role !== 'trial_consultant';
const showsSalesSurface = (role: LegacyRole | undefined): boolean =>
  role === 'owner' || role === 'admin' || role === 'sales';
// Bible Dashboard.jsx:57 — `isOwner || isSales || userInfo?.is_sales === true`.
// The third leg surfaces the banner to any `is_sales` user regardless of role
// (e.g. a trial_consultant flagged for sales).
const showsAttentionBanner = (audience: WidgetAudience): boolean =>
  audience.role === 'owner' || audience.role === 'sales' || audience.isSales;

/**
 * REGISTRY — render order matters. Each `slot` is filled in this order;
 * the page shell groups by slot when laying out.
 */
const REGISTRY: WidgetSpec[] = [
  // Header strip
  { id: 'welcome-header', Component: WelcomeHeader, slot: 'header', enabledFor: () => true },

  // Banner
  {
    id: 'needs-attention-banner',
    Component: NeedsAttentionBanner,
    slot: 'banner',
    enabledFor: (audience) => showsAttentionBanner(audience),
  },

  // KPI row — bible Dashboard.jsx 762–884
  {
    id: 'kpi-revenue-ytd',
    Component: KpiRevenueYtd,
    slot: 'kpi',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  {
    id: 'kpi-pipeline-value',
    Component: KpiPipelineValue,
    slot: 'kpi',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  {
    id: 'kpi-outstanding',
    Component: KpiOutstanding,
    slot: 'kpi',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  { id: 'kpi-active-trials', Component: KpiActiveTrials, slot: 'kpi', enabledFor: () => true },
  { id: 'kpi-trials-ytd', Component: KpiTrialsYtd, slot: 'kpi', enabledFor: () => true },
  {
    id: 'kpi-revenue-per-trial-ytd',
    Component: KpiRevenuePerTrialYtd,
    slot: 'kpi',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },

  // Main 3-col row — Pipeline | Quick Stats | Recent Activity
  {
    id: 'sales-pipeline-chart',
    Component: SalesPipelineChart,
    slot: 'main-1',
    enabledFor: ({ role }) => showsSalesSurface(role),
  },
  {
    id: 'quick-stats-card',
    Component: QuickStatsCard,
    slot: 'main-2',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  {
    id: 'recent-activity-card',
    Component: RecentActivityCard,
    slot: 'main-3',
    enabledFor: () => true,
  },

  // Wide rows — Team perf, active-trial perf, upcoming, revenue trend
  {
    id: 'weekly-team-performance',
    Component: WeeklyTeamPerformance,
    slot: 'wide',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  {
    id: 'monthly-team-performance',
    Component: MonthlyTeamPerformance,
    slot: 'wide',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },
  {
    id: 'active-trial-performance',
    Component: ActiveTrialPerformance,
    slot: 'wide',
    enabledFor: () => true,
  },
  {
    id: 'upcoming-trials-card',
    Component: UpcomingTrialsCard,
    slot: 'wide',
    enabledFor: () => true,
  },
  {
    id: 'revenue-trend-card',
    Component: RevenueTrendCard,
    slot: 'wide',
    enabledFor: ({ role }) => showsRevenueSurface(role),
  },

  // Footer
  { id: 'quick-actions-bar', Component: QuickActionsBar, slot: 'footer', enabledFor: () => true },
];

export interface DashboardLayout {
  /** Tailwind class for the KPI row grid. */
  kpiGridClass: string;
  /** Tailwind class for the QuickActionsBar inner grid. */
  quickActionsGridClass: string;
}

/**
 * Role-derived layout decisions for the dashboard. Centralised here so
 * widgets + page shell never branch on `role` directly — that would
 * fail the CI grep gate `git grep -nE "role === '" src/features/dashboard/`.
 */
export function useDashboardLayout(): DashboardLayout {
  const { role } = useTier1();
  return useMemo(() => {
    const narrow = role === 'trial_consultant';
    return {
      kpiGridClass: narrow
        ? 'grid grid-cols-2'
        : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
      quickActionsGridClass: narrow
        ? 'grid grid-cols-2 sm:grid-cols-4'
        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    };
  }, [role]);
}

/** Returns the role-filtered widget specs in declaration order. */
export function useDashboardWidgets(): WidgetSpec[] {
  const { role, userInfo, company } = useTier1();
  const isSales = userInfo?.is_sales === true;
  return useMemo(() => {
    const audience: WidgetAudience = { role, isSales };
    const flags: CompanyFlags | null = company
      ? {
          marketplace_fill_jobs: company.marketplace_fill_jobs ?? false,
          marketplace_post_jobs: company.marketplace_post_jobs ?? false,
        }
      : null;
    return REGISTRY.filter((w) => w.enabledFor(audience, flags));
  }, [role, isSales, company]);
}

/** Test-only helper — exposes the full registry without role filtering. */
export function __getDashboardRegistryForTests(): ReadonlyArray<WidgetSpec> {
  return REGISTRY;
}
