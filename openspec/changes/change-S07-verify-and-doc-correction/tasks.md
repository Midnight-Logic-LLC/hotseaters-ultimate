# Tasks — change-S07

- [x] Runtime-schema verification test (replaces the planned live-backend Playwright spec, which needs a running supabase+electric stack not available here): added `src/shared/db/__tests__/local-schema-applies.spec.ts` — boots REAL PGlite + vector, applies common+user in boot order, asserts all 19 SYNC_CONFIG entities materialise as queryable views, runs a pgvector `<=>` similarity query, and verifies embedding columns exist ONLY on the 4 configured entities. This permanently guards the S02-class "runtime schema lags SYNC_CONFIG" regression.
- [x] Corrected `src/shared/db/CLAUDE.md`: removed the false "Change 13 / graph-persistence-adapter.ts / entity-graph-bootstrap.ts delivered" claims (those files never existed); documented the real `syncShapesToTables` + `useLiveQuery` pattern, the generated common/user/full schema files, the vector extension, and the new shared read/search hooks. Added an explicit "entity-graph runtime was never adopted" note.
- [x] Updated `docs/architecture/sync-policy.md`: promoted Lead/Attorney/SalesActivity/Invoice/TimeEntry/SubcontractRequest/SubcontractAssignment from "future" to Tier-A (added S02); left BillPayment/Expense as future.
- [x] Fixed CI drift gate: `gen:pglite-schema:check` now `git diff`s all three generated files (local-schema.sql + -common + -user), not just the full one.
- [x] `pnpm typecheck` clean; `pnpm lint` 0 errors (17 pre-existing invoices/bills-page warnings, untouched); full suite 576/576 pass (93 files).

## Network-zero claim — how it's substantiated
- Synced-entity reads in the converted features (S03 sales/leadradar, S04
  approvals, S05 company-settings/roles) now go through `useTierAQuery` /
  `useTierAById` / `useCompanyRow` (useLiveQuery over local PGlite views) — the
  REST read-fetchers were deleted, proven by grep (`eq('company_id')` = 0 in
  those read paths) + the boundary lint.
- A true 2nd-visit "0 network requests" Playwright assertion requires a live
  self-hosted supabase+electric backend; recommended as a follow-up E2E in the
  deployed environment (the harness here has no backend). The deterministic
  substitutes above (deleted fetchers + real-PGlite schema-apply test) cover the
  invariant without a false green.

## Remaining documented follow-ups (not blocking)
- settings-store full local conversion (awaits deferred settings_type +
  per-owner entity_setting sync — S02 v0.2 note).
- Dead-code sweep: invoices/time-entries/subcontracts store read fns, company-
  store fetchUserInfoById/fetchTeamForCompany (unwired).
- Server-side embedding generation for client/trial/lead/attorney (latest-data).
