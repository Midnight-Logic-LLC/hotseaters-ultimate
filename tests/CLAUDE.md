# tests/ — test harness guide

## Hard Constraints

Inherits from `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`:

- **Self-hosted Supabase only.** Tests target `http://localhost:8000`
  (docker-compose) or `https://hotbase.prometheusags.ai`. Never `*.supabase.co`.
- **HotSeatersMVP is the bible.** Functional + visual ground truth lives at
  `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`.
- **Components → hooks → stores → APIs.** Tests at every layer respect this:
  unit tests don't import stores from components, etc.

## The test pyramid

```
                  ┌─────────────────────────────┐
                  │   visual-parity (slowest)   │   <-- 0.5% pixel diff vs MVP
                  └─────────────────────────────┘
                ┌─────────────────────────────────┐
                │   pgTAP (DB invariants)         │   <-- RLS, bridge trigger
                └─────────────────────────────────┘
              ┌─────────────────────────────────────┐
              │   Cucumber (auth + role journeys)   │  <-- Gherkin BDD
              └─────────────────────────────────────┘
            ┌─────────────────────────────────────────┐
            │   Playwright e2e (smoke, virtualization,│  <-- 3 browser projects
            │   optimistic CRUD, cross-feature graph) │
            └─────────────────────────────────────────┘
          ┌─────────────────────────────────────────────┐
          │   vitest integration (stores, sync engine)  │  <-- co-located *.test.ts
          └─────────────────────────────────────────────┘
        ┌───────────────────────────────────────────────────┐
        │   vitest unit (pure functions, hooks, utilities)  │  <-- fast majority
        └───────────────────────────────────────────────────┘
```

## Where each kind of test lives

| Layer            | Where                                 | Runner          |
| ---------------- | ------------------------------------- | --------------- |
| Unit             | `src/**/*.test.ts(x)`                 | `vitest`        |
| Integration      | `src/**/*.test.ts(x)` (with PGlite)   | `vitest`        |
| E2E (Playwright) | `tests/e2e/specs/`                    | `playwright`    |
| BDD journey      | `tests/cucumber/features/`            | `@cucumber/cucumber` |
| Visual parity    | `tests/visual-parity/specs/`          | `playwright` (separate config) |
| DB (pgTAP)       | `tests/db/` (canonical in latest-data)| `pg_prove`      |

## When to add what

- **New pure function / util / hook:** add a `*.test.ts` next to the source.
  Vitest, fast feedback.
- **New entity, new sync behavior:** vitest integration with a real PGlite
  instance (see `src/shared/db/sync-foundation.test.ts` for the pattern).
- **New page or interactive behavior:** Playwright spec under
  `tests/e2e/specs/` tagged `@smoke` if it must run on every PR.
- **New auth flow or role-gated path:** Cucumber scenario in
  `tests/cucumber/features/`. Update `role-route-matrix.feature` if a new
  role × route pair appears.
- **New screen with UI parity requirements:** add a visual-parity spec under
  `tests/visual-parity/specs/`, then capture baselines via
  `pnpm test:visual-parity:update`.
- **New table / new RLS policy:** add an assertion to
  `latest-data/tests/auth_rls_smoke_test.sql`. New synced entity →
  `sync-config.ts` automatically picked up by `sync-allowlist-rls.sql`.

## Fixtures

- `tests/e2e/fixtures/auth.ts` — three signed-in personas (Owner, Sales,
  Trial Consultant). Seeds a fake supabase session in localStorage via
  `addInitScript`. No real OAuth. Reused by Cucumber world.
- `tests/e2e/fixtures/pglite.ts` — auto-fixture that clears IndexedDB
  before each test so PGlite boots fresh.
- `tests/e2e/fixtures/index.ts` — merged `test` and `expect` for specs.

## Commands

| Command                              | What it does                                 |
| ------------------------------------ | -------------------------------------------- |
| `pnpm test`                          | Vitest unit + integration                    |
| `pnpm test:e2e`                      | All Playwright e2e specs (3 projects)        |
| `pnpm test:e2e:smoke`                | Only `@smoke`-tagged Playwright specs        |
| `pnpm test:e2e:cucumber`             | Cucumber BDD journeys                        |
| `pnpm test:visual-parity`            | Visual-parity compare (CI uses this)         |
| `pnpm test:visual-parity:update`     | Capture/refresh baselines (local only)       |
| `pnpm test:db`                       | pgTAP suite against local supabase           |
| `pnpm test:all`                      | vitest + db + e2e smoke                      |

## What this harness does **not** do

- It does not run real OAuth, real magic-link emails, or any external SaaS.
- It does not write to a remote database.
- It does not modify `latest-data/` migrations — those land in their own repo.
- It does not generate baselines automatically in CI — baselines are a
  committed source of truth, captured locally with intent.
