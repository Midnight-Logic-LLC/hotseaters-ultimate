# Execution — sales-deals-rearchitecture

_Generated: 2026-05-29 (Claude Opus 4.8)._

## Backend selection: `openspec` (inline)

- **Backend:** OpenSpec changes (`openspec/changes/change-D01..D09`), executed
  inline by Claude Code (the model with full repo + bible context), not
  dispatched to an external tool.
- **Rationale:** This phase is bible-parity work requiring constant
  cross-reference between the bible source (`HotSeatersMVP @ 29ae47e3`) and the
  port's trial-entity architecture. The agent holding both contexts executes
  most faithfully (RULE 0 acceptance gate is comprehension-driven). Same model
  as the V-phase and Wave-S executions.
- **QA gate:** per-change, run the project gate trio (`pnpm typecheck && lint &&
  test`) + bible cross-check before marking DONE. artifact-refiner is not wired
  in this repo (no `.refiner/`); the CI gate trio + RULE-0/J review substitute,
  consistent with prior phases.

## Dispatch order (from progress.json)

1. **D01** — deals-scope data layer (foundation; unblocks all).
2. **D02, D03, D04** — DealTracker/Kanban · deal wizard · sales-activity (parallel-safe).
3. **D05, D06, D07** — Sales Hub · revenue projections · dashboard pivot.
4. **D08** — retire dead Lead code (after deals surface exists).
5. **D09** — verification (RULE J + VR + Lighthouse + gate).

## Per-change protocol

For each change:
1. Read the bible source it ports, end-to-end.
2. Implement against the port's trial entity / hooks / stores (RULE C/D/E).
3. Gate trio green + bible cross-check (RULE 0/J).
4. Mark DONE in progress.json; commit (pre-commit hook enforces lint+RLS).

## Schema note (resolved)

No migration on the critical path — a "deal" is a trial at an early pipeline
stage. D01 builds the data seam over the existing, already-synced trial entity.

## Coordination

`page-parity-verification-hardening` (Body A) is the other active phase. Its
V11 Landing re-port and this phase's sales work are independent; the Michroma
title fix already shipped applies to both.
