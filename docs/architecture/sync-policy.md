# Sync Policy — Per-Domain Transport

*change-403 | last updated 2026-05-25*

This document describes which transport mechanism carries each domain's data
from the server to the browser (PGlite) and why. It is the single source of
truth for transport decisions; changes to `sync-config.ts` or
`realtime-channels.ts` must be reflected here.

## Per-Domain Transport Table

| Domain | Transport | Reason |
|---|---|---|
| Clients, Trials, TrialService, TrialContact, TrialSegment, TrialServiceAssignment | ElectricSQL shapes | Large historical set, offline replay, resumable from persisted offsets |
| Lead, Attorney, SalesActivity | ElectricSQL shapes (Tier-A, added S02) | Sales/LeadRadar working set; read locally via useLiveQuery |
| Invoice, TimeEntry, SubcontractRequest, SubcontractAssignment | ElectricSQL shapes (Tier-A, added S02) | Read-heavy historical; server-canonical; safe for bulk replay |
| BillPayment, Expense | ElectricSQL shapes (future Tier-A) | Not yet in SYNC_CONFIG |
| UserInfo (current row), Company (current row) | Supabase Realtime | Single row, latency-sensitive (theme, role changes must propagate in < 2 s) |
| Notifications | Supabase Realtime | Push-driven; no historical bulk-load needed |
| Reference data (metadata_type, entity_metadata — system-wide rows) | ElectricSQL via `system-shapes.ts` | Rarely changes; loaded once per session independent of tenant |
| Reference data (metadata_type, entity_metadata — tenant rows) | ElectricSQL via `electric-sync.ts` | Co-loaded with all Tier-A tenant shapes |
| Auth session | Supabase JS built-in (`onAuthStateChange`) | Already wired; SDK handles token refresh and session persistence |

## Architecture Overview

```
Browser
  └── pglite-client.ts
        openForUser(userId)
          ├── PGliteWorker  (idb://hotseaters/<userId>)
          ├── local-schema-common.sql  ← reference / system DDL (idempotent)
          ├── local-schema-user.sql    ← tenanted DDL (idempotent)
          │
          ├── electric-sync.ts → startTenantSync(userId, companyId)
          │     Tier-A shapes via ElectricSQL syncShapeToTable
          │     (client, trial, trial_service, trial_contact,
          │      trial_segment, trial_service_assignment,
          │      metadata_type tenant rows, entity_metadata,
          │      entity_setting, company, user_info)
          │
          ├── system-shapes.ts → startSystemShapes(userId)
          │     system-wide metadata_type + entity_metadata
          │     (company_id IS NULL rows)
          │
          └── realtime-channels.ts → startRealtimeChannels(userId, companyId, db)
                Supabase Realtime postgres_changes
                  hotseaters:user:<userId>    → user_info_synced
                  hotseaters:company:<cid>    → company_synced
```

## IDB Isolation (change-403)

Each signed-in user has a **fully isolated IndexedDB database** keyed by their
Supabase auth user UUID:

```
idb://hotseaters/<userId>
```

Sign-out calls `closeForUser(userId)` which:
1. Stops all Realtime channel subscriptions (`stopRealtimeChannels`).
2. Closes the PGlite worker and removes the cache entry.
3. Resets the entity graph store to empty (`resetGraph`).

A new sign-in (same or different user) boots a fresh `openForUser(newUserId)`,
ensuring zero cross-user data leakage in shared-device scenarios.

## How to Add a New Table

1. **Decide the transport** using the table above as a guide:
   - Large historical set, offline-required → ElectricSQL shape (Tier-A or Tier-B).
   - Single row, latency-sensitive → Supabase Realtime channel.
   - Reference data (company_id-less) → `system-shapes.ts`.

2. **ElectricSQL path:**
   a. Add an entry to `SYNC_CONFIG` in `src/shared/db/sync-config.ts` with
      `name`, `tier`, `tenantColumn`, and optionally `shapeWhere`.
   b. Add the table name to `EMIT_ORDER` in the same file (FK-dependency order).
   c. Regenerate the local schema:
      ```bash
      node scripts/gen-pglite-schema.mjs
      ```
      This writes to `local-schema-user.sql`. Bump `BUNDLED_PGLITE_SCHEMA_VERSION`
      in `pglite-client.ts` to the new migration timestamp.

3. **Realtime path:**
   a. Add a new `.on('postgres_changes', ...)` block in
      `src/shared/db/realtime-channels.ts` inside `startRealtimeChannels`.
   b. Add a `handle<TableName>Change` helper that upserts into the table's
      `*_synced` counterpart in PGlite.

4. **System shapes path:**
   a. Add a `attachSystemShape(db, 'my_table', 'company_id IS NULL')` call
      inside `startSystemShapes` in `src/shared/db/system-shapes.ts`.
   b. Ensure the table has a `*_synced` counterpart in `local-schema-common.sql`.

5. **Tests:** add a unit test for any new tenant-column predicate in
   `src/shared/db/__tests__/tenant-adapter.spec.ts`.

6. **Update this doc** to add the new domain to the table above.
