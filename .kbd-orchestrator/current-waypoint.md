# Current waypoint — hotseaters-ultimate

**Phase:** `dashboard-and-data-architecture-parity`
**Status:** plan complete, ready to execute
**Change backend:** OpenSpec (`openspec/` at repo root)

## What just finished
- Assessment: `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/assessment.md`
- Plan: `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/plan.md`
- OpenSpec proposals + tasks scaffolded for 4 changes under
  `openspec/changes/change-401..404`.

## Next step
Run `/kbd-execute dashboard-and-data-architecture-parity` to dispatch.

## Queued next phase (GATED)
`pglite-schema-strategy-offline-first` is planned, scaffolded, and
**explicitly gated** behind this phase. 9 OpenSpec changes (410–418),
5 waves. Gate condition lives in
`.kbd-orchestrator/phases/pglite-schema-strategy-offline-first/execution.md`.
`progress.json` for that phase marks every change as `GATED` to make
the hold visible to any tool that reads it.

**Why gated:** changes 411 / 412 / 413 / 415 / 416 / 417 modify the
same files that change-402 / 403 / 404 are still editing
(pglite-client.ts, sync-config.ts, local-schema-*.sql, electric-sync.ts).
Dispatching now would overwrite in-flight work — including the
account_status / preferences / drop+recreate fixes from the most recent
session.

**Promotion path (when this phase reflects complete):**
1. `/kbd-reflect dashboard-and-data-architecture-parity`, archive changes.
2. Copy
   `.kbd-orchestrator/phases/pglite-schema-strategy-offline-first/waypoint.json`
   over `.kbd-orchestrator/current-waypoint.json`.
3. Re-run `/kbd-execute pglite-schema-strategy-offline-first` — it will
   detect the gate is open and emit a live dispatch contract.

Design doc:
[docs/architecture/pglite-schema-strategy.md](../docs/architecture/pglite-schema-strategy.md).

Dependency-respecting execution order (parallelism shown by row):

| Wave | Changes |
|------|---------|
| 1 | change-401-routing-redirect-last-route |
| 2 | change-402-app-shell-dashboard-parity, change-403-per-user-pglite-sync-policy |
| 3 | change-404-lookup-entities-wiring |

## Plan in 30 seconds
1. **change-401** — `/dashboard` alias + auth-aware landing redirect +
   `lastViewedPage` tracker. Unblocks everything else.
2. **change-402** — port every bible widget; SidebarUserFooter, Toaster,
   TrialBanner; unify logos.
3. **change-403** — per-user PGlite keyed on `auth.user.id`; split
   schema (common + user); adopt prometheus-entity-management v1.3's
   `createTenantScopedElectricAdapter` + `createPGlitePersistenceAdapter`;
   document Electric-vs-Realtime per domain.
4. **change-404** — register PipelineStage / Service / ServiceCategory /
   MetadataType / SettingsType as entities (via `registerEntityFromSql`);
   wire dashboard Sales Pipeline to real stages.

## Research anchors (used by the plan)
- ElectricSQL × Supabase: <https://supabase.com/partners/electricsql>,
  <https://electric-sql.com/docs/integrations/supabase>
- Supabase multi-tenancy: <https://medium.com/@itsuki.enjoy/supabase-support-multi-tenancy-with-detail-template-project-34f3a3d97ee4>
- database.build / postgres.new (per-workspace PGlite idiom):
  <https://github.com/supabase-community/database-build>
- prometheus-entity-management v1.3 README (local submodule under
  `latest-data/packages/prometheus-entity-management/`) — the
  `createPGlitePersistenceAdapter`,
  `createTenantScopedElectricAdapter`, and `registerEntityFromSql`
  APIs the plan depends on.
