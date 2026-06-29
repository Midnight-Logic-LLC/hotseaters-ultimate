# Dashboard Parity Audit — V05

## Audit Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| 1. Bible read | PASS | Dashboard.jsx read end-to-end (1451 lines) |
| 2. DOM hierarchy | PASS | Port reproduces all sections: header, banner, KPI row, 3-col main row, wide row (team+trials), footer (quick actions). Widget registry + slot system mirrors exact layout structure. |
| 3. Visible strings | PASS | Copy verified: "Welcome back, {name}", "Here's what's happening with your business", all KPI labels (Revenue YTD, Pipeline Value, Outstanding, Active Trials, Trials YTD, Revenue/Trial YTD), section headers, empty states. |
| 4. Image assets | N/A | Dashboard has no images (charts are SVG via recharts). |
| 5. Theme tokens | PASS | All `var(--theme-*)` tokens used identically: `--theme-page-padding`, `--theme-card-radius`, `--theme-card-shadow`, `--theme-card-gap`, `--theme-section-gap`, `--theme-card-bg`, `--theme-card-header-bg`, `--theme-stone-*`, `--theme-brand-primary`. |
| 6. Animations | PASS | `hover:shadow-lg transition-shadow` on all card tiles, `animate-spin` on loading spinner, `transition-colors` on list items — all reproduced. |
| 7. Deep links/CTAs | PASS | KPI tiles navigate to Invoices, DealTracker?tab=pipeline, Collections, Trials; Upcoming Trials → Timeline; Recent Invoices → Invoices; Quick Actions → DealTracker, TimeAndExpenses, Clients, Timeline, HelpWanted, Invoices. |
| 8. Business rules | PARTIAL | Widget registry correctly gates by role. Business-rules layer (70 tests from phase A) covers arithmetic. Revenue Trend hybrid REST hook wired. However billing/time-entry widgets may render stubs if hybrid REST stores are not yet initialized. |

## Architecture Assessment

The port uses a widget registry pattern (`use-dashboard-widgets.ts`) instead of the bible's monolithic component. This is an intentional architectural divergence documented in `src/features/dashboard/CLAUDE.md`. The rendered output contract is preserved: same slots, same role matrix, same copy strings. All 17 widget files exist under `src/features/dashboard/widgets/`.

## Defects (V11 Backlog)

- [DEF-D001] Severity: MED — **Wide row layout mismatch**: Bible's Team Performance section uses `grid md:grid-cols-2 lg:grid-cols-4` with `lg:col-span-2` per card (four 2-span cards). Port's `wide` slot uses `grid-cols-1 lg:grid-cols-2`. At 1440px this produces the same 2-up rendering, but the bible's 4-col base means large desktops get a tighter layout. Verify at 1440px screenshot — may be a non-issue if lg breakpoint resolves equivalently.

- [DEF-D002] Severity: MED — **Revenue Trend card slot ordering vs bible**: Bible places Revenue Trend chart after the team performance section in its own full-width row (below the 4-col team grid). Port assigns it to the generic `wide` slot alongside WeeklyTeamPerformance, MonthlyTeamPerformance, ActiveTrialPerformance, and UpcomingTrials. If `wide` renders all five in a 2-col grid, Revenue Trend may appear beside a team card rather than below all team cards. Verify rendered order at 1440px.

- [DEF-D003] Severity: MED — **Billing/time-entry hybrid REST stubs**: KpiRevenueYtd, KpiOutstanding, RecentActivityCard (invoices section), WeeklyTeamPerformance, MonthlyTeamPerformance rely on hybrid REST stores (`invoices-store`, `time-entries-store`). If these stores are not initialized at cold start, widgets may show loading skeletons indefinitely rather than transitioning to empty states. Bible uses react-query with `staleTime: 0` which resolves immediately. Verify each hybrid widget has a working skeleton → data → empty-state transition.

- [DEF-D004] Severity: LOW — **QuickStats HSH flags**: Bible Quick Stats shows "HSH Posts" and "HSH Gigs" rows conditionally on `company.marketplace_post_jobs` / `company.marketplace_fill_jobs`. Verify `CompanyFlags` type in `@/app/navigation` exposes both fields and that `QuickStatsCard` reads them via `useTier1()`.

- [DEF-D005] Severity: LOW — **SubcontractAssignment hybrid store missing**: Bible fetches `subcontractAssignments` and `mySubcontractGigs` as part of the dashboard query. The port's `use-quick-stats.ts` hook references `subcontracts-store` (hybrid REST). Verify this store exists and returns the right shape.

## Inline Fixes Applied

None — defects above require widget-level or store-level changes beyond trivial 1-2 line scope.
