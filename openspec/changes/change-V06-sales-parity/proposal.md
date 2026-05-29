# change-V06 — Sales surface parity audit + authed VR

## Why
W4 shipped the sales pages. Prove per-page parity.

## What changes
Per-page RULE-0 audit + authed VR for: `/Clients`, `/Clients/:id`,
`/Clients/new`, `/DealTracker`, `/Sales`, `/LeadRadar`. Verify business rules
(tier multipliers, pipeline stage projections, lead-radar gating).

## Impact
Test + audit-ledger + baselines. Depends on V01 + V02.
