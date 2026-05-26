# change-423 — Recharts submodule (or no-op if upstream of 420 was enough)

## Why
After change-420 stabilizes `useEntityList` snapshots, the data array
that recharts charts consume will stop churning on every render. The
recharts `Maximum update depth exceeded` crash inside
`<ChartDataContextProvider>` is — per the assessment §D — most likely a
*symptom* of that data churn rather than an independent recharts bug.
The same logic applies to the `width(-1)` warning.

**This change is gated on observation, not on assumption.** After
changes 420–422 land, we re-test the dashboard. If the loop is gone,
this change closes as no-op (and we save the cost of taking on a
recharts submodule). If it persists, we conform to user Rule #2:
add the fork as a git submodule, fix in source, commit, reference via
git ref.

The fork is already prepared:
- Remote: `git@github.com:GQAdonis/recharts.git`
- `main` is current with upstream `v3.8.1` (commit `9632f94d44`).
- `release` branch carries prebuilt `lib/`, `es6/`, `umd/`, `types/`
  artifacts at commit `47d749e472` (built 25 May 2026, ready to
  consume).
- The app currently pulls recharts from
  `github:GQAdonis/recharts#release` (commit `381546b`).

Converting to a submodule mirrors the entity-management pattern:
edit submodule's `src/` → rebuild → app picks up via workspace link
→ commit submodule SHA bump in the superproject. This satisfies
Rule #2 cleanly.

## What changes
**Conditional on retest after changes 420–422.**

### If the recharts loop is gone after 420–422
1. CLOSE this change as no-op. Document in `tasks.md` T1 that
   verification on `<commit-sha-of-420>` showed clean console.
2. The app stays on the `github:GQAdonis/recharts#release` pin. The
   fork remains useful as a fast-iteration loop if a future recharts
   bug surfaces, but we don't take on the submodule maintenance cost
   today.

### If the recharts loop persists
1. ADD `git@github.com:GQAdonis/recharts.git` as a git submodule at
   `packages/recharts` on the `main` branch.
2. UPDATE `pnpm-workspace.yaml` to include `packages/recharts`.
3. CHANGE `package.json` dep: `"recharts": "github:GQAdonis/recharts#release"`
   → `"recharts": "workspace:*"`.
4. Bisect the recharts source to find the loop's trigger. Likely
   candidates (per the assessment §D): the `ChartDataContextProvider`
   redux-style store dispatch chain at the React-19 ref-callback
   boundary, or `ResponsiveContainer`'s ResizeObserver feedback when
   `containerRef.current` is `-1` on first measure.
5. LAND a minimal source-level fix on submodule `main`.
6. REBUILD: `cd packages/recharts && npm install --no-audit --no-fund &&
   npm run build` (recharts uses npm, not pnpm, for its own scripts).
7. PUSH `main` to origin. Update the `release` branch via the recipe
   in `docs/RUNBOOKS.md` "Updating the recharts fork".
8. COMMIT submodule SHA bump in the superproject.
9. UPDATE `docs/RUNBOOKS.md` "Updating the recharts fork" to reflect
   the new submodule-based loop (the workspace link replaces the
   prior "edit fork → push release → pnpm update recharts" sequence).

## Out of scope
- Upstreaming the recharts fix to `recharts/recharts` — good follow-up
  but not blocking.
- Switching the app to a different chart library — assessment §D
  explicitly rules this out (cost too high vs. a localized fix).
- Optimizing the `release` branch publishing flow further; documented
  in RUNBOOKS already.

## Tasks → see `tasks.md`.
