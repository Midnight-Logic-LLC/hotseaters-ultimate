# Tasks — change-S06

- [ ] T1. Check if `Service` and `ServiceCategory` entities are registered in the entity graph; register if not. Check if store actions exist for CRUD; create if missing.

- [ ] T2. NEW `src/features/company/components/service-form.tsx`:
  - Port of `HotSeatersMVP/src/components/settings/ServiceForm.jsx`
  - Fields: name (required), description, rate (number), unit, category_id (select from available categories), is_active (switch)
  - Callbacks: `onSave(data)`, `onCancel()`

- [ ] T3. NEW `src/features/company/components/services-settings-tab.tsx`:
  - Import `DragDropContext, Droppable, Draggable` from `@hello-pangea/dnd`
  - Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle` from `@/components/ui/alert-dialog`
  - Local state for all UI state from bible (collapsedGroups, showInactiveItems, inline edits, confirm dialogs)
  - Tier-1: `{ services, serviceCategories } = useTier1()` — sorted categories by `order`
  - Tier-2: query TrialService for company_id to detect in-use services (fetch via store/hook)
  - Header row: "Services & Rates" title + "+ Add Service" button + "+ Add Category" button
  - Category group rendering: `DragDropContext onDragEnd` → updates category `order` via store
  - Per-category: collapsible header (ChevronDown), inline rename (Edit icon → input), delete (AlertDialog gate)
  - Per-service in category: GripVertical handle, name, rate, edit (pencil icon → inline edit), deactivate/delete (Trash2 icon → AlertDialog)
  - Uncategorized group below all categories
  - "Show inactive items" toggle at top
  - ServiceForm modal: rendered when `showServiceForm` or `editingService` is set

- [ ] T4. NEW `src/features/company/components/__tests__/services-settings-tab.spec.tsx`:
  - Render with mock services + categories in Tier1 context
  - Assert category groups render
  - Assert "Show inactive items" toggle hides/shows inactive services
  - Assert delete of in-use service shows "deactivate instead" text in AlertDialog
  - Assert inline category rename sets new name on confirm

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- Bible's deactivate-vs-delete logic preserved: `isUsed = trialServices.some(ts => ts.service_id === service.id)`; if isUsed → `deactivateService(id)`, else `deleteService(id)`
- DnD works for both category reorder and service reorder within category
- No `@tanstack/react-query` imports (use entity graph store pattern per RULE E)
- No `base44` imports
