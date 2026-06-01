# Execution — local-first-sync-architecture

> **Backend:** OpenSpec (`change_backend: openspec`).
> **Dispatch model:** in-session (Claude Code), change-by-change in dependency
> order. QA gate (artifact-refiner) per change with ≥3 files; skipped below the
> threshold.
> **Activation:** user chose to execute change-S01 directly; the project's
> `current-waypoint.json` remains `page-parity-verification-hardening`
> (unchanged). This phase's state lives in its own `waypoint.json` /
> `progress.json`.

## Order
1. **change-S01** multitable-sync-engine — **DONE** (1 file)
2. change-S02 sync-config-coverage — PLANNED (depends S01)
3. change-S03 / S04 / S05 / S06 — PLANNED, parallel after S02
4. change-S07 verify + doc correction — PLANNED, after S03–S06

## change-S01 — multitable-sync-engine — DONE (2026-06-01)

**What changed:** `src/shared/db/electric-sync.ts` migrated from a per-entity
`syncShapeToTable` loop to a single transactional
`db.electric.syncShapesToTables({ key, shapes, onInitialSync })`.

- Tenant predicate validation via `createTenantScopedElectricAdapter` is
  preserved — the `shapeStreamFactory` now only surfaces each table's validated
  `where` (collected into a Map); the real sync is the single multi-table call.
- One `onInitialSync` drives `didInitialHydration`; the wall-clock budget race
  (`raceHydrationAgainstBudget`) and late `onHydrated` stamping are preserved
  unchanged (the production infinite-splash fix stays intact).
- Graceful degradation on establishment rejection (HTTP 400 etc.): log, resolve
  initial-sync, no-op unsubscribe → boot gate proceeds, renders from PGlite
  (Pattern 4). Mirrors the old per-shape `.catch`, now at subscription
  granularity.
- Resumable `key` is per-tenant (`tenant:<companyId>`).
- Removed dead helpers: `attachShape`, `waitForSubs`, `waitForInitialSync`,
  `AttachShapeOptions`, `ShapeSubscription`, `INITIAL_SYNC_TIMEOUT_MS`.

**Verification (all green):**
- `pnpm typecheck` — clean
- `pnpm eslint src/shared/db/electric-sync.ts` — clean (boundaries RULE 3)
- `pnpm test src/shared/db` — 36/36 (incl. hydration-race + companyid regression specs)

**Public contract unchanged:** `startTenantSync` signature + `TenantSyncResult`
identical → `src/app/sync-gate.tsx` needed no edit; no other module referenced
the removed internals.

**Net diff:** +141 / −188 in one file.

**QA gate:** skipped (1 file < 3-file threshold).

**Not done in S01 (deferred to where relevant):**
- `onMustRefetch` wiring — add when S02 brings a table that needs refetch
  semantics (date-range / multi-shape-per-table).

## Environment note
This git worktree required one-time setup to build/test:
`git submodule update --init packages/prometheus-entity-management`,
`pnpm install`, and `pnpm build` in that submodule (its `dist/` must exist for
vite to resolve `@prometheus-ags/prometheus-entity-management` in tests). This
is environment setup, not part of the change diff.
