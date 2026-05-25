# Tasks — change-408

- [ ] T1. NEW `src/features/dashboard/hooks/use-dashboard-widgets.ts`:
  - `WidgetSpec` type.
  - `REGISTRY: WidgetSpec[]` literal listing all 17 widgets in render order. Each entry: `id`, `Component`, `layout`, `enabledFor`.
  - `useDashboardWidgets()` hook: reads `useTier1()` and returns `REGISTRY.filter((w) => w.enabledFor(role, company))`.
- [ ] T2. NEW unit spec `use-dashboard-widgets.spec.ts` — table-driven across 4 roles × 2 marketplace flags. Each row asserts the visible widget IDs match a hand-curated expected set (derived from the bible role matrix in `foamy-marinating-hollerith.md`).
- [ ] T3. REWRITE `src/features/dashboard/pages/dashboard-page.tsx`:
  - Header: bible welcome copy.
  - Empty check: if `useTier1().company` has no trials AND no clients AND no revenue, render `<EmptyDashboard />` (read from a thin `use-dashboard-empty.ts` selector that composes graph counts).
  - Grid: render `<KpiGrid>`, `<MainRow>`, `<TeamRow>`, `<TrialActivityRow>`, `<RevenueTrendRow>`, `<QuickActionsRow>` — each is a layout component that filters `useDashboardWidgets()` by `layout` and renders.
  - Total LOC ≤ 200.
- [ ] T4. DELETE `use-dashboard-aggregates.ts` + its spec + any test fixture file that imports it. Run `pnpm typecheck` to confirm zero callers remain.
- [ ] T5. DELETE `use-dashboard-card-data.ts`, `use-dashboard-stats.ts`, `use-recent-clients.ts`, `use-recent-trials.ts`.
- [ ] T6. DELETE `components/stat-card.tsx` + `components/revenue-trend-card.tsx`. Verify all callers now reference `widgets/kpi-tile.tsx` and `widgets/revenue-trend-card.tsx`.
- [ ] T7. KEEP + update import paths in `components/empty-dashboard.tsx` if needed.
- [ ] T8. REWRITE `src/features/dashboard/CLAUDE.md`:
  - New architecture diagram (pages → registry → widgets → hooks → business-rules + Tier1).
  - Per-widget invariants table.
  - "How to add a widget" recipe (one entry in REGISTRY + one widget file + one hook file).
  - Sync-tier matrix (Tier-A vs hybrid-fallback per entity).
- [ ] T9. Snapshot test `dashboard-page.spec.tsx` (component-level) — render `<DashboardPage />` inside `<MockTier1Provider role="owner">` with seeded graph; assert all expected widget components are mounted (look for their root `data-testid`).
- [ ] T10. `pnpm typecheck && pnpm lint && pnpm test` green.
- [ ] T11. `pnpm size` within budget (the deletion should reduce bundle, not grow it).
- [ ] T12. CI grep gate: `git grep "role === " src/features/dashboard/widgets/ src/features/dashboard/pages/` returns no matches.

## Acceptance

- `dashboard-page.tsx` ≤ 200 LOC and contains no `role === '…'` string.
- Adding a widget = adding a `REGISTRY` row + a widget file + a hook file. No edits to `dashboard-page.tsx`.
- Bundle size unchanged or smaller.
- All deprecated files deleted in the same commit (single reviewable swap).
- `pnpm typecheck && pnpm lint && pnpm test` green.
