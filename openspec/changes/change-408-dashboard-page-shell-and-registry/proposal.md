# change-408 — Dashboard page shell + role-aware registry + cleanup

## Why
With 17 widgets and 14 hooks in place, the page shell becomes the
**composition surface** — it doesn't render any business logic, just
reads a role-aware widget registry and lays each widget into its grid
slot.

This change also retires the monolithic
`useDashboardAggregates.ts` + 4 sibling hooks + 2 sibling components
that the per-widget architecture replaces. The cleanup happens in the
same change so the diff is reviewable as a single "swap" rather than
two PRs that leave dead code in between.

## What changes

### NEW
- `src/features/dashboard/hooks/use-dashboard-widgets.ts` — role-aware
  registry returning `WidgetSpec[]`:
  ```ts
  type WidgetSpec = {
    id: string;
    Component: React.FC;
    layout: 'kpi' | 'main-1' | 'main-2' | 'main-3' | 'full';
    enabledFor: (role: Role, company: CompanyFlags) => boolean;
  };
  ```

### REWRITE
- `src/features/dashboard/pages/dashboard-page.tsx` (~150 LOC):
  - Reads `useDashboardWidgets()` → `WidgetSpec[]`.
  - Reads `useTier1()` for the `isEmpty` decision (delegates to
    `EmptyDashboard` if no clients + no trials + no revenue).
  - Renders the bible's layout grid (KPI row, 3-col main row, two
    2-col rows, full-width row) with each spec dropped into its `layout`
    slot.
  - No role check, no widget data fetching, no business logic.

- `src/features/dashboard/CLAUDE.md` — rewritten to reflect the new
  architecture (Phase A→F sequence, registry pattern, per-widget hook
  invariants).

### DELETE
- `src/features/dashboard/hooks/use-dashboard-aggregates.ts` (+ spec).
- `src/features/dashboard/hooks/use-dashboard-card-data.ts`.
- `src/features/dashboard/hooks/use-dashboard-stats.ts`.
- `src/features/dashboard/hooks/use-recent-clients.ts`.
- `src/features/dashboard/hooks/use-recent-trials.ts`.
- `src/features/dashboard/components/stat-card.tsx`.
- `src/features/dashboard/components/revenue-trend-card.tsx` (after
  confirming `widgets/revenue-trend-card.tsx` from change-407 replaces it).

### KEEP
- `src/features/dashboard/components/empty-dashboard.tsx`.
- `src/features/dashboard/components/stub-card.tsx` (still used in
  scenarios where a widget's entity isn't synced AND no REST fallback
  exists; rare after change-406).

## Out of scope
- Bible-rule rehoming for the entire app (offline-first change-418
  covers non-dashboard features).
- Verification (change-409).

## Tasks → see `tasks.md`.
