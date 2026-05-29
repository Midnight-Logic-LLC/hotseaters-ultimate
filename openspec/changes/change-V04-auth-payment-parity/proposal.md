# change-V04 — Auth/payment surface parity audit + VR

## Why
W2 shipped the auth/payment surface without per-page RULE-0 audit. Prove it.

## What changes
Per-page RULE-0 audit + VR for: `/Onboarding`, `/AcceptInvite`,
`/PaymentSuccess`, `/PaymentCancelled`, `/AccountDeactivated`,
`/pending-approval`, `/account-rejected`. Unauth routes use `bible-vs-port`
deployed drift; `/Onboarding` (if session-gated) uses `seedSession` baseline.

## Impact
Test + audit-ledger only. Depends on V01 + V02.
