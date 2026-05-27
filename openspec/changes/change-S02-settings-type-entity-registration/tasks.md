# Tasks — change-S02

- [ ] T1. NEW `src/features/settings/entities.ts`:
  - `export interface SettingsTypeEntity { id: string; key: string; label: string; entity_scope: 'company' | 'user_info' | 'document_template'; json_schema: Record<string, unknown> | null; created_at: string; }`
  - `export interface EntitySettingEntity { id: string; settings_type_id: string; company_id: string | null; user_info_id: string | null; document_template_id: string | null; data: Record<string, unknown>; created_at: string; updated_at: string; }`
  - Call `registerEntityJsonSchema('SettingsType', { tableName: 'settings_type', idField: 'id', ... })` — use same registration pattern as other entities in this codebase
  - Call `registerEntityJsonSchema('EntitySetting', { tableName: 'entity_setting', idField: 'id', ... })`

- [ ] T2. MODIFY `src/features/lookups/hooks/use-settings-types.ts`:
  - Import `SettingsTypeEntity` from `@/features/settings/entities`
  - Replace stub `return []` with `useEntityList<SettingsTypeEntity>('SettingsType')`
  - Return `{ settingsTypes: SettingsTypeEntity[]; isLoading: boolean }`

- [ ] T3. NEW `src/features/settings/hooks/use-settings-type-by-key.ts`:
  - `export function useSettingsTypeByKey(key: string): SettingsTypeEntity | undefined`
  - Uses `useSettingsTypes()` and `.find(t => t.key === key)`

- [ ] T4. NEW `src/features/settings/entities.spec.ts`:
  - Import and call both `registerEntityJsonSchema` calls — assert no throw
  - Render hook fixture: seed graph with one `SettingsType` row for `company.billing`
  - Assert `useSettingsTypeByKey('company.billing')` returns the seeded row

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- `useSettingsTypes()` no longer returns empty array when graph is populated
- Both entities appear in the graph registry (`SettingsType`, `EntitySetting`)
- TypeScript: no implicit `any` on `json_schema` or `data` fields (use `Record<string, unknown>`)
