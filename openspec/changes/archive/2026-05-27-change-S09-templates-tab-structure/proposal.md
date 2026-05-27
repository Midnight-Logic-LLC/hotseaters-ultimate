# change-S09 — Templates tab — structure + list view

## Why

The bible's `DocumentTemplateManagement` component is a complex rich-text
document editor. The full editor (quill, section editors, placeholder menus)
is deferred to a future document management wave. However, the list view
(template cards: name, type, status, edit/delete buttons) and the
template-type grouping structure must ship now so the Settings page is
functionally complete.

## What changes

1. NEW `src/features/company/components/templates-settings-tab.tsx`
   - List view: document templates grouped by type (client contract, invoice, etc.)
   - Create/rename/delete template (no content editing yet — opens a placeholder "Edit content coming soon")
   - Status badge (draft/published)
   - `PublishSeedDefaultsButton` is part of the page header (S01), not this tab — no duplication needed

2. `DocumentTemplate` entity must be registered if not yet (check existing entities)

## Acceptance

- Template list renders
- Create/rename/delete work
- "Edit" button shows a "Coming soon" placeholder (full editor in future wave)
- Typecheck green
