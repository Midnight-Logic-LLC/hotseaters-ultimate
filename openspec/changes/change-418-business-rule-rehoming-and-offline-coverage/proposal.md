# change-418 — Business-rule rehoming + offline coverage

## Why
Change-410 produced the bible business-rule inventory. This change
ports each inventoried rule into the right architectural layer with
the offline policy from the inventory:

- `pure` / `formatting` / `validation` / `conditional-render` →
  `src/features/<x>/business-rules/<name>.ts` as a pure function. Works
  offline by construction. Unit-tested.
- `side-effect` → store action that calls
  `queueSideEffect({ name, dedupeKey, payload })` from change-413.
  Works offline (queued); drains on reconnect.
- `server-required` → `src/features/<x>/api/<name>.ts` calling Supabase
  RPC. Caller wraps in `if (!online) { showRequiresConnectionToast() }`.

This change is the executable proof of RULE J in CLAUDE.md ("Preserve
all business rules from the source page").

## What changes
1. For each rule in `docs/BIBLE-BUSINESS-RULES.csv`:
   - Create / port to its `target_home`.
   - Write a unit test using bible inputs → bible outputs (read from
     bible source as the spec).
   - For `side-effect` rules: confirm the store action queues
     correctly; write a Cypress test that triggers it offline and
     verifies replay on reconnect.
   - For `server-required` rules: write a Cypress test that triggers
     it offline and verifies the user-facing block (chip + toast).
2. Flip `scripts/bible-rules-coverage.mjs` from `--report` to `--strict`
   in CI. A missing port or missing test fails the build.
3. NEW per-rule offline contract test matrix at
   `tests/cucumber/features/bible-rules-offline.feature`. Each scenario
   is `Given the user is <online|offline> When they <trigger rule X>
   Then <expected outcome>`. Generated from the CSV by a script.
4. Update `CLAUDE.md` "How to add a feature" recipe with a "business
   rule classification + offline policy" step.

## Out of scope
- Adding net-new business rules (this is a port, not a redesign).
- Page-parity visual ports (the page-parity port phase covers UI).
- Per-rule custom mergers (default LWW only).

## Acceptance
- `scripts/bible-rules-coverage.mjs --strict` passes in CI.
- Every rule from `docs/BIBLE-BUSINESS-RULES.csv` has:
  - A file at `target_home`.
  - A unit test (for `pure`/`formatting`/`validation`/`conditional-render`).
  - A Cypress contract test (for `side-effect`/`server-required`).
- Random spot-check on 5 rules: invoking offline triggers the expected
  policy (allow / queue / block) with correct UI surface.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- The page-parity phase can mark its "preserve every bible business rule"
  acceptance criterion as ✅ (defers to this change).

## Tasks → see `tasks.md`.
