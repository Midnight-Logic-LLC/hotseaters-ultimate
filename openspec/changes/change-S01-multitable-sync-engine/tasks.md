# Tasks — change-S01

- [x] Build a `shapes` record from `SYNC_CONFIG` (name → {shape, table, primaryKey, schema})
- [x] Replace per-entity `syncShapeToTable` loop with one `syncShapesToTables({ shapes, key })`
- [x] Keep `createTenantScopedElectricAdapter` predicate validation per table
- [x] Wire single `onInitialSync` → sync-gate "synced"; remove N-sub counting
- [x] Implement graceful degradation on establishment failure; preserve resumable `key` (per-tenant)
- [x] Verify no table is targeted by two shapes (PGlite limitation) — each lands in distinct `<name>_synced`
- [x] Regression: 12 existing tables still hydrate; `electric-sync-hydration-race.spec.ts` green (36/36)
- [x] `pnpm typecheck && pnpm lint && pnpm test` green

## Notes
- `onMustRefetch` not wired in S01 (no date-range/multi-shape-per-table case yet);
  add when S02 introduces tables that need it.
- Net diff: +141 / −188 (simpler). Public contract of `startTenantSync` /
  `TenantSyncResult` unchanged → `sync-gate.tsx` needed no edit.
- QA gate (artifact-refiner) skipped: 1 file changed (< 3-file threshold).
