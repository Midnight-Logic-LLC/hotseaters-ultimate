# change-403 — per-user PGlite + Electric/Realtime sync policy

## Why
The current `pglite-client.ts` is a single global instance, so switching
users in one browser shares all local data. PGlite stores in IndexedDB
scoped to the **origin**, not to `auth.user.id` — leakage is structural,
not a bug to patch. The `local-schema.sql` conflates system reference
data with tenanted rows. ElectricSQL vs Supabase Realtime is undeclared
per-domain. prometheus-entity-management v1.3 ships
`createTenantScopedElectricAdapter` and
`createPGlitePersistenceAdapter` that solve most of this if we adopt them.

## What changes
1. `src/shared/db/pglite-client.ts` — refactor to per-user instance keyed
   by `auth.user.id`. `openForUser(id)` + `closeForUser(id)`.
2. Split `local-schema.sql` → `local-schema-common.sql` (reference) +
   `local-schema-user.sql` (tenanted).
3. NEW `src/shared/db/realtime-channels.ts` — channels for
   current-user `user_info`, current-company `company`, and
   `notifications`. Writes propagate into the entity graph.
4. `src/shared/db/electric-sync.ts` — attach all tenanted shapes via
   `createTenantScopedElectricAdapter({ tenantColumn: 'company_id',
   claim: () => ({ companyId }) })`. Register reference shapes via a
   separate non-tenanted adapter helper.
5. `src/features/auth/stores/auth-store.ts` — wire PGlite
   open/close + entity-graph reset on sign-in / sign-out.
6. NEW `docs/architecture/sync-policy.md` — codifies the per-domain
   transport table.

## Out of scope
- TanStack Table integration via `useEntityListAsTable`.
- Conflict-resolution policy beyond last-write-wins by `updated_at`
  (v1 only).
- Server-side RLS audit (separate phase under latest-data).

## Tasks → see `tasks.md`.
