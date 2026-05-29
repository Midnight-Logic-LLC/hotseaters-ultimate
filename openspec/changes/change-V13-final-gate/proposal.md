# change-V13 — Final gate

## Why
Close the phase: prove the whole port is at parity and green.

## What changes
No source changes (or only what the final run surfaces). Run and record:
- `pnpm typecheck && pnpm lint && pnpm test` green.
- `pnpm test:bible-parity` ≤5% drift on every unauth surface (desktop + mobile).
- `pnpm test:visual-parity` passes on every authed surface (desktop + mobile).
- Lighthouse a11y ≥90 on Dashboard, Landing, Settings.
- Every bible app surface has a PASS (or accepted-deviation) RULE-0 audit note.

## Impact
Verification + report. Depends on V11 + V12.
