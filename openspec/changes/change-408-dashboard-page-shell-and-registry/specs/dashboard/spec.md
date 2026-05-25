## ADDED Requirements

### Requirement: Role-aware widget registry drives the page
`src/features/dashboard/hooks/use-dashboard-widgets.ts` SHALL export `useDashboardWidgets()` that returns `WidgetSpec[]` filtered by the current `role` + `company` flags. Each `WidgetSpec` declares `{ id, Component, layout, enabledFor }`. `dashboard-page.tsx` SHALL consume this registry and render each widget into its `layout` slot — adding a new widget MUST require only a new registry row + a new widget file + a new hook file, with zero edits to `dashboard-page.tsx`.

#### Scenario: Owner sees the full widget set
- **WHEN** `useTier1()` resolves `role = 'owner'` and `company.marketplace_post_jobs = false`
- **THEN** `useDashboardWidgets()` returns all 17 widget specs minus `quick-actions-hsh`

#### Scenario: Trial consultant sees the narrowed set
- **WHEN** `useTier1()` resolves `role = 'trial_consultant'`
- **THEN** `useDashboardWidgets()` returns exactly: `welcome-header`, `kpi-active-trials`, `kpi-trials-ytd`, `active-trial-performance`, `upcoming-trials-card`, `quick-actions-bar` (the trial-consultant variant)

### Requirement: Monolithic dashboard aggregator + sibling files retired
The following files SHALL be removed in the same change as the page rewrite — `src/features/dashboard/hooks/use-dashboard-aggregates.ts` (+ its spec), `use-dashboard-card-data.ts`, `use-dashboard-stats.ts`, `use-recent-clients.ts`, `use-recent-trials.ts`, `components/stat-card.tsx`, `components/revenue-trend-card.tsx` (after widget-port replacement). Remaining callers MUST migrate to the per-widget hooks.

#### Scenario: Deprecated files do not exist on disk
- **WHEN** CI inspects the working tree after change-408
- **THEN** none of the deprecated paths above resolve to an existing file
