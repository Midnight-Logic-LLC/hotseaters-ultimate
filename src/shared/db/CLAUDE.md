# `src/shared/db/` — the API/sync seam

This directory is the **only** place in the app that may import PGlite,
Electric, Supabase, or the `prometheus-entity-management` engine/adapters.
Components consume hooks; hooks consume stores; stores import from here
(RULE 3 in `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/CLAUDE.md`).

## Hard constraints (restated)

1. **Self-hosted Supabase only.** Never `*.supabase.co`. Local docker-compose
   stack or `https://hotbase.prometheusags.ai` only. Electric: local stack
   or `https://electricsql.prometheusags.ai`. (RULE 1.)
2. **HotSeatersMVP is the bible.** When MVP and the Next.js prior art
   disagree, MVP wins. (RULE 2.)
3. **PGlite has no RLS.** Each Electric shape WHERE must be a subset of the
   matching server RLS USING clause. (RULE 5.)

## What lives here

| File | Role | Owner change |
|---|---|---|
| `sync-config.ts`   | Declarative registry of which server tables sync and at what tier (A=writeable, B=read-only). Single source of truth for both the PGlite generator and the Electric shape registry. | Change 16 (this directory's birth) |
| `local-schema.sql` | **GENERATED** PGlite schema with the `*_synced` / `*_local` / view trio + INSTEAD-OF triggers + `local_writes` queue. **Never hand-edit.** | Change 16 |
| `pglite-client.ts`        | Worker bootstrap + schema apply + boot-time migration. | Change 4 |
| `electric-sync.ts`        | Per-entity Electric shape subscriptions, hydrated from `SYNC_CONFIG`. | Change 4 |
| `write-sync.ts`           | Drains `local_writes` to Supabase REST, on the `local_write` notify. | Change 4 |
| `supabase-client.ts`      | Browser `@supabase/supabase-js` client (no SSR; PKCE flow). | Change 15 |
| `graph-persistence-adapter.ts` | PGlite-backed adapter for `@prometheus-ags/prometheus-entity-management`. | Change 13 (upstream first), consumed here |

## The trio pattern

For every Tier-A entity:

```
                ┌──────────────────────────────────┐
                │ <entity>_synced  (server canonical)│  ← Electric writes
                └──────────────────────────────────┘
                                ▲
                         UNION ALL view <entity>
                                ▼
                ┌──────────────────────────────────┐
                │ <entity>_local   (optimistic)     │  + is_deleted tombstone
                └──────────────────────────────────┘
                                ▲
                INSERT / UPDATE / DELETE
                via INSTEAD-OF triggers on the view
                                │
                                ▼
                  appends to `local_writes`
                                │
                                ▼
                  pg_notify('local_write', ...)
                                │
                                ▼
                  write-sync drain → Supabase REST
                                │
                                ▼
              server canonical → Electric → <entity>_synced
              (the matching <entity>_local row is then cleared)
```

The app always reads and writes the **view**; the synced/local split is
invisible to stores and hooks.

## `_pglite_schema_version` strategy

`local-schema.sql` bakes the latest supabase migration's timestamp prefix
(e.g. `20260523000018`) into a single-row `_pglite_schema_version` table. At
boot, `pglite-client.ts` (Change 4) compares the bundled version to PGlite's
stored version:

- **Match** → apply schema with `CREATE … IF NOT EXISTS` no-ops; continue.
- **Mismatch (bundled is newer)** → drop `*_local` + `*_synced` for migrated
  entities, re-apply the schema, flag `didMigrate: true` so the sync gate
  shows "Updating local cache…", then re-hydrate via Electric.
- **No row at all** (fresh DB) → apply schema, record version.

Local data loss on schema upgrade is acceptable: the server is canonical and
Electric re-hydrates within seconds.

## How to add a new entity

1. Add a row to `SYNC_CONFIG` in `sync-config.ts` with `tier`, `tenantColumn`,
   and optionally `shapeWhere` if the predicate is non-trivial.
2. Add the entity to `EMIT_ORDER` in FK-dependency order.
3. Run `pnpm gen:pglite-schema` from the repo root. This rewrites
   `local-schema.sql`.
4. Add the matching RLS policies in `latest-data/supabase/migrations/`.
5. Verify the shape WHERE is a subset of the RLS USING clause (RULE 5;
   CI will check).

**Never** edit `local-schema.sql` by hand — it is regenerated on every build
(see the `build` script in `package.json`).

## Change 4 modules (delivered)

| File | Purpose |
|---|---|
| `pglite-client.ts` | Lazy `PGliteWorker` singleton + boot-time schema-version check. Exports `getLocalDB`, `bootLocalDB`, `clearLocalTenantData`, `getSyncMeta`, `markHydrated`, and the `BUNDLED_PGLITE_SCHEMA_VERSION` constant. |
| `pglite.worker.ts` | Web Worker entry: PGlite + `live` + `electricSync` extensions; applies `local-schema.sql?raw` on init. |
| `electric-sync.ts` | Per-entity Electric shape subscriptions through the v1.3 `createTenantScopedElectricAdapter` (predicate validation) + `db.electric.syncShapeToTable` (PGlite landing). Exports `startTenantSync`. Refuses any `*.supabase.co` URL. |
| `write-sync.ts` | `NOTIFY('local_write')`-driven drain that POSTs pending `local_writes` rows to Supabase REST and clears the optimistic shadow row. Exports `startWriteSync`. |
| `supabase-client.ts` | Singleton browser `@supabase/supabase-js` client. RULE 1 guardrail refuses Supabase Cloud URLs. |
| `auth-session.ts` | Zustand store wrapping `supabase.auth` + a one-shot `user_info.company_id` resolver. The only auth surface in `shared/db`. |
| `entity-graph-bootstrap.ts` | Wires the v1.3 `createPGlitePersistenceAdapter` + `startLocalFirstGraph` into a single per-tenant runtime. Single bootstrap point (RULE 3 invariant 4). |
| `sync-types.ts` | Compile-time `EntityName` union derived from `SYNC_CONFIG`, plus `TenantClaim` / `SyncGateState` surface types. |

The state machine lives in `src/app/sync-gate.tsx` — that's the single React-level composition point.

## Forward references

- **Change 4 — `pglite-electric-sync-foundation`**: implements
  `pglite-client.ts`, `electric-sync.ts`, `write-sync.ts`, the sync gate UI,
  and the boot-time migration path described above.
- **Change 13 — `entity-mgmt-upstream-improvements`**: lands the
  `GraphPersistenceAdapter` upstream in `prometheus-entity-management`, which
  we then wire into stores from here.
- **Change 15 — `supabase-auth-and-identity-bridge`**: lands the auth bridge
  and the `current_company_id()` helper that this directory's Electric shapes
  depend on.

## Reference

- Plan: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
  §0.6 (sync architecture), §0.11 (migration management), §0.12 (allowlist).
- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`.
- Example-app trio reference: `/Users/gqadonis/Projects/midnight/latest-data/packages/example-app/src/shared/db/local-schema.sql`.
