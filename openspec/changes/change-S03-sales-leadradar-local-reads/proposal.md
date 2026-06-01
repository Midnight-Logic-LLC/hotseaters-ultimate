# change-S03 — sales + lead-radar local reads

## Why
`sales-activity-store.ts` (9× sales_activity, 5× attorney) and
`lead-radar-store.ts` REST-fetch on every visit. After S02 these tables are
synced, so reads should come from PGlite.

## What changes
Convert the deals/sales-activity and lead-radar feature hooks to read
`sales_activity`, `attorney`, `lead` via `useTierAQuery`/`useLiveQuery`.
Stores retain create/update/delete only (routed through `local_writes`
triggers). Delete dead REST `load*` fetchers.

## Impact
`src/features/deals/stores/sales-activity-store.ts`,
`src/features/lead-radar/stores/lead-radar-store.ts`, their hooks. Depends on
S02. RULE B/C/D.
