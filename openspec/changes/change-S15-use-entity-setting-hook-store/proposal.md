# change-S15 — useEntitySetting hook + settings-store

## Why

Some settings are backed by `entity_setting` JSONB rows (e.g., `user.preferences`
for HSH decline notification prefs). Others are backed by `company.*` columns
(handled by the existing `useCompanySettings` hook). This change adds the
JSONB-backed path: a hook that reads/writes `entity_setting` rows.

This is a prerequisite for the HotSeatHub tab (S12) which writes to
`userInfo.preferences` JSONB, and for any future feature that registers a
settings type with its own JSONB schema.

## What changes

1. NEW `src/features/settings/stores/settings-store.ts`
   - Zustand store (follows RULE D: stores own all I/O)
   - `getEntitySetting(settingsTypeKey, entityId, entityScope)` — reads from graph or falls back to Supabase REST
   - `upsertEntitySetting(settingsTypeKey, entityId, entityScope, data)` — upserts to `entity_setting` via Supabase, then updates graph
   - Uses `supabase` client imported from `@/shared/db/supabase`

2. NEW `src/features/settings/hooks/use-entity-setting.ts`
   - `export function useEntitySetting<T extends Record<string, unknown>>(key: string, entityId: string, scope: 'company' | 'user_info' | 'document_template'): { data: T | null; isLoading: boolean; save: (patch: Partial<T>) => Promise<void> }`
   - Reads from `settings-store`; save merges patch with existing data and upserts

3. NEW `src/features/settings/stores/__tests__/settings-store.spec.ts`
   - Mock Supabase client
   - Test `getEntitySetting` → returns null when no row exists
   - Test `upsertEntitySetting` → calls Supabase upsert with correct constraint columns

## Acceptance

- `pnpm typecheck && pnpm lint && pnpm test` green
- `useEntitySetting('user.preferences', userInfoId, 'user_info')` reads `entity_setting` data JSONB
- Saving merges patch (does not clobber existing keys)
- Store follows RULE D (no direct Supabase calls in hooks or components)
