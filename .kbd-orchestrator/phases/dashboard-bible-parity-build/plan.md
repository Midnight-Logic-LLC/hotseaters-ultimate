# Plan — dashboard-bible-parity-build

> Execution contract. Full architectural rationale lives in
> [`.claude/plans/foamy-marinating-hollerith.md`](../../../.claude/plans/foamy-marinating-hollerith.md).
> This file is the wave list `/kbd-execute` will dispatch from.

## Prologue (already landed)

- **Phase A — bible business rules**: commit `28808a7`. 7 pure modules
  + 70 tests in `src/features/dashboard/business-rules/`. Every
  calculation from `HotSeatersMVP/src/pages/Dashboard.jsx` lines
  163–588, byte-for-byte. **Not part of this phase's change ledger;
  it's the foundation each subsequent change composes.**

## Execution order (waves)

Strictly sequential — each change depends on the prior one's
contracts.

```
W1: change-405-lookup-selectors-tier1-extension      agent: architect → typescript-reviewer
W2: change-406-dashboard-widget-data-hooks           agent: tdd-guide
W3: change-407-dashboard-widget-components           agent: ui-ux-designer + typescript-reviewer
W4: change-408-dashboard-page-shell-and-registry     agent: typescript-reviewer + code-reviewer
W5: change-409-dashboard-verification                agent: e2e-runner + code-reviewer
```

## Change list

| ID | Wave | Title | Primary agent | Risk |
|---|---|---|---|---|
| 405 | W1 | Lookup selectors + Tier1 extension | architect | Low |
| 406 | W2 | Widget data hooks (14) | tdd-guide | Med — graph selector correctness |
| 407 | W3 | Widget components (17) | ui-ux-designer + typescript-reviewer | Med — visual parity |
| 408 | W4 | Page shell + role-aware registry + cleanup | typescript-reviewer | Low |
| 409 | W5 | Verification (E2E + visual + a11y) | e2e-runner + code-reviewer | Low |

## Cross-cutting constraints (binding on every change)

- **RULE 0** — bible visual + functional parity.
- **RULE 1** — self-hosted Supabase only.
- **RULE 3** — architectural invariants (components → hooks → stores → shared/db).
- **RULE A** — kebab-case filenames (rename before editing).
- **RULE B / F** — components import only hooks + UI primitives.
- **RULE E** — `prometheus-entity-management`, no TanStack Query.
- **RULE J** — every bible business rule preserved (Phase A enforces).
- **80% test coverage** per `common/testing.md`.
- **No `console.log`** in production code.

## Definition of done (rolls up §DoD in assessment.md)

A signed-in user on `/Dashboard`:

1. Sees the bible's 17 widgets in the bible's grid layout (with
   role-appropriate subset).
2. Can change the RevenueTrend fiscal-year + cumulative toggle, and
   the preference persists across reloads (write goes through
   `local_writes` → Supabase REST).
3. Triggers any quick-action → navigates to the bible's destination.
4. Sees realtime updates to any widget within 50ms of a server change
   (Realtime Manager + Electric).
5. Sees ≤5% visual drift vs the bible at 1440×900 + 375×667.
6. Sees zero `role === '…'` strings in any widget JSX.

## OpenSpec change pointers

- `openspec/changes/change-405-lookup-selectors-tier1-extension/proposal.md`
- `openspec/changes/change-406-dashboard-widget-data-hooks/proposal.md`
- `openspec/changes/change-407-dashboard-widget-components/proposal.md`
- `openspec/changes/change-408-dashboard-page-shell-and-registry/proposal.md`
- `openspec/changes/change-409-dashboard-verification/proposal.md`

Each has its own `tasks.md`. Acceptance criteria in those files are
the executable contract; this plan is the index.

## Promotion path

When change-409 lands + verifies:

1. Run `openspec archive` on each of 405..409.
2. `/kbd-reflect dashboard-bible-parity-build` to flip the ledger.
3. Promote `pglite-schema-strategy-offline-first` from GATED → active.
