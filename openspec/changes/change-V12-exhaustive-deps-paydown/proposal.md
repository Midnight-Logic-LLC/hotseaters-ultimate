# change-V12 — Pay down react-hooks/exhaustive-deps warnings

## Why
The lint gate carries 37 `react-hooks/exhaustive-deps` warnings, clustered on
heavy ported pages (HSH projections, dashboard widgets). These are
correctness-adjacent (stale-closure risk). Pay them down while V03–V10 have
those pages open.

## What changes
Wrap derived arrays/objects in `useMemo`, hoist conditional initializers, and
correct dependency arrays per the warnings. Behavior must be preserved
(verify against VR + existing tests). No new abstractions.

## Impact
Production code (mechanical). Depends on V03–V10 (so fixes align with audited pages).
