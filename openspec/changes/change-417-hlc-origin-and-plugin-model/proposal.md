# change-417 — HLC + `_origin` + plugin model

## Why
The WebRTC p2p device sync is coming (assessment C2). Adding `_hlc`,
`_origin`, and exposing the merger contract NOW means the wire format
doesn't break when p2p ships. The plugin model (assessment §4.9) is
the third-party extension surface — also baked in now so
`SchemaRegistry.install(plugin)` is well-defined.

## What changes (upstream)
1. Augment `defineSyncedEntity` (change-415):
   - `merge?: (a: Row, b: Row) => Row` — default LWW by `updated_at`.
   - The DDL emitter adds `_hlc TEXT NULL` and `_origin TEXT NULL` to
     every `<entity>_synced` and `<entity>_local`.
2. Augment `defineSyncedEntity` to accept `acceptUnknownColumns: true`
   so Electric-delivered `_hlc` / `_origin` from a more advanced peer
   don't crash older clients.
3. `definePlugin` already exists from change-415. Add:
   - `plugin.install({ registry, lookups })` — fully idempotent.
   - `plugin.uninstall({ registry })` — drops entity tables, removes
     `_pglite_plugin_registry` row, evicts entity-graph types.
   - Plugin DDL linter: rejects `DROP SCHEMA`, `GRANT`, `REVOKE`, raw
     `CREATE EXTENSION`, anything that touches `pg_catalog`. Whitelist:
     `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE … ADD/DROP COLUMN`,
     `CREATE VIEW`, `CREATE FUNCTION` (with plpgsql body restriction).
4. `_pglite_plugin_registry` table (assessment §4.2).
5. NEW `src/sync/p2p-contract.ts` in the package — types + docstrings
   describing the merger contract for future implementers. No runtime
   p2p code yet.

## What changes (this repo)
1. Re-run schema migrator after package bump — `_hlc` + `_origin`
   columns appear on every Tier-A trio via additive ALTER (no data
   loss).
2. NEW `src/shared/lib/hlc.ts` — local HLC generator (`nextHlc()`).
   Not used in writes yet — but exported so stores can start stamping
   `_hlc` on writes that will participate in p2p.
3. Document the plugin model in `docs/architecture/pglite-schema-strategy.md`
   (new appendix).

## Out of scope
- Implementing WebRTC sync. (Separate future phase.)
- Loading a real third-party plugin. (Tested with a fixture plugin.)
- Per-entity custom mergers. (Default LWW only; the API is in place.)

## Acceptance
- All Tier-A `*_synced` and `*_local` tables have `_hlc TEXT` and
  `_origin TEXT` after migration (verified via `\d` in PGlite).
- Loading a fixture plugin from a test creates its tables; uninstalling
  drops them; `_pglite_plugin_registry` reflects state.
- DDL linter rejects a plugin that tries `DROP SCHEMA public`.
- No regression in Cypress tests from prior changes.

## Tasks → see `tasks.md`.
