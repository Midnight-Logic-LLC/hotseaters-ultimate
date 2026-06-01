# change-S05 — settings + company-config local reads

## Why
`settings-store.ts` (settings_type, entity_setting) and `company-store.ts`
services/team/tiers REST-fetch on mount.

## What changes
Convert `settings_type` + `entity_setting` and company `service`/team reads to
local `useLiveQuery`. Resolve the v0.1 `entity_setting` gap (only company-owned
rows synced): either close it (split shapes per owner FK) or document
user/template-owned settings as remaining REST. Handle `tier` per the S02
decision.

## Impact
`src/features/settings/stores/*`, `src/features/company/stores/*`. Depends on
S02. RULE B/C/D.
