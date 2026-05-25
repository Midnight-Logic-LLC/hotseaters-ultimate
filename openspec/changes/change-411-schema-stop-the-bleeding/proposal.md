# change-411 — Schema stop-the-bleeding

## Why
Three concrete defects in `src/shared/db/` cause the bulk of today's
pain:

1. **Latent version-stamp bug** — `local-schema-common.sql:23` re-stamps
   `_pglite_schema_version` on every boot, BEFORE `pglite-client.ts:127`
   reads it for the mismatch check. The check is partially relying on
   accidental ordering. Documented in
   [`docs/architecture/pglite-schema-strategy.md`](../../../docs/architecture/pglite-schema-strategy.md)
   §1.1.
2. **No forward-compatibility for additive server columns.** Electric
   delivers a new column → PGlite crashes. The fix is the `_extra JSONB`
   sidecar from the assessment §4.4.
3. **Non-transactional migration.** `dropTierATables` and the schema
   re-apply are separate `db.exec` calls; a crash between them bricks
   the app (assessment §1.2.3).

This change does not introduce the per-table fingerprint architecture —
that is change-412. It buys time and unblocks 412 by removing the
bricks.

## What changes
1. Move the `_pglite_schema_version` `INSERT … ON CONFLICT DO UPDATE`
   OUT of `local-schema-common.sql` into a dedicated stamping step in
   `pglite-client.ts` that runs AFTER the migration decision has been
   made.
2. Add `_extra JSONB NOT NULL DEFAULT '{}'::jsonb` to every
   `<entity>_synced` and `<entity>_local` table in
   `local-schema-common.sql` and `local-schema-user.sql`.
3. Regenerate `local-schema-user.sql` via `scripts/gen-pglite-schema.mjs`
   so the generator also emits `_extra` for every entity.
4. Update every `*_synced` view's SELECT list AND every INSTEAD-OF
   trigger to handle `_extra` (read-through; pass-through on insert and
   update).
5. NEW thin wrapper `src/shared/db/synced-entity-writer.ts` —
   replaces direct `db.electric.syncShapeToTable` calls in
   `electric-sync.ts`. Routes Electric-delivered columns that don't
   exist locally into `_extra`. Logs (DEBUG) when this happens so we
   know when the client is behind.
6. Wrap migration block in `pglite-client.ts:127-145` in
   `BEGIN; ... COMMIT;` with rollback on any step failure.
7. Bump `BUNDLED_PGLITE_SCHEMA_VERSION` to `20260526000001` so existing
   clients trigger one final migration to acquire `_extra` columns.

## Out of scope
- Per-table fingerprints (change-412).
- Removing the `BUNDLED_PGLITE_SCHEMA_VERSION` constant (change-412).
- The pending-sync UX (change-414).

## Acceptance
- A new column added to `public.client` in latest-data + Electric
  refresh delivers the column → PGlite client does NOT crash; the
  unknown value lands in `client_synced._extra`.
- Chaos test: kill the PGlite worker mid-migration (between drop and
  re-apply), reload — app boots, no data loss vs. the pre-crash state.
- `_pglite_schema_version` reads the PREVIOUS value during the mismatch
  check; new value is only written after the migration succeeds.
- All existing tests pass; no behavioral regression in
  `tests/cucumber/` or `tests/e2e/`.

## Tasks → see `tasks.md`.
