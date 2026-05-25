# Tasks — change-418

## 418.a — Tooling
- [ ] T1. NEW `scripts/generate-rule-tests.mjs` — reads `docs/BIBLE-BUSINESS-RULES.csv`; for each row emits a `tests/cucumber/features/bible-rules-offline.feature` scenario keyed by `id`. Idempotent (regen replaces).
- [ ] T2. Flip `scripts/bible-rules-coverage.mjs` from `--report` to `--strict` in `.github/workflows/test.yml`. Build fails on missing port or missing test.

## 418.b — Pure-rule ports (parallel, per feature)
For each `feature` in the CSV (clients, trials, invoices, bills, sales,
approvals, time-and-expenses, hot-seat-hub, dashboard, etc.):
- [ ] T3.<feature>. Create `src/features/<feature>/business-rules/` with one TS file per `class in (pure, formatting, validation, conditional-render)` rule. Each file: pure exported function + JSDoc citing `bible_source`.
- [ ] T4.<feature>. NEW unit test per file. Inputs/outputs derived from the bible source (read the JSX; extract the computation). 80%+ branch coverage.

## 418.c — Side-effect ports (per feature)
For each `class='side-effect'` rule:
- [ ] T5.<rule>. In the appropriate store, replace the bible's direct
  email/Stripe/e-sign/Slack call with `queueSideEffect({ name, dedupeKey, payload })`.
  Dedupe key naming: `<feature>:<entity>:<action>:<rowId>:<optional discriminator>`.
- [ ] T6.<rule>. NEW Cypress test (or add scenario to
  `bible-rules-offline.feature`):
  - Online → click trigger → assert HTTP call observed via network log.
  - Offline → click trigger → assert `local_writes` row created with
    matching `dedupe_key` + `state='pending'`; assert pending-sync chip
    increments.
  - Reconnect → assert drain + HTTP call observed.

## 418.d — Server-required ports
For each `class='server-required'` rule:
- [ ] T7.<rule>. Implement in `src/features/<feature>/api/<name>.ts`.
- [ ] T8.<rule>. Caller wraps:
  ```ts
  if (!useNetworkStatus.getState().online) {
    toast.warning('Requires connection — try again when online.');
    return;
  }
  await api.<name>(args);
  ```
- [ ] T9.<rule>. Cypress: offline + trigger → assert toast shown + no
  RPC fired.

## 418.e — Documentation
- [ ] T10. Update `CLAUDE.md` "How to add a feature" recipe step "Build pages/components/hooks/stores/business-rules": add explicit substeps for rule classification + offline policy + queueSideEffect usage for side-effects.
- [ ] T11. Update `docs/FEATURE-TEMPLATE.md` (if it exists) with the same.

## 418.f — Verification
- [ ] T12. CI: `scripts/bible-rules-coverage.mjs --strict` exits 0.
- [ ] T13. Spot-check: pick 5 random rules; manually verify offline policy works as claimed.
- [ ] T14. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.

## Definition of done
- Every CSV row has a port + a test.
- CI fails if a new bible rule is added to the inventory without a port.
- Manual airplane-mode session: side-effect rules queue + drain; server-required rules show the requires-connection toast; pure / formatting / validation rules work transparently.
- RULE J in CLAUDE.md is mechanically enforceable now (CI gates).
