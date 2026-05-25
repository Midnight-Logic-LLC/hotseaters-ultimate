# change-412 — Per-table fingerprint migrator

## Why
After change-411 the app survives additive server changes via `_extra`,
but it still wipes ALL Tier-A tables when the monolithic version stamp
changes. The assessment §4.2–§4.3 requires per-table version vectors
so additive diffs apply via `ALTER TABLE` in place and destructive
diffs affect at most one table.

## What changes
1. NEW table `_pglite_table_versions(table_name PK, fingerprint, bundled_version, applied_at, state)` in `local-schema-common.sql`. Replaces (alongside) `_pglite_schema_version`.
2. NEW module `src/shared/db/schema-fingerprint.ts` — pure function `fingerprint(columns: ColumnSpec[]) → string` (SHA-256 of canonical column form: sorted, normalized type, nullability, default-fingerprint).
3. NEW module `src/shared/db/schema-migrator.ts` — `runMigrationPlan({ db, registry })`. For each registered entity:
   - Read live columns from PGlite `information_schema.columns`.
   - Compute `liveFingerprint`.
   - Compare to `registry.fingerprint(entityName)`.
   - Classify: `identical | additive | widening | destructive | new | dropped`.
   - Apply minimum DDL per the assessment §4.3 matrix.
   - Set `_pglite_table_versions.state = 'migrating'` BEFORE DDL; set `'ok'` AFTER. On crash, next boot detects `'migrating'` and retries.
4. NEW module `src/shared/db/schema-registry.ts` — a thin local registry built from `SYNC_CONFIG` (no upstream change yet — that's change-415). Exposes `entries(): { table, columns, fingerprint, bundledVersion, ddl }[]`.
5. Refactor `src/shared/db/pglite-client.ts`:
   - Replace the monolithic `dropTierATables` + re-apply with `runMigrationPlan`.
   - Keep `BUNDLED_PGLITE_SCHEMA_VERSION` as a backstop "if you must blow the whole DB away" emergency lever.
6. Migrate the `_pglite_table_versions` table from empty on first run by treating "no fingerprint" as "trust the live schema; apply additive plan from there."

## Out of scope
- Moving the registry upstream (change-415).
- Custom mergers / HLC (change-417).
- Replacing the generator (change-415).

## Acceptance
- Adding a nullable column to `client_synced` triggers ONE
  `ALTER TABLE client_synced ADD COLUMN …;` — NOT a drop of the
  other 11 Tier-A tables.
- Dropping a column from `trial_synced` triggers ONE
  `ALTER TABLE trial_synced DROP COLUMN …;` — other tables untouched.
- Renaming a column in `client_synced` triggers ONE drop+recreate of
  `client_synced` + reset of its shape key — other tables untouched.
- Crash-recovery test: kill worker during a single-table migration,
  reload, assert `_pglite_table_versions.state` for that table = `'ok'`
  after retry; data NOT lost in unrelated tables.
- DevTools network panel shows ZERO additional Electric shape
  re-hydrations for unchanged tables.

## Tasks → see `tasks.md`.
