# change-410 — Bible business-rules inventory

## Why
Offline-first behavior is correct per rule, not per page. Today we
discover rules opportunistically as we port each page. The inventory
phase makes the rule surface explicit so change-418 can rehome each
rule into the right architectural layer with the right offline
contract.

Source of truth: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/`
(bible — RULE 2 in `CLAUDE.md`).

## What changes
1. NEW `docs/BIBLE-BUSINESS-RULES.md` — one row per discovered rule,
   classified along five axes:
   - **Class:** pure | side-effect | server-required | formatting | validation | conditional-render
   - **Entity:** the primary entity the rule reads/writes
   - **Bible source:** `HotSeatersMVP/src/<path>:<line>`
   - **Offline policy:** allow | queue+replay | block | best-effort
   - **Target home:** `business-rules/<x>.ts` | `stores/<x>.ts` | `RPC/<x>`
2. NEW `docs/BIBLE-BUSINESS-RULES.csv` — same data, machine-readable
   for change-418 test-matrix generation.
3. NEW `scripts/bible-rules-coverage.mjs` — at CI time, joins the CSV
   against `src/features/<x>/business-rules/*.ts` to assert every rule
   has a port + a test.

Scope: every page in `HotSeatersMVP/src/pages/*.jsx`, every
`HotSeatersMVP/src/components/<feature>/*.jsx`, every utility module
that performs calculations (e.g. `lib/projections.js`,
`lib/billing.js`). Excluded: pure-presentational components with no
business logic.

## Out of scope
- Implementing the rules. Implementation = change-418.
- UI parity. UI parity is the page-parity port phase (separate plan).

## Acceptance
- Inventory enumerates ≥95% of bible rules (verified by spot-checking
  10 random pages — assessor confirms no missing rule).
- Each row has all 5 axes populated.
- `scripts/bible-rules-coverage.mjs` exists; runs in CI with `--report`
  (no fail yet — change-418 turns the fail gate on).
- CSV parses with `csv-parse` (header row, quoted fields, RFC 4180).

## Tasks → see `tasks.md`.
