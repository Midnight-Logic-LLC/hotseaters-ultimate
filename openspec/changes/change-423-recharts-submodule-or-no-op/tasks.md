# Tasks — change-423

## Phase 1: Gate (must complete before any submodule work)

- [ ] T1. **GATE**: with changes 420–422 landed, `pnpm dev` and open
  `/Dashboard` at 1440×900. Capture a screenshot of the DevTools
  Console for the record. Decision:
  - **Console clean of `Maximum update depth exceeded`** and
    `width(-1) height(-1)` → take Phase 2A (no-op).
  - **Either error still present** → take Phase 2B (submodule).

## Phase 2A: No-op path

- [ ] T2A. CLOSE this change with a note in `tasks.md` documenting:
  - Verification commit SHA (= the head of change-422's branch).
  - Date + viewport tested.
  - Screenshot reference of the clean console.
- [ ] T3A. Leave the existing `github:GQAdonis/recharts#release` pin
  in `package.json`. No package changes.
- [ ] T4A. Confirm `pnpm typecheck && pnpm lint && pnpm test` still
  green (no regression from 420–422).
- [ ] T5A. Update `docs/RUNBOOKS.md` "Updating the recharts fork" with
  a note that the existing tarball-based loop remains the active
  pattern (since we didn't need to submodule). Add a "When to upgrade
  to a submodule" pointer for future contributors.

## Phase 2B: Submodule path

- [ ] T2B. From `hotseaters-ultimate` root:
  `git submodule add git@github.com:GQAdonis/recharts.git packages/recharts`
  on the `main` branch.
- [ ] T3B. EDIT `pnpm-workspace.yaml` to include
  `packages/recharts` alongside `packages/prometheus-entity-management`.
- [ ] T4B. EDIT `package.json`: `"recharts": "github:GQAdonis/recharts#release"`
  → `"recharts": "workspace:*"`.
- [ ] T5B. `cd packages/recharts && npm install --no-audit --no-fund &&
  npm run build`. Confirm `lib/`, `es6/`, `umd/`, `types/` populated.
- [ ] T6B. `pnpm install` at superproject root. Confirm
  `node_modules/recharts` now resolves via `link:packages/recharts`
  (`pnpm-lock.yaml` should show `version: link:packages/recharts`).
- [ ] T7B. Identify the bug. Approach: bisect by temporarily
  short-circuiting `ChartDataContextProvider` to test if the loop
  origin is there. If so, the React 19 ref-callback / nested
  `useSyncExternalStore` interaction is the likely cause (see
  upstream issues
  [#5489](https://github.com/recharts/recharts/issues/5489),
  [#6613](https://github.com/recharts/recharts/issues/6613)).
- [ ] T8B. LAND a minimal source-level patch on submodule `main`.
  Commit message: `fix(ChartDataContextProvider): break Max-update-depth
  loop on React 19 (closes hotseaters #N if applicable)`.
- [ ] T9B. Rebuild + push `main`. Update `release` per the recipe in
  `docs/RUNBOOKS.md` (the same recipe still applies; the workspace
  link picks up the rebuild without needing the `release` branch,
  but we keep `release` current for downstream consumers).
- [ ] T10B. From superproject: `git add packages/recharts` to bump
  the submodule SHA. Commit:
  `fix(deps): patch recharts ChartDataContextProvider loop via submodule fork`.
- [ ] T11B. `pnpm typecheck && pnpm lint && pnpm test`. Must stay
  298/298 green.
- [ ] T12B. Manual: `pnpm dev` → `/Dashboard`. Console clean of
  `Maximum update depth exceeded` and `width(-1)`. Charts render
  with real data.
- [ ] T13B. UPDATE `docs/RUNBOOKS.md` "Updating the recharts fork"
  with the new submodule-based loop, replacing the tarball-based
  steps.

## Acceptance

Either:
- **No-op path**: console clean after 420–422; this change closes
  with documentation and no code edits.
- **Submodule path**: recharts is a workspace package at
  `packages/recharts`; console clean; tests green; SHA-bump commit
  recorded in the superproject.
