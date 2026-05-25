# Tasks — change-409

- [ ] T1. NEW `tests/e2e/specs/dashboard-widget-registry.spec.ts`. Use Playwright's `test.describe.parallel` across roles. Each test seeds Supabase with a fixture user of the target role + company-flag, signs in, navigates to `/Dashboard`, then asserts each expected widget's `[data-testid]` is or isn't visible per the bible role matrix.
- [ ] T2. NEW `tests/e2e/specs/dashboard-offline-fallback.spec.ts`. Sign in as owner; `await page.context().setOffline(true)`; reload; assert: KPI tiles backed by `Trial` render values; `RevenueTrendCard` shows skeleton; no `[role="alert"]` toast.
- [ ] T3. NEW `tests/e2e/specs/dashboard-realtime.spec.ts`. Sign in as owner; open `/Dashboard`; from a parallel psql connection update `entity_metadata` row's `extra->revenue_probability`; assert `[data-testid="sales-pipeline-chart"]` re-renders within 2 seconds (poll the bar's `aria-label` or hover-tooltip text).
- [ ] T4. EXTEND `tests/visual-parity/playwright.config.ts` with a `/Dashboard` fixture. Drop a bible reference screenshot in `tests/visual-parity/baselines/dashboard-1440.png` + `dashboard-375.png`.
- [ ] T5. NEW Lighthouse-CI assertion config entry for `/Dashboard` — `categories.accessibility: { minScore: 0.95 }`.
- [ ] T6. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] T7. Run `pnpm lh` (or equivalent Lighthouse CI step) and confirm a11y ≥ 95.

## Acceptance

- All 3 new Playwright specs + the visual-parity fixture + the Lighthouse
  gate run green in CI.
- The dashboard's `[data-testid]` map is documented in
  `src/features/dashboard/CLAUDE.md` (set as part of change-408, asserted
  here).
- Bible-parity claim is mechanically enforceable from CI: a future
  widget regression that drifts > 5% fails the gate.
