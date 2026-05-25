# Tasks — change-412

## 412.a — Ledger + fingerprint
- [ ] T1. Add `_pglite_table_versions` to `local-schema-common.sql` per assessment §4.2 schema.
- [ ] T2. NEW `src/shared/db/schema-fingerprint.ts`:
  ```ts
  type ColumnSpec = { name: string; type: string; nullable: boolean; defaultExpr: string | null };
  export function fingerprint(columns: ColumnSpec[]): string;
  export function canonicalForm(columns: ColumnSpec[]): string;  // for diffing
  ```
  Use `@noble/hashes/sha256` (already in deps via Supabase). Sort columns alphabetically. Normalize types: `text` and `varchar` differ, but `integer` vs `int4` collapse. Hash hex-lowercase.
- [ ] T3. NEW unit `schema-fingerprint.spec.ts` — identical columns in different orders → same hash; nullable flip → different hash; type change → different hash.

## 412.b — Registry
- [ ] T4. NEW `src/shared/db/schema-registry.ts`. Builds entries from `SYNC_CONFIG`:
  ```ts
  type RegistryEntry = {
    table: string;
    columns: ColumnSpec[];
    fingerprint: string;
    bundledVersion: string;        // bump per-entity, not global
    ddl: { createSynced: string; createLocal: string; view: string; triggers: string };
  };
  export function registryEntries(): RegistryEntry[];
  ```
  Extracts column specs from the generated SQL via a small AST walker (no regex — use `pg-protocol` or a minimal hand-rolled lexer; the generator already has structured column data, expose it).
- [ ] T5. NEW unit `schema-registry.spec.ts` — every entity in `SYNC_CONFIG` produces a non-empty `columns` array; every fingerprint is stable across runs.

## 412.c — Migrator
- [ ] T6. NEW `src/shared/db/schema-migrator.ts`:
  ```ts
  type DiffKind = 'identical' | 'additive' | 'widening' | 'destructive' | 'new' | 'dropped';
  export async function runMigrationPlan(opts: { db: LocalDB; registry: RegistryEntry[] }): Promise<MigrationReport>;
  ```
  For each entity:
  1. Query `information_schema.columns WHERE table_name = $1` → live columns.
  2. Compute live fingerprint.
  3. If identical → mark `_pglite_table_versions.state = 'ok'`; skip.
  4. Classify diff. Apply DDL per matrix:
     - `additive` → `ALTER TABLE <t>_synced ADD COLUMN …;` + mirror on `_local` + re-emit view + triggers.
     - `widening` → `ALTER TABLE ... TYPE ...;`.
     - `destructive` → drop + recreate that one table; reset its Electric shape key (see T8).
     - `new` → full trio create.
     - `dropped` → full trio drop + remove ledger row.
  5. Wrap in `db.transaction()`. On error, log + leave `state='failed'` so UI banner (change-414) can show it.
- [ ] T7. NEW `src/shared/db/electric-shape-key.ts` — shape keys are derived from `(tenant_id, entity, fingerprint)`. Changing the fingerprint resets the key → Electric re-hydrates ONE table.
- [ ] T8. NEW unit `schema-migrator.spec.ts` — table-driven test covering every cell in the §4.3 matrix.

## 412.d — Wire it in
- [ ] T9. Refactor `src/shared/db/pglite-client.ts`:
  - On boot: `await runMigrationPlan({ db, registry: registryEntries() });`.
  - Remove `dropTierATables` (keep as `dangerousResetAllTierA` exported helper for the emergency-lever; never called by default).
  - `BUNDLED_PGLITE_SCHEMA_VERSION` becomes a fallback comparison only used when `_pglite_table_versions` is empty AND `_pglite_schema_version` differs.
- [ ] T10. Update `src/shared/db/electric-sync.ts` to read shape keys from `electric-shape-key.ts`.

## 412.e — Tests + verification
- [ ] T11. NEW Cypress `tests/e2e/specs/per-table-migration.spec.ts`:
  - Seed local DB with N rows in `client_synced` and N rows in `trial_synced`.
  - Force a rename of `client.email_address`. Reload.
  - Assert `client_synced` rehydrated but `trial_synced` row count unchanged.
- [ ] T12. NEW Cypress `tests/e2e/specs/migration-crash-recovery.spec.ts`:
  - Kill worker mid-additive-migration on `trial_synced`.
  - Reload.
  - Assert `_pglite_table_versions WHERE table_name='trial_synced'` has `state='ok'` after retry.
  - Assert other tables untouched.
- [ ] T13. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.

## Definition of done
- Additive / widening / destructive migrations apply per-table with the §4.3 matrix.
- Failed migrations leave `state='failed'`; next boot retries.
- DevTools confirms no re-hydration of unchanged tables.
- All listed Cypress tests pass.
