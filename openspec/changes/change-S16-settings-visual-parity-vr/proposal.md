# change-S16 — Settings visual parity screenshots + VR baseline

## Why

Per RULE 0.1, every page must be screenshot-compared against the bible at
1440×900 and 375×667 before being declared done. With all 12 tabs implemented
and wired, S16 captures the baselines and produces the verification specs.

## What changes

1. NEW `tests/visual-parity/specs/settings-company.spec.ts`
   - Navigate to `/Settings?tab=company` authenticated as owner
   - Screenshot at 1440×900 → compare against bible `/Settings?tab=company`
   - Screenshot at 375×667 (mobile)

2. NEW `tests/visual-parity/specs/settings-billing.spec.ts` (same pattern for billing tab)

3. NEW `tests/visual-parity/specs/settings-services.spec.ts`

4. NEW `tests/visual-parity/specs/settings-pipeline.spec.ts`

5. Spot-check remaining tabs: time_tracking, tiers, templates (these are lower visual-risk)

6. UPDATE `tests/visual-parity/README.md` — document the Settings baseline capture process

## Acceptance

- All captured VR specs pass at ≤5% pixel drift
- Screenshots committed as baselines in `tests/visual-parity/screenshots/settings/`
- No broken page renders (all tabs load without JS errors)
- Lighthouse a11y ≥ 90 on `/Settings` page (keyboard navigation, ARIA on tabs)
