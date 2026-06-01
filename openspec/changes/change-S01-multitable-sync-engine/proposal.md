# change-S01 — multitable sync engine

## Why
`electric-sync.ts` syncs one shape per entity via `syncShapeToTable` in a loop,
giving no cross-table transactional consistency and N independent "synced"
signals (the source of the known hydration race). PGlite's `syncShapesToTables`
lands a server transaction atomically in PGlite and fires a single
`onInitialSync`.

## What changes
Rewrite the Electric ingress in `src/shared/db/electric-sync.ts` to issue one
`db.electric.syncShapesToTables({ shapes, key, onInitialSync, onError, onMustRefetch })`
built from `SYNC_CONFIG`, retaining `createTenantScopedElectricAdapter`
predicate validation. `sync-gate.tsx` flips synced on the single
`onInitialSync`. No behavior change for the 12 already-synced tables.

## Impact
`src/shared/db/electric-sync.ts`, `src/app/sync-gate.tsx`. No new tables.
Foundation for S02–S06. RULE 1/3/5.
