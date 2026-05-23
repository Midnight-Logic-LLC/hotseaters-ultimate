# `src/features/company/` — company settings + team feature

## Hard constraints

1. **Self-hosted Supabase only.** (RULE 1.)
2. **HotSeatersMVP is the bible.** (RULE 2.) See
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Settings.jsx`
   and `pages/Team.jsx`.
3. **Components → hooks → stores → APIs.** (RULE 3.)

## Responsibility

- Owns `/Settings`, `/settings/company`, `/Team` pages.
- Owns invite-member orchestration (`send-invitation` Edge Function call).
- Owns the live theme editor — writes to `company.theme` JSONB and applies
  via `shared/lib/theme#applyThemeVars`.

## Layer map

Same architecture rules as `features/auth/`. The company store talks to
Supabase directly; hooks call the store; components only see hooks.

## Hooks contract

- `useCompanySettings(companyId)` — entity-graph-backed company row plus a
  save() that calls the company-store `updateCompany` action.
- `useTeam(companyId)` — list of `user_info` rows for the tenant, plus
  `invite()` and `updateMember()` actions.

## Business rules

- `seed-company.ts` — `isSeedCompany`, `isSeedSuperadmin`,
  `buildSeedCompanyRow`, `DEFAULT_TENANT_SETTING_KEYS`. Pure.
- `ensure-lead-for-attorney.ts` — pure decision returning a
  `LeadCreateInstruction | LeadExistsResult | NoOpResult`. The Lead entity
  feature, when it lands, will be the side-effect executor.

## Self-hosted Supabase only. HotSeatersMVP is the bible.
