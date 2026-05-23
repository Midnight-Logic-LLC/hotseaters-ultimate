# `src/features/clients` — clients vertical slice

Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

## Responsibility

Full CRUD for the `client` aggregate:

- `client` (Tier-A, writeable offline)
- `client_address` (Tier-A, writeable offline)
- `client_service_override` (server-only — not synced. Fetched via Supabase
  REST inside the override store when needed; v0.1 ships the panel disabled
  with a "coming soon" placeholder behind the `experimental.clientOverrides`
  flag because the override row is read/written through the legacy `Service`
  table which is not part of this change.)

The functional bible is
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Clients.jsx` plus
`/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/components/clients/*`.
Field labels, ordering, and behavior MUST match MVP. The new architecture is
the implementation detail — the user experience is not.

## Boundaries

- `entities.ts` registers `Client`, `ClientAddress`, `ClientServiceOverride`
  JSON Schemas with the entity-graph. **No I/O.**
- `business-rules/*` are pure (`clean-phone-number`, `clean-client-website`,
  `client-tier-multiplier`, `trial-service-delete-guard`). Unit-tested.
- `stores/*` are the only PGlite/Supabase callers in this feature.
- `hooks/*` orchestrate stores and feed `useEntityList` / `useEntity` /
  `useEntityCRUD` from `@prometheus-ags/prometheus-entity-management`.
- `components/*` and `pages/*` consume hooks only.

## Sync tier reminder

`client` and `client_address` are Tier-A in
`src/shared/db/sync-config.ts`. Writes route through the PGlite view
INSTEAD-OF triggers → `local_writes` → write-sync drain → Supabase REST.
`client_service_override` is **not** in `sync-config.ts` and is not present
in `local-schema.sql`; the override store talks to Supabase REST directly.

## See also

- `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
- `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/CLAUDE.md`
- `/Users/gqadonis/Projects/courtroom/HotSeatersMVP` — the bible
