# change-V07 — Operations surface parity audit + authed VR

## Why
W5 shipped the operations pages. Prove per-page parity.

## What changes
Per-page RULE-0 audit + authed VR for: `/Trials`, `/trials/:id`,
`/trials/:id/edit`, `/Timeline`, `/TimeAndExpenses`, `/Team`. Verify time
rounding rules, daily-minimum hours, time-entry available-services logic.

## Impact
Test + audit-ledger + baselines. Depends on V01 + V02.
