# Current waypoint — hotseaters-ultimate

**Phase:** `dashboard-bible-parity-build`
**Status:** planned (ready to execute)
**Change backend:** OpenSpec (`openspec/` at repo root)
**Design doc:** [.claude/plans/foamy-marinating-hollerith.md](../.claude/plans/foamy-marinating-hollerith.md)

## What just finished
- `dashboard-and-data-architecture-parity` reflected and archived 2026-05-25.
  All 4 changes (401–404) moved to `openspec/changes/archive/` and 5 spec
  capabilities created under `openspec/specs/` (auth-routing, app-shell,
  dashboard, local-first-sync, lookups).
- Dashboard-rebuild Phase A (bible business rules) committed in `28808a7`
  — 7 modules + 70 tests, the foundation every subsequent widget hook
  composes.

## Phase scope
**Build the actual bible-parity dashboard surface** as the reference
implementation every other feature page will follow. 5 sequential
OpenSpec changes (405–409), Phases B–F of the dashboard rebuild plan.

| Wave | Change | Deliverable |
|---|---|---|
| W1 | 405 | Lookup selectors + Tier1 extension |
| W2 | 406 | 14 widget data hooks (`useEntityView` hybrid mode) |
| W3 | 407 | 17 widget components (bible visual parity) |
| W4 | 408 | Thin page shell + role-aware widget registry + cleanup |
| W5 | 409 | Verification — Cypress role permutations + offline-fallback + realtime + visual harness + Lighthouse a11y |

## Next step
Run `/kbd-execute dashboard-bible-parity-build` to dispatch W1
(change-405). Each subsequent wave waits on the prior one's contracts
— strictly sequential.

## Queued next phase (GATED)
`pglite-schema-strategy-offline-first` remains GATED — 9 changes
(410–418) across 5 waves. Gate releases when change-409 lands. Once
that phase ships, the dashboard's hybrid-mode widgets backed by
un-synced entities (`invoice`, `time_entry`, `subcontract_*`)
auto-promote to local-first via change-415's per-feature `entities.ts`
wiring. **Zero widget code changes required for the promotion.**

## Promotion path
1. Dispatch `/kbd-execute dashboard-bible-parity-build` (W1).
2. On change-409 land + verify, run `openspec archive` on 405–409.
3. `/kbd-reflect dashboard-bible-parity-build` to flip the ledger.
4. Promote `pglite-schema-strategy-offline-first` by copying
   `.kbd-orchestrator/phases/pglite-schema-strategy-offline-first/waypoint.json`
   over this file.
5. Re-run `/kbd-execute pglite-schema-strategy-offline-first` —
   the gate will be open.
