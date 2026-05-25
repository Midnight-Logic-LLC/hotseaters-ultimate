# Plan — pglite-schema-strategy-offline-first

> Execution contract for the phase. Implements
> [`docs/architecture/pglite-schema-strategy.md`](../../../docs/architecture/pglite-schema-strategy.md)
> with offline-first + pending-sync UX + bible business-rule coverage.

## Execution order (waves)

The plan is 9 changes across 5 waves. Each wave is a checkpoint; the
user can pause / re-prioritize between waves without leaving the app
in a broken state.

```
W0 (research, parallel)
 ├─ change-410-bible-business-rules-inventory       agent: Explore
 └─ change-411-schema-stop-the-bleeding             agent: build-error-resolver

W1 (foundation, sequential — must land before W2)
 └─ change-412-per-table-fingerprint-migrator       agent: architect → tdd-guide

W2 (offline core, parallel after W1)
 ├─ change-413-offline-write-queue-and-reconciler   agent: tdd-guide
 └─ change-414-pending-sync-ux-surface              agent: ui-ux-designer → typescript-reviewer

W3 (upstream, sequential — depends on W1+W2 contracts)
 └─ change-415-schema-registry-upstream             agent: architect (PR to prometheus-entity-management)

W4 (specialization, parallel after W3)
 ├─ change-416-lookup-cache-tier                    agent: tdd-guide
 └─ change-417-hlc-origin-and-plugin-model          agent: tdd-guide

W5 (port + verify, depends on W0 + W2 + W4)
 └─ change-418-business-rule-rehoming-and-offline-coverage   agent: tdd-guide + code-reviewer
```

## Change list

| ID | Title | Wave | Primary agent | Why this order |
|---|---|---|---|---|
| 410 | Bible business-rule inventory | W0 | Explore | Read-only research; doc-only output; unblocks W5. |
| 411 | Stop-the-bleeding fixes (`_extra` JSONB, transactional migration, version-stamp bug fix) | W0 | build-error-resolver | Removes the worst symptom (forward-compat) without architectural change. Safe to ship first. |
| 412 | Per-table fingerprint migrator | W1 | architect → tdd-guide | Foundation for everything else. Replaces the monolithic version stamp. |
| 413 | Offline write queue + reconciler | W2 | tdd-guide | Builds on 411's `_extra` + 412's per-table state. Adds `local_writes.operation='side_effect'`, retry/backoff, conflict detection. |
| 414 | Pending-sync UX surface | W2 | ui-ux-designer → typescript-reviewer | Global header chip + Pending changes panel. Parallel with 413 (separate files). |
| 415 | Schema registry upstream PRs | W3 | architect | `defineSyncedEntity`, `SchemaRegistry`, `SchemaMigrator` in `prometheus-entity-management`. Depends on 412 contract. |
| 416 | Lookup-cache tier | W4 | tdd-guide | Tier-L for `metadata_type`, `country`, `state`, system `pipeline_stage`. ETag refresh. Depends on 415. |
| 417 | HLC + `_origin` + plugin model | W4 | tdd-guide | Wire format guarantees for the WebRTC future + plugin extensibility. Depends on 415. |
| 418 | Business-rule rehoming + offline coverage | W5 | tdd-guide + code-reviewer | Port every rule from inventory (410) into `business-rules/` (pure) or store side-effects (queued via 413). Per-rule offline contract test. |

## Cross-cutting constraints (binding on every change)

- **RULE 1** — self-hosted Supabase only.
- **RULE 3** — architectural invariants (components → hooks → stores → shared/db).
- **RULE 5** — PGlite has no RLS; shape WHERE ⊆ RLS USING.
- **RULE A** — kebab-case filenames (rename before editing).
- **RULE E** — `prometheus-entity-management`, no TanStack Query.
- **RULE J** — every business rule from the bible must be reproduced.
- **80% test coverage** per `common/testing.md`.
- **No `console.log`** in production code.
- **Every change includes a Cypress + unit test** that proves
  the offline / sync behavior it claims, not just that the code compiles.

## Definition of done (rolls up assessment §DoD)

A new column added to `public.client` in latest-data must, end-to-end:
1. Be picked up by Electric.
2. Land in `client_synced._extra` if the local schema is behind, OR in
   a real column if the local fingerprint matches the registry.
3. Never crash the app.
4. Be visible in the entity graph through `_extra ->> '<col>'`
   projection or directly.

A user can:
1. Go offline.
2. Create 5 clients, edit 3 trials, send 1 e-sign request, attach 2 documents.
3. See the global header chip show "11 pending • Offline".
4. Click the chip → see all 11 pending changes with age, entity, type.
5. Reconnect.
6. See the chip drain to "0 pending • Online" with success toasts; any
   conflicts surface in the panel with a one-click diff/re-apply.

The Cypress offline test, the chaos migration test, and a per-rule
matrix test (from change-410) all pass.

## OpenSpec change pointers

- `openspec/changes/change-410-bible-business-rules-inventory/proposal.md`
- `openspec/changes/change-411-schema-stop-the-bleeding/proposal.md`
- `openspec/changes/change-412-per-table-fingerprint-migrator/proposal.md`
- `openspec/changes/change-413-offline-write-queue-and-reconciler/proposal.md`
- `openspec/changes/change-414-pending-sync-ux-surface/proposal.md`
- `openspec/changes/change-415-schema-registry-upstream/proposal.md`
- `openspec/changes/change-416-lookup-cache-tier/proposal.md`
- `openspec/changes/change-417-hlc-origin-and-plugin-model/proposal.md`
- `openspec/changes/change-418-business-rule-rehoming-and-offline-coverage/proposal.md`

Each has its own `tasks.md` and `specs/` directory. Acceptance criteria
in those files are the executable contract; this plan is the index.
