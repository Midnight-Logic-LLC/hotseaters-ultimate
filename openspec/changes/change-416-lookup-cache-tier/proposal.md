# change-416 — Lookup-cache tier

## Why
`metadata_type`, `entity_metadata`, and future `country` / `state` /
`currency` / system `pipeline_stage` are read-mostly reference data
with low write rate and stable IDs. Today they sync through Electric
identically to hot operational data. The cost is ~N extra long-polls
per login for data that changes monthly. The assessment §4.6 specifies
a Tier-L cache with ETag refresh.

## What changes
1. NEW Supabase RPCs (in `latest-data/supabase/migrations/`):
   - `lookup_<name>_etag()` returns `text` (= `xxhash(jsonb_agg(row ORDER BY id))`).
   - `lookup_<name>_data()` returns `setof jsonb`.
   Per lookup: `metadata_type`, `entity_metadata` (system rows only —
   `company_id IS NULL`).
2. NEW upstream API (additive to change-415):
   ```ts
   defineLookupEntity({
     name: 'metadata_type',
     etagRpc: 'lookup_metadata_type_etag',
     dataRpc: 'lookup_metadata_type_data',
     maxAgeMinutes: 60,
     primaryKey: 'id',
   })
   ```
3. NEW upstream module `src/schema/lookup-cache.ts` —
   `createLookupCache({ pglite, supabase })`. Boot:
   - Ensure dedicated `<name>_lookup` table exists in PGlite.
   - Read `_lookup_meta(name, etag, last_checked, last_loaded)`.
   - If `now - last_checked > maxAgeMinutes`: HEAD `etagRpc`; if
     unchanged, bump `last_checked`; if changed, fetch `dataRpc`,
     bulk-upsert + bulk-delete-stale, bump `last_loaded`.
   - Else serve cached.
4. NEW shared PGlite instance: `idb://hotseaters-public` — opened on
   FIRST boot of the app (before any user signs in). Holds only Tier-L
   tables. Per-user PGlite stores never duplicate lookup data.
5. Bridge: when the entity graph asks for `metadata_type`, the bridge
   serves from `hotseaters-public` PGlite, not the per-user one. Stores
   that need lookup data import a `useLookup('metadata_type')` hook
   from the package.
6. Migrate `metadata_type` + `entity_metadata` out of `SYNC_CONFIG`
   (no longer Electric-synced).

## Out of scope
- Lookups with tenant-scoped rows (those stay Tier-A — e.g.
  tenant-customizable `pipeline_stage`).
- Server-side caching of the RPCs (Postgres function caching is
  separate operational concern).

## Acceptance
- Cold boot on a known-user browser: lookup ETags HEAD'd; if all
  unchanged, ZERO bulk data fetch + ZERO Electric shape subscription
  for lookup entities.
- Lookup data is readable BEFORE the user is authenticated (system rows
  visible on the login page if needed — verifies pre-auth path).
- Edit `metadata_type` in Studio → next user load detects new ETag →
  bulk-replaces cached lookup table.
- Bundle size: ≤ 2KB additional gzipped (lookup-cache module).

## Tasks → see `tasks.md`.
