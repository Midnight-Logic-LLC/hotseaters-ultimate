# Tasks — change-S15

- [ ] T1. NEW `src/features/settings/stores/settings-store.ts`:
  - Zustand store with actions:
    - `getEntitySetting(key, entityId, scope)` — looks up `entity_setting` row in entity graph; if not found, fetches from Supabase `entity_setting` table joining `settings_type` on key
    - `upsertEntitySetting(key, entityId, scope, data)` — merges data with existing, calls `supabase.from('entity_setting').upsert(...)` with the appropriate FK column (`company_id`, `user_info_id`, or `document_template_id`) and `settings_type_id`
  - Import `supabase` from `@/shared/db/supabase` (RULE D)

- [ ] T2. NEW `src/features/settings/hooks/use-entity-setting.ts`:
  - `export function useEntitySetting<T extends Record<string, unknown>>(key: string, entityId: string | null, scope: 'company' | 'user_info' | 'document_template')`
  - Returns `{ data: T | null; isLoading: boolean; save: (patch: Partial<T>) => Promise<void> }`
  - `isLoading` is true until initial fetch resolves
  - `save` calls `upsertEntitySetting`, passing `{ ...data, ...patch }` (deep merge one level)
  - Returns `{ data: null, isLoading: false, save: noOp }` when `entityId` is null (not yet loaded)

- [ ] T3. NEW `src/features/settings/stores/__tests__/settings-store.spec.ts`:
  - Mock `supabase` client with `vi.mock`
  - Test `getEntitySetting` when no row: supabase returns empty array → store returns `null`
  - Test `upsertEntitySetting`: supabase called with correct `settings_type_id`, correct FK column, merged data

- [ ] T4. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- `useEntitySetting('user.preferences', userInfoId, 'user_info')` reads `data` JSONB from `entity_setting`
- `save({ hsh_decline_notifications: 'all' })` merges with existing preferences, does not delete other keys
- Hook follows RULE C (no Supabase import; calls store action only)
