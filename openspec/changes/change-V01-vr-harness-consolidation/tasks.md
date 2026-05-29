# Tasks — change-V01

- [ ] T1. Read `bible-vs-port.spec.ts` + `bible-parity.config.ts` + `RUNBOOK.md` end-to-end.
- [ ] T2. Extend `PATHS` in `bible-vs-port.spec.ts` with `/Landing`, `/Pricing`, `/PrivacyPolicy`, `/TermsOfService`, `/ReferralLanding`.
- [ ] T3. Run `pnpm test:bible-parity` — confirm all unauth surfaces produce `drift.json` at desktop + mobile.
- [ ] T4. Update `tests/visual-parity/RUNBOOK.md` with the two-mechanism model + authed-baseline capture steps.
- [ ] T5. Add a "Enabling the pre-commit gate" section to `docs/RUNBOOKS.md`.
- [ ] T6. `pnpm typecheck && pnpm lint` green.
