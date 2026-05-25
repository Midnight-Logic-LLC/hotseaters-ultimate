# change-409 — Dashboard verification (E2E + visual + a11y)

## Why
Changes 405–408 deliver the bible-parity dashboard. This change is the
**executable evidence** that parity is met across roles + breakpoints +
offline scenarios, and that realtime updates flow through the
graph-store to the widgets within the coalescing window.

Without this gate, the phase's Definition-of-Done ("Dashboard renders
every bible widget at ≤5% drift") is just a claim — change-409 turns
it into a CI assertion.

## What changes
1. NEW `tests/e2e/specs/dashboard-widget-registry.spec.ts` — table-driven
   Playwright spec across roles {owner, admin, sales, trial_consultant}
   × company-flag permutations {marketplace_post_jobs off/on}. For each
   combination, asserts the visible widget IDs match the registry's
   expected set.
2. NEW `tests/e2e/specs/dashboard-offline-fallback.spec.ts` — Playwright
   `context.setOffline(true)`; reload `/Dashboard`; assert:
   - Tier-A-backed widgets (Trial, etc.) still render with data.
   - Hybrid-fallback widgets (Invoice, etc.) show their loading
     skeleton, no error toast, no unhandled rejection.
3. NEW `tests/e2e/specs/dashboard-realtime.spec.ts` — opens `/Dashboard`,
   then via psql/Supabase Studio updates a `pipeline_stage` row's
   `revenue_probability`; asserts the `SalesPipelineChart` re-renders
   with the new weighted value within 2 seconds.
4. EXTEND `tests/visual-parity/specs/` with a full-dashboard fixture at
   1440×900 + 375×667. Asserts ≤5% pixel-drift vs bible reference.
5. NEW Lighthouse-CI config entry for `/Dashboard` — fails build at
   a11y < 95.

## Out of scope
- Offline write-queue tests (offline-first phase).
- Stress tests / load tests.
- Cross-browser matrix beyond Chromium (Firefox/Safari deferred).

## Tasks → see `tasks.md`.
