# Tasks — change-S16

- [ ] T1. Ensure dev server + local Supabase stack running. Authenticate as owner user.

- [ ] T2. NEW `tests/visual-parity/specs/settings-company.spec.ts`:
  - `test('Settings Company tab - 1440x900', ...)` → screenshot → compare vs baseline
  - `test('Settings Company tab - 375x667', ...)` → screenshot mobile

- [ ] T3. NEW `tests/visual-parity/specs/settings-billing.spec.ts`

- [ ] T4. NEW `tests/visual-parity/specs/settings-services.spec.ts`

- [ ] T5. NEW `tests/visual-parity/specs/settings-pipeline.spec.ts`

- [ ] T6. NEW `tests/visual-parity/specs/settings-tabs-smoke.spec.ts`:
  - Iterate all 12 tab IDs for the admin user
  - Navigate to `?tab=<id>` for each → assert no console errors → snapshot

- [ ] T7. Run `pnpm lh -- /Settings` → assert a11y score ≥ 90

- [ ] T8. Commit baselines: `tests/visual-parity/screenshots/settings/`

- [ ] T9. UPDATE `tests/visual-parity/README.md` with Settings baseline instructions

- [ ] T10. `pnpm typecheck && pnpm test` green

## Acceptance

- All VR specs pass at ≤5% drift vs bible screenshots
- No console JS errors on any settings tab
- Lighthouse a11y ≥ 90
- Mobile layout (375×667) renders without horizontal overflow
