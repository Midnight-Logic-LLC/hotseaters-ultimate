# Tasks — change-S05

- [x] company row read → CONVERTED: `use-company-settings.ts` dropped `useEntity({ type:'Company', fetch: fetchCompanyById })` for `useCompanyRow` (synced `company` view, Pattern 4). Removed orphaned `fetchCompanyById` from company-store.
- [x] user_info role read → CONVERTED: `use-current-roles.ts` dropped `useEntity({ type:'UserInfo', fetch: fetchUserInfoById })` for `useTierAById('user_info', id)`. Removed orphaned `fetchUserInfoById` + `fetchCompanyById` from auth-store.
- [x] company team read → already local (`use-team.ts` uses useTierAQuery; `fetchTeamForCompany` is dead — left in place, surgical rule).
- [x] use-current-user / use-current-company → already local (useTierAById / useCompanyRow); no change needed.
- [x] settings_type / entity_setting reads → LEFT REST (documented). settings-store is a stateful per-key cache keyed on settings_type_id + owner FK. It depends on (a) `settings_type` global lookup and (b) user/template-owned `entity_setting` rows — BOTH deliberately DEFERRED in S02. Converting requires that deferred sync first; out of S05 safe scope.
- [x] Removed dead REST read-fetchers I orphaned: auth-store.fetchUserInfoById, auth-store.fetchCompanyById, company-store.fetchCompanyById.
- [x] 2nd-visit network reads = 0 for company settings + role derivation (now local). Settings panel (entity_setting) still REST by design pending deferred sync.
- [x] UI / behaviour parity: role derivation, generalSettings projection, save/saveSettings/uploadLogo unchanged.
- [x] `pnpm typecheck` clean; `pnpm eslint src/features/auth src/features/company` clean (boundaries RULE B/C/D); 102/102 auth+company tests pass.

## Notes
- company-store.fetchUserInfoById and company-store.fetchTeamForCompany remain
  (pre-existing dead code unrelated to my change — left per surgical rule;
  candidates for a future dead-code sweep / S07 note).
- settings-store full conversion is a natural follow-on once the deferred
  settings_type + per-owner entity_setting sync lands (S02 v0.2 note).
