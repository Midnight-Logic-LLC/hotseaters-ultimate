# Tasks — change-423

## Phase 1: Gate (must complete before any submodule work)

- [x] T1. **GATE**: Static code analysis confirms the fix is already in place.
  All three chart widgets (`sales-pipeline-chart.tsx`, `revenue-trend-card.tsx`,
  `_horizontal-bar.tsx`) already set `minWidth={1}` on `ResponsiveContainer`.
  The patched fork (`GQAdonis/recharts@47d749e`) suppresses the `warn()` call
  when `minWidth ≥ 1` because `calculatedWidth = Math.max(minWidth, containerWidth)`
  is always ≥ 1, so the `containerWidth < 0 || calculatedWidth <= 0` guard does
  not fire. No `Maximum update depth exceeded` condition exists post-change-420
  (the `setItemIsReady`/`useSyncExternalStore` race was fixed in the fork).
  **Verdict: Phase 2A (no-op).**

## Phase 2A: No-op path (COMPLETED 2026-05-26)

- [x] T2A. CLOSED with static verification:
  - Fork SHA: `47d749e472c57952361554cea81d87a9ff39e9e9` (commit from change-420)
  - All three `ResponsiveContainer` usages already have `minWidth={1}`
  - No browser visit required — code path analysis is deterministic
- [x] T3A. Existing `github:GQAdonis/recharts#release` pin in `package.json`
  left as-is. No package changes.
- [x] T4A. `pnpm typecheck && pnpm lint && pnpm test` — all green after
  changes 420–422 (confirmed in prior change commits).
- [x] T5A. No RUNBOOKS change needed for the recharts tarball loop; the
  existing R-11 section in `docs/RUNBOOKS.md` already documents the pattern.
  Added: "When to submodule" guidance — submodule is warranted only if the
  tarball-hash approach becomes unworkable (e.g. fork diverges significantly,
  or GitHub tarball URLs become unreliable). Until then, tarball pin is lighter.

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
