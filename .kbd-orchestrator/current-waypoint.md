# Current waypoint — hotseaters-ultimate

**Phase:** `dashboard-bible-parity-build` (regression round B)
**Status:** planned (ready to execute)
**Change backend:** OpenSpec (`openspec/` at repo root)
**Prologue commit:** `28808a7` (Phase A — business rules, landed)
**Round-A changes (LANDED + DONE):** `change-405..409`
**Round-B changes (READY):** `change-420..424`

## What's next

Dispatch `change-420-entity-mgmt-memoize-useEntityList-submodule-fix`
(the keystone). This is the 1-line library fix at
`packages/prometheus-entity-management/src/hooks.ts` `useEntityList`
return → `useMemo` wrap. Rebuild via the submodule's own `pnpm build`,
test in browser, then version-bump (1.3.0 → 1.3.1) + `npm publish` +
superproject submodule SHA bump.

After 420 verifies clean console:
1. Dispatch 421 (Card primitive bible tokens).
2. Dispatch 422 (Welcome header parity — trivial).
3. **Gate**: re-test `/Dashboard` console + Network. Then:
   - Dispatch 423 (recharts no-op OR submodule) based on observation.
   - Dispatch 424 (Team Members diagnostic + targeted fix) based on
     observation.

## Why round B

`progress.json` showed `execution_complete: true` after round A
(405–409), but post-deploy testing surfaced four real regressions
the user demanded be fixed before reflecting:

1. Recharts `Maximum update depth` crash inside
   `<ChartDataContextProvider>` (page-breaking).
2. `getSnapshot should be cached` warning regressed (root cause:
   prior fix landed in the wrong directory — see `assessment.md` §A.1).
3. Card chrome diverges from the bible (hard ring vs soft border).
4. Quick Stats → Team Members shows 0 vs bible's 2 for the same user.

Round B addresses all four. See `assessment.md` for the full root-cause
analysis and `plan.md` for the executable change list.

## Sequencing reminder

Round B changes are strictly sequential per wave. 423 and 424 are
**gated on observation** after 420–422 land — we don't pre-decide
their final shape because §A.1's keystone fix may resolve them as a
side-effect.
