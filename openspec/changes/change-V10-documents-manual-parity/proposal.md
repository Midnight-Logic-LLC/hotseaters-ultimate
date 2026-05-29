# change-V10 — Documents + Manual surface parity audit + VR

## Why
W8 shipped Manual + document pages. Prove per-page parity. Confirm the manual
pages honor RULE 7 (`/manual/<slug>` content, not hand-built React doc pages).

## What changes
Per-page RULE-0 audit + VR for: `/UserManual` + the 6 manual pages
(ManualBilling/Company/HSH/Operations/Sales/TimeExpenses), `/SignDocument`,
`/ViewDocument`. Verify e-sign flow + document render parity.

## Impact
Test + audit-ledger + baselines. Depends on V01 + V02.
