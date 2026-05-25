# Assessment — pglite-schema-strategy-offline-first

> This phase implements the architectural assessment captured in
> [docs/architecture/pglite-schema-strategy.md](../../../docs/architecture/pglite-schema-strategy.md)
> with **offline-first** as a binding additional constraint and full
> coverage of the bible's business-rule surface.

The full design rationale, industry research, problem taxonomy, rejected
alternatives, and references all live in that document. This file is a
short orientation; the plan in `plan.md` is the executable contract.

## Why this phase exists

Today's PGlite schema lifecycle is a single-version, drop-and-rehydrate
model. Any change forces a full local-DB wipe + Electric re-hydration in
every browser. The model does not survive:

- additive server columns (Electric delivers them → PGlite errors)
- partial migration failures (no transactional boundary, bricks the app)
- third-party plugin schemas (no extension point)
- the upcoming WebRTC device sync (no per-row HLC / merger contract)
- offline use (the local DB accepts writes, but the user has no idea
  what is pending, what failed, or how it'll reconcile)

## What this phase adds beyond the doc

The architectural assessment focused on schema lifecycle. This phase
additionally requires:

1. **Offline-first as a first-class capability** — the user can do
   meaningful work disconnected; writes accumulate in `local_writes`;
   on reconnect they drain with conflict handling.
2. **User-visible pending-sync surface** — every locally-stored write
   that has not reached Supabase is visible (global header chip + per-row
   badge + drainable "Pending changes" panel).
3. **Bible business-rule coverage** — every business rule from
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP` is inventoried,
   classified, and homed in the right layer so offline behavior is
   correct per rule (not per page).

## Decisions locked in (user-confirmed 2026-05-25)

| Decision | Choice |
|---|---|
| Side-effect offline policy | **Queue + replay.** `local_writes.operation='side_effect'` with dedupe key; replays on reconnect via Edge Function / RPC. |
| Conflict resolution default | **LWW by `updated_at`** with user-visible "conflict — your change discarded" surface + one-click diff to re-apply. |
| Pending-sync UX | **Global header chip** ("N pending • Online/Offline") opening a "Pending changes" panel. |
| Bible rule inventory scope | **All bible pages now**, producing `docs/BIBLE-BUSINESS-RULES.md`. |

Future evolutions (per-entity mergers, per-row badges, per-field
tooltips) are out of scope for this phase but are explicit
non-blockers — the architecture must not preclude them.

## Definition of done

- Per-table fingerprint ledger replaces `BUNDLED_PGLITE_SCHEMA_VERSION`.
- Additive server schema changes apply via `ALTER TABLE` with zero data
  loss; destructive changes affect at most one table.
- `_extra JSONB` sidecar on every `*_synced` / `*_local` absorbs unknown
  columns; reads keep working through divergence windows.
- `_hlc` + `_origin` columns ride on every Tier-A row (NULL-tolerant
  for Supabase; populated by future WebRTC sync).
- Offline writes (insert / update / delete / side-effect) accumulate in
  `local_writes`; reconnect drains them with LWW conflict surface.
- Global header shows `N pending • Online/Offline` chip; click reveals
  per-entity / per-row pending list with retry, discard, view-diff.
- `prometheus-entity-management` exposes `defineSyncedEntity`,
  `SchemaRegistry`, `SchemaMigrator`, `LookupCache`, plugin model.
- Lookup tier (`metadata_type`, `country`, `state`, system
  `pipeline_stage`) refreshes on ETag, NOT Electric long-poll.
- `docs/BIBLE-BUSINESS-RULES.md` enumerates every rule from
  `HotSeatersMVP`, classified by (pure / side-effect / server-required /
  formatting / validation / conditional-render) with offline policy.
- All affected rules ported into `src/features/<x>/business-rules/`
  (pure) or store side-effects (queued).
- `pnpm typecheck && pnpm test && pnpm test:e2e` green.
- Cypress chaos test: kill the worker mid-migration, reload — app
  recovers, no data loss.
- Cypress offline test: airplane-mode, write 20 entities, exit, re-enter
  online — all 20 sync; conflicts surface in UI.

## Out of scope

- Actually shipping the WebRTC p2p sync (we add the schema substrate
  only — `_hlc`, `_origin`, merger contract).
- Per-entity custom mergers (default LWW only).
- Per-row badge UI / per-field tooltips (global chip + panel only).
- TanStack Table integration (separate phase).
- Server-side RLS audit (separate latest-data phase).
- E-sign / Stripe / email Edge-Function implementations themselves
  (we only define the queue + replay contract; Edge Functions live in
  latest-data).

## Reference

- Full architectural assessment:
  [`docs/architecture/pglite-schema-strategy.md`](../../../docs/architecture/pglite-schema-strategy.md)
- Sync-policy doc (current state):
  [`docs/architecture/sync-policy.md`](../../../docs/architecture/sync-policy.md)
- Previous phase that established per-user PGlite:
  [`openspec/changes/change-403-per-user-pglite-sync-policy/proposal.md`](../../../openspec/changes/change-403-per-user-pglite-sync-policy/proposal.md)
- Project rules:
  [`CLAUDE.md`](../../../CLAUDE.md) — esp. RULE 1, 3, 5, E, J
- Bible:
  `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/`
