# change-S02 — Register SettingsType entity in graph + fix use-settings-types hook

## Why

`src/features/lookups/hooks/use-settings-types.ts` currently returns an empty
array. The `settings_type` table has 7 rows already seeded (company.billing,
company.branding, company.numbering, company.time_clock, document.page_settings,
user.google_calendar, user.preferences). Without entity registration, no hook
can query the type catalog.

`entity_setting` rows hold the actual JSONB data keyed by `settings_type_id`.
Both entities must be in the graph so settings data can be read from PGlite
and reacted to via Electric sync.

## What changes

1. NEW `src/features/settings/entities.ts`
   - `SettingsTypeEntity` interface: `{ id, key, label, entity_scope, json_schema, created_at }`
   - `EntitySettingEntity` interface: `{ id, settings_type_id, company_id|null, user_info_id|null, document_template_id|null, data: Record<string,unknown>, created_at, updated_at }`
   - `registerEntityJsonSchema('SettingsType', { tableName: 'settings_type', ... })`
   - `registerEntityJsonSchema('EntitySetting', { tableName: 'entity_setting', ... })`

2. MODIFY `src/features/lookups/hooks/use-settings-types.ts`
   - Wire to `useEntityList('SettingsType')` from the entity graph
   - Return typed `SettingsTypeEntity[]` instead of `[]`

3. NEW `src/features/settings/hooks/use-settings-type-by-key.ts`
   - `useSettingsTypeByKey(key: string)` — convenience hook returning the single `SettingsTypeEntity` matching the key, or `undefined`

4. NEW `src/features/settings/entities.spec.ts`
   - Verify both entities register without throwing
   - Verify `useSettingsTypeByKey('company.billing')` returns the matching row from a graph fixture

## Acceptance

- `pnpm typecheck && pnpm lint && pnpm test` green
- `useSettingsTypes()` returns 7 rows when entity graph is populated from DB
