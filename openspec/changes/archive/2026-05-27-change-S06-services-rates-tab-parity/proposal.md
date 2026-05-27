# change-S06 — Services & Rates tab full parity

## Why

The bible's `ServicesTab.jsx` (983 LOC) is the most complex settings tab. It
manages the full CRUD lifecycle for services and service categories, including
drag-and-drop reorder, inline editing, and a deactivate-vs-delete decision based
on whether a service is referenced by any TrialService entity.

This tab is critical to the Trials and Time & Expenses pages — both depend on
the service catalog to price work.

## What changes

1. NEW `src/features/company/components/services-settings-tab.tsx` (~700 LOC)
   - State: showServiceForm, editingService, showCategoryForm, editingCategory, collapsedGroups, inlineEditingCategoryId, inlineEditValue, inlineEditingServiceId, inlineEditServiceData, deleteCategoryConfirm, deleteServiceConfirm, showInactiveItems
   - Data: `services` + `serviceCategories` from `useTier1()` (Tier-1, already synced)
   - Tier-2: query `TrialService` by company_id (to detect "in use" before delete)
   - Category reorder: `@hello-pangea/dnd` DragDropContext + Droppable + Draggable (already in `package.json`)
   - Service CRUD: create/update via store actions; delete-or-deactivate logic
   - Grouped display: by category (collapsible chevron) + Uncategorized group
   - Inline category name editing
   - Inline service rate/description editing
   - AlertDialog for destructive actions (delete category with services, delete used service → deactivate)
   - "Show inactive items" toggle

2. NEW `src/features/company/components/service-form.tsx` (~100 LOC)
   - Port of `ServiceForm.jsx` — form fields: name, description, rate, unit, category_id, is_active
   - Used by the full-form add/edit modal flow

3. Data hooks needed (not yet in stores — create if missing):
   - `useServiceCRUD()` — create/update/delete/deactivate/reactivate Service
   - `useServiceCategoryCRUD()` — create/update/delete/reorder ServiceCategory

## Acceptance

- Can create, edit, reorder, deactivate services
- Can create, rename, reorder, delete categories
- Deleting a service used by a TrialService shows "deactivate instead" confirm
- Deleting a category with services prompts for confirmation
- DnD reorder persists (updates `order` field via store action)
- `showInactiveItems` toggle shows/hides inactive services
