# Execution — pglite-schema-strategy-offline-first

> **Status: GATED — not dispatched.** Held behind active phase
> `dashboard-and-data-architecture-parity` per user decision 2026-05-25.

## Backend

`openspec` — every change in this phase already has
`openspec/changes/change-41<n>-…/proposal.md` + `tasks.md`. Dispatch
will run each change through the standard `/opsx:plan → /opsx:execute
→ /opsx:verify → /opsx:archive` loop, gated by `/refine-validate` per
the kbd-execute QA gate.

## Gate condition (must all be true before dispatch)

1. `dashboard-and-data-architecture-parity/progress.json` shows
   `execution_complete: true` AND `reflection_complete: true`.
2. `change-402`, `change-403`, `change-404` all `DONE`.
3. The `account_status`/`preferences`/PGlite drop+recreate fixes made
   during this session (currently mid-flight inside change-403) are
   committed on `main`.
4. `pnpm typecheck && pnpm test && pnpm test:e2e` are green on `main`
   for the dashboard phase's exit criteria.

## Why gated (not dispatched)

The new phase's changes 411–417 modify the same files that
`dashboard-and-data-architecture-parity` change-402 / 403 / 404 are
actively editing:

| File | Active phase change | New phase change |
|---|---|---|
| `src/shared/db/pglite-client.ts` | 403 (per-user PGlite + drop/recreate fix) | 411 (transactional + version-stamp bug fix), 412 (per-table fingerprint), 415 (delete generator import) |
| `src/shared/db/sync-config.ts` | 403 (entity catalog) + 404 (lookup wiring) | 415 (split per-feature), 416 (move lookups out) |
| `src/shared/db/local-schema-common.sql` | 403 (system tables) | 411 (`_extra` JSONB), 412 (`_pglite_table_versions`), 413 (extend `local_writes`), 417 (`_pglite_plugin_registry`) |
| `src/shared/db/local-schema-user.sql` | 403 (entity trio + new columns) | 411 (`_extra`), 415 (deleted) |
| `src/shared/db/electric-sync.ts` | 403 (tenant-scoped adapter) | 411 (`syncShapeToTableSafe`), 412 (shape-key derivation), 416 (remove lookups) |

Dispatching now would force the new-phase agents to overwrite or
conflict with the active-phase agents' work, including the
`account_status`/`preferences`/migration fixes the user made today.

## Dispatch order (when gate opens)

```
W0 (parallel, ~1-2 days)
 ├─ change-410-bible-business-rules-inventory      → Explore agent (read-only)
 └─ change-411-schema-stop-the-bleeding            → build-error-resolver

W1 (sequential after W0, ~3-5 days)
 └─ change-412-per-table-fingerprint-migrator      → architect → tdd-guide

W2 (parallel after W1, ~3-5 days)
 ├─ change-413-offline-write-queue-and-reconciler  → tdd-guide
 └─ change-414-pending-sync-ux-surface             → ui-ux-designer → typescript-reviewer

W3 (sequential after W2, ~1 week — upstream PR cycle)
 └─ change-415-schema-registry-upstream            → architect (PR to prometheus-entity-management)

W4 (parallel after W3, ~3-5 days)
 ├─ change-416-lookup-cache-tier                   → tdd-guide
 └─ change-417-hlc-origin-and-plugin-model         → tdd-guide

W5 (sequential after W4, ~1 week — depends on W0 inventory + W2 offline core)
 └─ change-418-business-rule-rehoming-and-offline-coverage  → tdd-guide + code-reviewer
```

## Per-change QA gate

Every change runs `/refine-validate "<change-id>"` after status flips
to `DONE`. Constraints sourced from `.kbd-orchestrator/constraints.md`
(if present) + `CLAUDE.md` RULES 1, 3, 5, A, E, J.

QA may be skipped only for:
- change-410 (documentation-only output).
- Sub-tasks of change-418 that touch fewer than 3 files (per-rule
  ports).

## How to promote when gate opens

1. Run `/kbd-reflect dashboard-and-data-architecture-parity` and
   archive its changes.
2. Copy `.kbd-orchestrator/phases/pglite-schema-strategy-offline-first/waypoint.json`
   over `.kbd-orchestrator/current-waypoint.json`.
3. Update `.kbd-orchestrator/current-waypoint.md` to point at the new
   phase.
4. Re-run `/kbd-execute pglite-schema-strategy-offline-first` — this
   document will be replaced with a live dispatch contract; the gate
   block will be removed.

## Notes for the orchestrator / future agents

- This `execution.md` is **not** a dispatch contract. It is a held
  plan. Do not parse `execution_order` from this file and dispatch —
  the live dispatch contract will be regenerated when the gate opens.
- `progress.json` for this phase is initialized with every change in
  `GATED` state to make the gate explicit to any tool that reads it.
