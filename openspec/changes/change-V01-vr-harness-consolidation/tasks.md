# Tasks — change-V01

- [x] T1. Read `bible-vs-port.spec.ts` + `bible-parity.config.ts` + `RUNBOOK.md` end-to-end.
- [x] T2. Extend `PATHS` in `bible-vs-port.spec.ts` with `/Landing`, `/Pricing`, `/PrivacyPolicy`, `/TermsOfService`, `/ReferralLanding`.
- [x] T3. Run `pnpm test:bible-parity` — all unauth surfaces produced `drift.json` at desktop + mobile (9 pass, 11 over-gate findings → `_DRIFT-BACKLOG.md`).
- [x] T4. Update `tests/visual-parity/RUNBOOK.md` with the two-mechanism model + authed-baseline capture steps.
- [x] T5. Add the "Enable the local pre-commit gate" section (R-14) to `docs/RUNBOOKS.md`.
- [x] T6. `pnpm typecheck && pnpm lint` green.
