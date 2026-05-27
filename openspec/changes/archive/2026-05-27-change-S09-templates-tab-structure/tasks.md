# Tasks — change-S09

- [ ] T1. Check if `DocumentTemplate` entity is registered in entity graph. Register if not (tableName: `document_template`).

- [ ] T2. NEW `src/features/company/components/templates-settings-tab.tsx`:
  - Read templates via entity graph (`useEntityList('DocumentTemplate')` filtered by company_id)
  - Group by `template_type` field
  - Template card: name + type badge + status badge (draft/published) + Edit button + Delete button (with AlertDialog confirm)
  - "New Template" button → dialog: enter name + select type → create template with empty content
  - Edit button → shows Card "Template editor coming soon in a future update" (placeholder)
  - No rich-text editor in this change

- [ ] T3. NEW `src/features/company/components/__tests__/templates-settings-tab.spec.tsx`:
  - Render with mock templates
  - Assert grouping by type
  - Assert create dialog opens on "New Template" click
  - Assert delete AlertDialog fires on Delete click

- [ ] T4. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- List view renders with mock data
- Create/delete work against entity graph
- Full editor deferred gracefully (placeholder message shown)
