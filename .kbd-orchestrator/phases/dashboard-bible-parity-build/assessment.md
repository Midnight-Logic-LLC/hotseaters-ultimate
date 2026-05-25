# Assessment — dashboard-bible-parity-build

> Companion phase to `dashboard-and-data-architecture-parity` (now
> reflected). Full architectural rationale, widget inventory, role
> matrix, sequencing, and trade-offs live in
> [`.claude/plans/foamy-marinating-hollerith.md`](../../../.claude/plans/foamy-marinating-hollerith.md).
> This file is a short orientation; `plan.md` is the executable contract.

## Why this phase exists

After the data-foundation phase reflected (4 changes archived 2026-05-25),
the working `/Dashboard` renders the bible's layout shell + 7 of 14 real
widgets. The remaining 7 widgets render `StubCard` placeholders because
their backing entities (`invoice`, `time_entry`, `subcontract_*`) aren't
in `SYNC_CONFIG` yet, and because the monolithic `useDashboardAggregates`
runs raw SQL across 12 tables on every graph-version change — too coarse
to scale, no realtime path, hand-wired role gates in JSX.

This phase delivers the **actual bible-parity dashboard surface** as
the reference implementation every other feature page will follow. It
ships ahead of `pglite-schema-strategy-offline-first` because widgets
backed by un-synced entities use `useEntityView` in `mode: 'hybrid'`
(REST fallback) and auto-promote to local-first when the offline-first
phase later wires those entities into sync — zero widget code changes.

## What this phase delivers

- 17 widget components in `src/features/dashboard/widgets/`, each with
  its own data hook + loading skeleton.
- 14 widget data hooks in `src/features/dashboard/hooks/` composing the
  Phase A business rules (already commit-landed in `28808a7`).
- A role-aware widget registry (`use-dashboard-widgets.ts`) that lifts
  role gating out of JSX into data.
- Lookup-data plumbing: `src/shared/db/lookups-selectors.ts` + Tier1
  extension for `pipelineStages`, `serviceCategories`, etc.
- Cleanup: `use-dashboard-aggregates`, 4 sibling hooks, 2 sibling
  components retired in the same change as the page-shell rewrite.
- Machine-checkable bible-parity assertions in Cypress + visual harness.

## Scope sequence

```
W1: change-405-lookup-selectors-tier1-extension          (Phase B)
W2: change-406-dashboard-widget-data-hooks               (Phase C)
W3: change-407-dashboard-widget-components               (Phase D)
W4: change-408-dashboard-page-shell-and-registry         (Phase E)
W5: change-409-dashboard-verification                    (Phase F)
```

Strictly sequential — each change consumes the prior one's contracts.
No parallel waves. **Phase A (business rules)** is the prologue and is
already commit-landed.

## Decisions locked in (user-confirmed 2026-05-25)

| Decision | Choice |
|---|---|
| Phase ownership | Register as a first-class KBD phase (this one). |
| Sequencing vs offline-first | Dashboard-build first (REST hybrid). Auto-promote to local-first when offline-first ships. |
| Reflect timing for prior phase | Reflect now, archive 401–404. ✅ done 2026-05-25. |
| Non-synced widget data path | `useEntityView` hybrid + Supabase REST fallback. |
| Reference-data path | Project from `entity_metadata` + `metadata_type` via `selectGraph`. |
| Cleanup scope | Delete deprecated files in the same change as the page rewrite (change-408). |

## Definition of done

- The bible's `/Dashboard` (`HotSeatersMVP/src/pages/Dashboard.jsx`)
  reproduces at ≥95% pixel-overlap parity at 1440×900 + 375×667.
- Every widget owns its own data hook + loading skeleton.
- No widget calls PGlite directly; every read goes through
  `useEntityList` / `useEntityView` / `selectGraph`.
- Adding a new widget = new file in `widgets/` + new row in the
  registry. Zero edits to `dashboard-page.tsx`.
- Role gating lives only in `use-dashboard-widgets` and
  `use-quick-actions` — no `role === '…'` checks in any JSX file.
- All bible business rules from `Dashboard.jsx` lines 163–588 are
  ported (already done in commit `28808a7`).
- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- `eslint-plugin-boundaries` passes — components import only hooks +
  UI primitives; hooks read only from stores/graph.
- The Cypress role-permutation, offline-fallback, and realtime specs
  all pass.
- Lighthouse a11y on `/Dashboard` ≥ 95.
- Bundle size: `pnpm size` unchanged or smaller (the deletes outweigh
  the additions).

## Out of scope (deferred)

- Adding `invoice`, `time_entry`, `subcontract_*` to `SYNC_CONFIG`
  (`pglite-schema-strategy-offline-first` change-415).
- Pending-Sync chip UI (`pglite-schema-strategy-offline-first`
  change-414).
- `queueSideEffect` integration on quick-action handlers
  (`pglite-schema-strategy-offline-first` change-413).
- Per-row badges or per-field tooltips (follow-up).
- TanStack Table integration on list pages (separate phase).

## Reference

- Full plan: [`.claude/plans/foamy-marinating-hollerith.md`](../../../.claude/plans/foamy-marinating-hollerith.md)
- Phase A business rules:
  [`src/features/dashboard/business-rules/`](../../../src/features/dashboard/business-rules/)
- Prior phase reflection:
  [`.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/progress.json`](../dashboard-and-data-architecture-parity/progress.json)
- Spec capabilities (created by the prior reflect):
  `openspec/specs/auth-routing/`, `app-shell/`, `dashboard/`,
  `local-first-sync/`, `lookups/`.
- Bible:
  `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Dashboard.jsx`
- Project rules:
  [`CLAUDE.md`](../../../CLAUDE.md) — esp. RULE 0, 3, B–J.
