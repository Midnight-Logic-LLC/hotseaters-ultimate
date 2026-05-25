# Tasks — change-407

## Shared primitive

- [x] T1. NEW `widgets/kpi-tile.tsx` — composable Card with title, value, icon, optional caption, click handler. Theme-tokens only. Renders skeleton when `value === undefined`. Spec: snapshot for value+caption, value-only, click handler fires.

## KPI widgets (one component per tile)

- [x] T2. NEW `widgets/kpi-revenue-ytd.tsx`. Uses `useRevenueAggregate()` (extracted helper in `use-recent-activity` or new `use-revenue-ytd`) → `KpiTile`. Click → `navigate('/Invoices')`.
- [x] T3. NEW `widgets/kpi-pipeline-value.tsx`. `usePipelineSummary()` → `KpiTile`. Click → `navigate('/DealTracker?tab=pipeline')`. Caption shows `$weighted weighted • N active deals` per bible.
- [x] T4. NEW `widgets/kpi-outstanding.tsx`. `useQuickStats().outstanding` → `KpiTile`. Click → `navigate('/Collections')`.
- [x] T5. NEW `widgets/kpi-active-trials.tsx`. `usePipelineSummary()` (ops side) → `KpiTile`. Click → `navigate('/Trials')`.
- [x] T6. NEW `widgets/kpi-trials-ytd.tsx`. Inline `useEntityList<Trial>` derive. Click → `navigate('/Trials')`.
- [x] T7. NEW `widgets/kpi-revenue-per-trial-ytd.tsx`. `useQuickStats()` aggregate → `KpiTile`. Click → `navigate('/Trials')`.

## Chart + list widgets

- [x] T8. NEW `widgets/sales-pipeline-chart.tsx`. `usePipelineSummary()` → recharts `<BarChart>` with `dealsByStage`. Wrap in `<Card>`; aria-label.
- [x] T9. NEW `widgets/quick-stats-card.tsx`. Lists 7 secondary counters in a `<Card>`. Skeleton row for each unloaded value.
- [x] T10. NEW `widgets/recent-activity-card.tsx`. Lists `recentlyWon` + `recentInvoices`. Empty state copy from bible.
- [x] T11. NEW `widgets/weekly-team-performance.tsx`. Horizontal `<BarChart>` per consultant (`useTeamWeek`). HSH rows colored per bible.
- [x] T12. NEW `widgets/monthly-team-performance.tsx`. Same shape, monthly.
- [x] T13. NEW `widgets/active-trial-performance.tsx`. Horizontal `<BarChart>` of `useActiveTrialStats()`. Empty: "No active trial data yet" per bible 1247.
- [x] T14. NEW `widgets/upcoming-trials-card.tsx`. `useUpcomingTrials()` → list with click → `/Trials`. Header has "View Schedule" link → `/Timeline`. Empty: "No upcoming trials scheduled" per bible 1318.

## Revenue trend (most complex)

- [x] T15. NEW `widgets/revenue-trend-card.tsx`. Composes `useRevenueTrend()` + `useDashboardPreferences()`. Renders `<LineChart>` with revenue + projected + trend + goal lines. Three toolbar controls: fiscal-year select, period toggle (Month/Week), cumulative toggle. Each toggle fires `useDashboardPreferences()` setter.

## Quick actions + banner

- [x] T16. NEW `widgets/quick-actions-bar.tsx`. Reads `useQuickActions()` → grid of `<Button variant="outline">` with icon stack per bible 1338–1432. Renders 4-wide on mobile, 5–6 on desktop. No role check inside.
- [x] T17. NEW `widgets/welcome-header.tsx`. Reads `useTier1().userInfo.first_name`; shows bible header copy + subhead. Renders nothing if `userInfo` not loaded yet (no skeleton — header is decorative; the grid below has its own).
- [x] T18. NEW `widgets/needs-attention-banner.tsx`. Hidden when `staleMyCount === 0 && !(isOwner && staleTotalCount > 0)`. Click → `/LeadRadar`.

## Tests

- [x] T19. Component snapshot test per widget under `widgets/__tests__/<name>.spec.tsx`. Render with seeded hook mocks; snapshot DOM.
- [ ] T20. `tests/visual-parity/specs/dashboard-widgets.spec.ts` — Playwright spec that mounts each widget in isolation at 1440×900 + 375×667 and asserts ≤5% pixel-drift vs the bible reference screenshots. **(Deferred to change-409.)**

## Verification

- [x] T21. `pnpm typecheck && pnpm lint && pnpm test` green.
- [ ] T22. `pnpm test:e2e tests/visual-parity/specs/dashboard-widgets.spec.ts` green. **(Deferred to change-409.)**
- [x] T23. `eslint-plugin-boundaries` enforces: widget files import only hooks + UI primitives + lucide-react + recharts + date-fns. No `useGraphStore`, no `getLocalDB`, no supabase client.
- [ ] T24. Lighthouse a11y on a stub page that mounts all widgets: ≥ 95. **(Deferred to change-409.)**

## Acceptance

- 17 widget files + 17 snapshot specs + 1 visual-parity spec.
- Every visible color/font/spacing reads from `var(--theme-*)`.
- No widget contains `role === '…'` or any role string literal.
- Side-by-side overlay at 1440×900 vs the bible: ≤5% drift per widget.
