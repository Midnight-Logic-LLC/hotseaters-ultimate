# change-V08 — Billing surface parity audit + authed VR

## Why
W6 shipped the billing pages (Approvals rewrite, Invoices, Bills, Collections).
Prove per-page parity.

## What changes
Per-page RULE-0 audit + authed VR for: `/Approvals`, `/Invoices`, `/Bills`,
`/Collections`. Verify invoice-period bucketing, retainer formula, collection
aging. Note: `bills-page.tsx` was touched in the lint-gate fix — re-verify its
collapse-section behavior unchanged.

## Impact
Test + audit-ledger + baselines. Depends on V01 + V02.
