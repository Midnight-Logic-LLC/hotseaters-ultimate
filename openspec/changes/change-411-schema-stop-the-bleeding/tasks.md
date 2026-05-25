# Tasks — change-411

## 411.a — Version-stamp bug fix
- [ ] T1. Remove the `INSERT INTO _pglite_schema_version ... ON CONFLICT DO UPDATE` block from `src/shared/db/local-schema-common.sql`. Keep only the `CREATE TABLE IF NOT EXISTS`.
- [ ] T2. In `src/shared/db/pglite-client.ts`, add a `stampSchemaVersion(db, version)` helper that performs the INSERT...ON CONFLICT DO UPDATE.
- [ ] T3. In the boot sequence, call `stampSchemaVersion` ONLY after `await db.exec(schemaCommonSql); await db.exec(schemaUserSql);` AND only if the version was mismatched (the migration path) OR the row did not exist (fresh DB path).
- [ ] T4. NEW unit `pglite-client.spec.ts`: simulate a fresh DB, assert stamp = bundled; simulate a stamped-but-mismatched DB, assert mismatch is detected BEFORE stamp is overwritten.

## 411.b — `_extra JSONB` sidecar
- [ ] T5. Edit `scripts/gen-pglite-schema.mjs` so the trio emitter:
  - Adds `_extra JSONB NOT NULL DEFAULT '{}'::jsonb` to every `<entity>_synced` and `<entity>_local`.
  - Includes `l._extra` in the view SELECT list.
  - Includes `_extra` in the INSERT column lists of `<entity>_insert()` and `<entity>_update()` trigger bodies.
  - Includes `_extra = EXCLUDED._extra` in the ON CONFLICT UPDATE SET clause.
- [ ] T6. Regenerate `src/shared/db/local-schema-user.sql` via `pnpm gen:pglite-schema`.
- [ ] T7. Mirror the edit in `src/shared/db/local-schema-common.sql` for `metadata_type` and `entity_metadata`.

## 411.c — `synced-entity-writer.ts`
- [ ] T8. NEW `src/shared/db/synced-entity-writer.ts` exporting `syncShapeToTableSafe({ db, table, primaryKey, knownColumns })`. Wraps `db.electric.syncShapeToTable`; pre-processes each incoming row, partitions unknown keys into `_extra`, writes via a transactional `INSERT ... ON CONFLICT DO UPDATE`.
- [ ] T9. NEW unit `synced-entity-writer.spec.ts` — mock PGlite; deliver a row with an unknown column; assert it lands in `_extra`; deliver a row with a known column; assert it lands in the typed column.
- [ ] T10. Replace `db.electric.syncShapeToTable` calls in `src/shared/db/electric-sync.ts` with `syncShapeToTableSafe`. `knownColumns` derived from `SYNC_CONFIG` entity column list (the generator already has the data; expose it as an export).

## 411.d — Transactional migration
- [ ] T11. In `pglite-client.ts:127-145`, wrap the drop + re-apply + stamp + sync-meta reset in a single `await db.transaction(async (tx) => { ... })`. If any step throws, the transaction rolls back; the next boot retries the migration.
- [ ] T12. NEW Cypress test `tests/e2e/specs/schema-migration-chaos.spec.ts`: forces a version mismatch, intercepts the PGlite worker, terminates it after `dropTierATables` but before re-apply, reloads, asserts the app boots and `client_synced` either has the old or the new schema (never half).
- [ ] T13. Bump `BUNDLED_PGLITE_SCHEMA_VERSION` in `pglite-client.ts:48` to `'20260526000001'`. Update the stamp value in `local-schema-common.sql` source comment.

## 411.e — Verification
- [ ] T14. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] T15. Manual: add a nullable column to `public.client` in latest-data via the docker stack, refresh Electric publication, open the app — confirm the value lands in `client_synced._extra` and the app does not crash. Document the procedure in `docs/RUNBOOKS.md` under "Verify additive column safety".

## Definition of done
- The version-stamp bug is unit-tested.
- Every `*_synced` / `*_local` table has `_extra JSONB NOT NULL DEFAULT '{}'`.
- The chaos Cypress test passes.
- Additive server column → app keeps working; value visible in `_extra`.
