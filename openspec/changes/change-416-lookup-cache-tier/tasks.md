# Tasks — change-416

## 416.a — Server RPCs
- [ ] T1. NEW supabase migration `latest-data/supabase/migrations/<ts>_lookup_rpcs.sql`:
  - `lookup_metadata_type_etag()`, `lookup_metadata_type_data()` (system rows only: `WHERE company_id IS NULL`).
  - Same pair for `entity_metadata`.
  - `GRANT EXECUTE … TO anon, authenticated` (system rows are public — verify with the team).
- [ ] T2. NEW xxhash extension or implementation. Postgres has `digest()` via pgcrypto; use `encode(digest(jsonb_agg(row ORDER BY id)::text, 'sha256'), 'hex')` as the ETag — slightly larger than xxhash but no extension needed.

## 416.b — Upstream (depends on change-415)
- [ ] T3. NEW `src/schema/define-lookup-entity.ts` in `prometheus-entity-management`.
- [ ] T4. NEW `src/schema/lookup-cache.ts`. `createLookupCache({ pglite, supabase })` returning `{ refreshAll(), get(name) → row[] }`.
- [ ] T5. NEW `src/react/use-lookup.ts` — `useLookup(name)` returns `{ data, loading, lastChecked, lastLoaded }`. Live-updates via PGlite live extension.
- [ ] T6. Unit tests + doc update in `docs/SCHEMA-LIFECYCLE.md`.

## 416.c — This repo: adopt
- [ ] T7. Bump package version. `pnpm install`.
- [ ] T8. NEW `src/shared/db/public-pglite-client.ts` — opens `idb://hotseaters-public` PGlite. Module-level singleton (NOT per-user). Initialized on app boot (before auth).
- [ ] T9. NEW `src/shared/db/lookup-bootstrap.ts` — wires `createLookupCache` to the public PGlite + Supabase REST client. Called from `src/app/app-root.tsx` or equivalent boot point.
- [ ] T10. NEW `src/features/lookups/entities.ts` calling `defineLookupEntity` for `metadata_type` + `entity_metadata`.
- [ ] T11. Remove `metadata_type` + `entity_metadata` from `SYNC_CONFIG`.
- [ ] T12. Remove their Electric shape subscriptions from `electric-sync.ts`.
- [ ] T13. Remove their trio DDL from `local-schema-common.sql` (now in the public PGlite lookup table).
- [ ] T14. Update consumers (any store/hook that read `metadata_type` from the per-user PGlite) to use `useLookup('metadata_type')`.

## 416.d — Cypress
- [ ] T15. NEW `tests/e2e/specs/lookup-cache.spec.ts`:
  - Cold boot. Inspect network: assert 1 HEAD per lookup (ETag check), 0 GET unless first install.
  - Mutate `metadata_type` via psql; reload; assert GET fires + UI shows new data.
  - Pre-auth read: open login page, assert lookup data is queryable via `useLookup`.
- [ ] T16. Bundle-size check: `pnpm size` budget unchanged or +2KB max.

## Definition of done
- Lookups no longer flow through Electric.
- Public PGlite store exists and is shared across users in the same browser.
- ETag refresh works (Cypress proves it).
- Bundle stays within budget.
- All tests green.
