# change-V05 — App core parity audit + authed VR

## Why
W3 + Wave S shipped the app core. Prove per-page parity for the most-used screens.

## What changes
Per-page RULE-0 audit + authed `toHaveScreenshot` VR (seedSession owner) for:
`/Dashboard`, `/MobileMore`, `/Settings` (all 12 tabs). Capture committed
baselines from the local bible app. Settings tabs audited individually.

## Impact
Test + audit-ledger + committed baselines. Depends on V01 + V02.
Blocker: needs bible app run locally once to capture authed baselines.
