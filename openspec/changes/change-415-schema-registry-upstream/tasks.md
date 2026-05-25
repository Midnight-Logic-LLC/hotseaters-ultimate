# Tasks — change-415

## 415.a — Upstream package implementation
- [ ] T1. In `/Users/gqadonis/Projects/prometheus/prometheus-entity-management/`, NEW module `src/schema/define-synced-entity.ts`. Type definition + validator (zod). `merge` default = `(a, b) => a.updated_at > b.updated_at ? a : b`.
- [ ] T2. NEW `src/schema/schema-registry.ts`. Module-level registry instance + `createSchemaRegistry()` factory for tests. `register` enforces unique names; `install(plugin)` registers all plugin entities.
- [ ] T3. NEW `src/schema/schema-migrator.ts`. Port logic from `hotseaters-ultimate/src/shared/db/schema-migrator.ts` (change-412) into the package. Add bulk DDL synthesis (trio template lives here now, not in a script).
- [ ] T4. NEW `src/schema/synced-entity-writer.ts`. Port from `hotseaters-ultimate/src/shared/db/synced-entity-writer.ts` (change-411).
- [ ] T5. NEW `src/schema/plugin.ts` exporting `definePlugin`.
- [ ] T6. NEW `src/react/use-graph-schema-state.ts` — subscribes to `_pglite_table_versions` via PGlite live extension; returns `Record<table, { state, fingerprint, appliedAt }>`.
- [ ] T7. NEW upstream unit tests for each module. ≥ 80% coverage.
- [ ] T8. NEW `docs/SCHEMA-LIFECYCLE.md` in the package — overview, the §4.3 matrix, `definePlugin` recipe.

## 415.b — Upstream release
- [ ] T9. Bump version in `package.json` (minor). Update `CHANGELOG.md`. Run `pnpm build`. Run `verify.sh`.
- [ ] T10. Tag + publish. (User publishes; agent prepares the PR.)

## 415.c — This repo: adopt new APIs
- [ ] T11. Bump `@prometheus-ags/prometheus-entity-management` to new version. `pnpm install`.
- [ ] T12. Delete `src/shared/db/schema-registry.ts` (from change-412). Re-export from package.
- [ ] T13. Delete `src/shared/db/schema-migrator.ts`. Re-export.
- [ ] T14. Delete `src/shared/db/synced-entity-writer.ts`. Re-export.
- [ ] T15. Migrate `src/shared/db/sync-config.ts` → N `src/features/<feature>/entities.ts` files calling `defineSyncedEntity`. Keep a thin `sync-config.ts` that imports each `entities.ts` for side-effect registration. The 12 existing entities split: clients → `features/clients`, trial → `features/trials`, invoice → `features/invoices`, etc.
- [ ] T16. Delete `scripts/gen-pglite-schema.mjs`. Remove the `gen:pglite-schema` script from `package.json`. Update `CLAUDE.md` "How to add a new feature" recipe (delete step 3 "Run `pnpm gen:pglite-schema`").
- [ ] T17. Replace `src/shared/db/local-schema-user.sql` import in `pglite-client.ts` with a runtime synthesis: `await db.exec(schemaCommonSql); await runMigrationPlan({ db, registry });`. Delete `local-schema-user.sql`.
- [ ] T18. Update `docs/architecture/sync-policy.md` + `docs/architecture/pglite-schema-strategy.md` to reflect the new authority boundary.

## 415.d — Verification
- [ ] T19. NEW test `tests/feature-self-registration.spec.ts`: temporarily add a `features/__test__/entities.ts` with one entity; boot the app in test; assert the entity's trio appears in PGlite.
- [ ] T20. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] T21. CI: cross-repo verification — the package's CI runs against this repo's test suite (matrix job).

## Definition of done
- Upstream PR merged + version tagged + this repo on new version.
- `sync-config.ts` is a thin barrel; entities live per-feature.
- `gen-pglite-schema.mjs` is deleted.
- New feature folder works without touching `shared/db/`.
- All tests green in both repos.
