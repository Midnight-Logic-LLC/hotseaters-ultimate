## ADDED Requirements

### Requirement: Cypress role-permutation spec gates the bible role matrix
`tests/e2e/specs/dashboard-widget-registry.spec.ts` SHALL test 4 roles × 2 marketplace-flag permutations and assert the visible widget IDs match the bible role matrix. CI MUST fail if any single role × flag combination renders the wrong widget set.

#### Scenario: trial_consultant + marketplace_post_jobs=on omits sales widgets
- **WHEN** the Cypress fixture signs in as `trial_consultant` on a company with `marketplace_post_jobs = true`
- **THEN** the visible `[data-testid]` set excludes `kpi-revenue-ytd`, `kpi-pipeline-value`, `kpi-outstanding`, `sales-pipeline-chart`, `quick-stats-card`, `recent-activity-card`, and the `quick-actions-bar` HotSeatHub button

### Requirement: Dashboard works offline for Tier-A widgets
`tests/e2e/specs/dashboard-offline-fallback.spec.ts` SHALL assert that under `context.setOffline(true)`, KPI tiles + lists backed by Tier-A entities still render with cached data and no `[role="alert"]` toast surfaces; hybrid-mode widgets backed by un-synced entities show their loading skeleton without a fatal error.

#### Scenario: Offline reload preserves the trial KPIs
- **WHEN** the user has previously loaded `/Dashboard` (cache populated) AND `page.context().setOffline(true)` is set AND the page reloads
- **THEN** `[data-testid="kpi-active-trials"]`, `[data-testid="kpi-trials-ytd"]`, `[data-testid="upcoming-trials-card"]` render values from the local cache without raising any unhandled rejection

### Requirement: Realtime updates propagate within 2 seconds
`tests/e2e/specs/dashboard-realtime.spec.ts` SHALL assert that a server-side mutation to `entity_metadata` (e.g., a `pipeline_stage`'s `revenue_probability`) propagates to the live dashboard within 2 seconds, exercising the Electric → graph → Realtime Manager → selector path.

#### Scenario: Updating revenue_probability re-renders the chart
- **WHEN** an external psql connection updates a `pipeline_stage` row's `extra->revenue_probability` from 0.5 to 0.9
- **THEN** within 2 seconds, the `SalesPipelineChart` widget's weighted-value tooltip reflects the new factor

### Requirement: Lighthouse a11y on /Dashboard ≥ 95
The Lighthouse-CI config SHALL include `/Dashboard` with an accessibility minimum score of 0.95. CI MUST fail when the score regresses.

#### Scenario: a11y score gate
- **WHEN** Lighthouse CI runs against `/Dashboard`
- **THEN** the `categories.accessibility` score is ≥ 0.95 OR the build fails
