# change-420 — Memoize useEntityList in the entity-mgmt submodule

## Why
The previous round's "memoize useEntityList return" fix was applied to
`/Users/gqadonis/Projects/midnight/latest-data/packages/prometheus-entity-management/src/hooks.ts`
— a separate working tree the app does NOT consume. The app resolves
`@prometheus-ags/prometheus-entity-management` via `workspace:*` to the
git submodule at
`hotseaters-ultimate/packages/prometheus-entity-management/`, whose
`src/hooks.ts` still emits an unstable snapshot to React 19's
`useSyncExternalStore` → the `getSnapshot should be cached` warning is
still observed at every dashboard load (`hooks.ts:108` →
`use-team.ts:39` → `use-quick-stats.ts:90` → `kpi-outstanding.tsx`).

This is the **keystone defect** for the current dashboard regression:
when `useEntityList` returns a fresh object identity per render, React
suspends the consumer at first commit, no Tier-A or hybrid hook
delivers data, the dashboard widgets show empty/skeleton state, and
the recharts loop (a downstream symptom of that data churn) crashes
the page.

Per the user's Rule #1, the fix lives in the submodule's source,
gets confirmed locally via the `workspace:*` link, then ships
externally via `npm publish` so downstream consumers (including any
non-workspace install path) pick it up.

## What changes
1. EDIT `packages/prometheus-entity-management/src/hooks.ts`
   `useEntityList` (line ~124): wrap the return object in `useMemo`
   keyed on `[items, listState, fetchNextPage, doFetch]`. The
   selector at line 108 already uses `useShallow` (keeps `items`
   stable across no-op updates); this change stabilizes the outer
   result shape consumers depend on. Pattern documented in
   [pmndrs/zustand #1936](https://github.com/pmndrs/zustand/discussions/1936)
   and confirmed by the
   [official `useSyncExternalStore` docs](https://react.dev/reference/react/useSyncExternalStore)
   ("your `getSnapshot` function should... return the same snapshot
   as the last time if the data has not changed").
2. REBUILD via the submodule's own pipeline:
   `pnpm --filter @prometheus-ags/prometheus-entity-management build`.
   The app picks up the change immediately through the pnpm workspace
   link — no `pnpm install` needed in the superproject.
3. UPDATE `packages/prometheus-entity-management/CHANGELOG.md` with a
   `1.3.1` entry describing the React 19 stability fix.
4. BUMP `packages/prometheus-entity-management/package.json` version
   from `1.3.0` to `1.3.1`.
5. COMMIT inside the submodule on its `main` branch with a fix(...)
   message that references the upstream pattern. Push to
   `git@github.com:Prometheus-AGS/prometheus-entity-management.git`.
6. PUBLISH to npm: `cd packages/prometheus-entity-management && npm publish`
   (uses the package's existing `publishConfig.access: public`).
7. COMMIT in the `hotseaters-ultimate` superproject: `git add
   packages/prometheus-entity-management` to bump the submodule
   pointer. CI will install the new submodule SHA.

## Out of scope
- Refactoring other hooks in the library (`useEntity`, `useEntityCRUD`,
  etc.) — they have separate snapshot semantics and aren't tripping
  the warning in this build.
- Upstreaming to any third-party package — this IS the upstream.
- The recharts `Maximum update depth` crash — handled by change-423
  AFTER this fix is verified.

## Tasks → see `tasks.md`.
