# Tasks — change-417

## 417.a — Upstream
- [ ] T1. Extend `define-synced-entity.ts`: `merge?: (a, b) => Row`; default LWW by `updated_at`.
- [ ] T2. Extend the DDL emitter: every `<entity>_synced` and `<entity>_local` includes `_hlc TEXT NULL, _origin TEXT NULL`. View SELECT + triggers updated to pass through.
- [ ] T3. NEW `src/schema/plugin-install.ts` — `install(plugin)` calls `registry.register` per entity AND inserts a row into `_pglite_plugin_registry`. `uninstall(plugin)` drops tables + removes row.
- [ ] T4. NEW `src/schema/plugin-linter.ts` — accepts a SQL string, parses with `pg-query-parser` (or hand-rolled tokenizer if dep weight too high), rejects disallowed statements. Unit-tested with a corpus of allowed + disallowed inputs.
- [ ] T5. NEW `src/sync/p2p-contract.ts` — pure-type module describing `MergerArgs`, `HLCStamp`, `PeerHandshake`. No runtime.
- [ ] T6. Add `_pglite_plugin_registry` table to the registry's bootstrap DDL.
- [ ] T7. Bump package version + release.

## 417.b — This repo
- [ ] T8. Bump dep version. `pnpm install`.
- [ ] T9. Reboot the app; the migrator (change-412/-415) applies additive ALTER for `_hlc` + `_origin` to every Tier-A trio.
- [ ] T10. NEW `src/shared/lib/hlc.ts` — `nextHlc(now = Date.now(), counter)` returns `<timestamp_ms>.<counter:04d>.<deviceId>`. Device ID from `localStorage.deviceId` (UUID generated once per browser).
- [ ] T11. Update doc: append a "Plugin model" + "P2P substrate" appendix to `docs/architecture/pglite-schema-strategy.md`.

## 417.c — Tests
- [ ] T12. NEW upstream test `plugin-install.spec.ts` — install + uninstall fixture plugin; assert registry state.
- [ ] T13. NEW upstream test `plugin-linter.spec.ts` — disallowed-SQL corpus.
- [ ] T14. NEW Cypress `tests/e2e/specs/hlc-origin-columns.spec.ts` — assert `_hlc` and `_origin` exist on all Tier-A `*_synced` after migration.
- [ ] T15. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.

## Definition of done
- Upstream PR merged + released.
- `_hlc` + `_origin` columns present everywhere.
- Plugin install + uninstall + linter all proven by tests.
- Schema-strategy doc updated.
