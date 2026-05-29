# change-V09 — HotSeatHub surface parity audit + authed VR

## Why
W7 shipped the HSH pages. Prove per-page parity. This surface carries the
heaviest `exhaustive-deps` warning cluster (projections), feeding V12.

## What changes
Per-page RULE-0 audit + authed VR for: `/PotentialGigs`, `/HelpWanted`,
`/HSHDirectory`, `/HotSeatHubMarketing`, `/Projections`. Verify profit-margin
calc, decline-prefs, travel-rate logic. Flag exhaustive-deps sites for V12.

## Impact
Test + audit-ledger + baselines. Depends on V01 + V02.
