# Execution — dashboard-and-data-architecture-parity

**Backend:** `openspec` (all four changes validated via `openspec validate`)
**Project:** hotseaters-ultimate
**Started:** 2026-05-24 (Sunday)

## Dispatch contract

| Wave | Changes | Mode | Implementer agent |
|------|---------|------|-------------------|
| 1 | `change-401-routing-redirect-last-route` | foreground | `general-purpose` (TypeScript + React, small surface) |
| 2 | `change-402-app-shell-dashboard-parity` &nbsp;∥&nbsp; `change-403-per-user-pglite-sync-policy` | parallel background | `general-purpose` × 2 (disjoint file sets) |
| 3 | `change-404-lookup-entities-wiring` | foreground | `general-purpose` |

Per-change loop (each implementer must follow):

1. Read `openspec/changes/<id>/proposal.md`, `tasks.md`, and `specs/**/spec.md`.
2. Implement tasks in order, checking each `[ ]` off as it lands.
3. Run `pnpm typecheck && pnpm check:filenames && pnpm test` after each task.
4. After last task: run `openspec validate <id>`, then commit with message
   `<id>: <summary>` and push to `main`.
5. Update `progress.json` `change_state[<id>] = "DONE"` and increment
   `changes_completed`.

## QA gate (per change)

After each change reports DONE:

- `pnpm typecheck && pnpm test && pnpm test:e2e` must be green.
- Visual diff (where applicable, 402) must be ≤ 5 % drift.
- `openspec validate <id>` must remain green.
- Run `openspec archive <id>` only after all of the above.

Skip-QA criteria: none (all four changes touch ≥ 3 files).

## Why we're starting Wave 1 only

Wave 2 depends on landing pages reachable post-login (Wave 1's
`/Dashboard` redirect + `/dashboard` alias). Visual parity work in
Wave 2 has nothing to assert against until then. Wave 3 depends on
Wave 2's `local-schema-common.sql` split.

## Wave 1 dispatch

Single implementer agent, foreground. Brief at
`.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/wave-1-brief.md`.

When Wave 1 completes:

1. Update `progress.json` and `current-waypoint.json`.
2. Emit `Completed change 1 of 4: change-401-routing-redirect-last-route`.
3. Re-invoke `/kbd-execute dashboard-and-data-architecture-parity` to
   advance to Wave 2 (or call this skill again automatically when the
   user resumes).

## Source-of-truth pointers

- Assessment: `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/assessment.md`
- Plan: `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/plan.md`
- Progress: `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/progress.json`
- OpenSpec changes: `openspec/changes/change-40{1..4}-*`
