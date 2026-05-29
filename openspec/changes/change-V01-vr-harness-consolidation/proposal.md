# change-V01 — VR harness consolidation

## Why

The visual-parity harness already exists and is more capable than the phase
assessment assumed, but it is fragmented and under-documented:

- `tests/visual-parity/specs/bible-vs-port.spec.ts` does live
  deployed-vs-deployed pixelmatch drift but only covers **5 unauth surfaces**
  (`/`, `/login`, `/accept-invite`, `/pending-approval`, `/account-rejected`).
- Per-page `toHaveScreenshot` specs (dashboard/clients/trials/settings) cover
  authed surfaces but only 4 of ~20.
- The capture/refresh workflow lives in `RUNBOOK.md` but the
  deployed-vs-deployed vs committed-baseline distinction is not spelled out, so
  the prior phase wrongly believed VR was blocked on a local bible server.

This change consolidates and documents the harness so V03–V10 can extend it
mechanically rather than each re-deciding the approach.

## What changes

1. EXTEND `bible-vs-port.spec.ts` `PATHS` to all **unauth** bible surfaces:
   add `/Landing`, `/Pricing`, `/PrivacyPolicy`, `/TermsOfService`,
   `/ReferralLanding`. (Authed surfaces stay on the `toHaveScreenshot` +
   `seedSession` path — you cannot seed a session on the deployed bible domain.)

2. UPDATE `tests/visual-parity/RUNBOOK.md` to document the two-mechanism model:
   - Deployed-vs-deployed drift (`bible-vs-port`, no baselines) → unauth.
   - Committed-baseline `toHaveScreenshot` (`seedSession`) → authed.
   - How to capture authed baselines from the local bible app, once.

3. RECORD the pre-commit-hook enablement as a tracked instruction in
   `docs/RUNBOOKS.md` (the hook itself is `.git/`-local and cannot be
   committed; the *instruction* to enable it must be discoverable).

## Impact

- No production code changes; test infrastructure + docs only.
- Unblocks V03–V10 to extend rather than rebuild.
