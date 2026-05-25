# change-415 — Schema registry upstream PR

## Why
After change-412 the per-table fingerprint logic lives in this repo's
`src/shared/db/`. Per the assessment §4.5, this orchestration belongs
upstream in `@prometheus-ags/prometheus-entity-management` so plugin
authors (and other consumers like `example-app`) get it for free.

Repo path: `/Users/gqadonis/Projects/prometheus/prometheus-entity-management/`.

## What changes (upstream)
1. NEW module `src/schema/schema-registry.ts`:
   - `createSchemaRegistry()` returning `{ register, entries, install }`.
   - `register(def: SyncedEntityDef)` — typed entity definition.
   - `install(plugin: Plugin)` — registers a bundle of entities.
2. NEW `src/schema/define-synced-entity.ts`:
   ```ts
   export function defineSyncedEntity(args: {
     name: string;
     tier: 'A' | 'B';
     createTableSql: string;       // canonical CREATE TABLE
     shapeWhere: (claim: TenantClaim) => string;
     rls: { matches: string };     // RLS USING expression
     migrations?: MigrationStep[];
     merge?: (a: Row, b: Row) => Row;  // default LWW by updated_at
   }): SyncedEntityDef;
   ```
3. NEW `src/schema/schema-migrator.ts` — `createSchemaMigrator({ pglite, registry })` exposing `runPlan()`. Implements the §4.3 matrix (same as change-412 but library-owned).
4. NEW `src/schema/synced-entity-writer.ts` — promoted from
   `hotseaters-ultimate`'s in-repo version (change-411).
5. NEW `src/schema/plugin.ts`:
   ```ts
   export function definePlugin(args: {
     id: string;
     version: string;
     entities: SyncedEntityDef[];
     lookups?: LookupEntityDef[];  // change-416
   }): Plugin;
   ```
6. NEW React hook `src/react/use-graph-schema-state.ts` — surfaces per-table `state` for UI banners (change-414's chip + future per-row badges).
7. Docs: `docs/SCHEMA-LIFECYCLE.md` in the package.

## What changes (this repo)
1. Bump `@prometheus-ags/prometheus-entity-management` to the new version once published.
2. Replace `src/shared/db/schema-registry.ts` (from change-412) with import from package.
3. Replace `src/shared/db/schema-migrator.ts` with import.
4. Replace `src/shared/db/synced-entity-writer.ts` with import.
5. Migrate `src/shared/db/sync-config.ts` from static array → N `defineSyncedEntity` calls in each `src/features/<x>/entities.ts`.
6. Delete `scripts/gen-pglite-schema.mjs`; DDL synthesized at boot by the migrator.
7. Update `docs/architecture/sync-policy.md` to point to the package's `SCHEMA-LIFECYCLE.md`.

## Out of scope
- Lookup tier (change-416 depends on this but lives in its own change).
- HLC / plugin install / merger contract (change-417 depends on this but lives in its own change).
- Removing PGlite worker setup (stays consumer-side).

## Acceptance
- Upstream PR merged + tagged release.
- This repo's `pnpm install` picks up the new version.
- Adding a new feature folder with `entities.ts` (and no edits to
  `shared/db/`) successfully self-registers entities; app boots; the
  new entity's trio is created in PGlite; Electric shape attached.
- `scripts/gen-pglite-schema.mjs` is deleted.
- `pnpm typecheck && pnpm test && pnpm test:e2e` green in BOTH repos.

## Tasks → see `tasks.md`.
