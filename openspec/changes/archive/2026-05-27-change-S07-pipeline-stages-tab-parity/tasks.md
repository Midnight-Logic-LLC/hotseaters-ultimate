# Tasks — change-S07

- [ ] T1. Verify `pipelineStages` is available from `useTier1()` (landed in change-405). If the selector already projects `metadata_type` scope=pipeline_stage, reuse it. Otherwise extend the Tier1 selector.

- [ ] T2. Create `usePipelineStageCRUD()` hook (if not already in stores):
  - `createStage(name, color)` — creates `metadata_type` row with scope=pipeline_stage, company_id, color in extra JSONB
  - `updateStage(id, patch)` — updates name/color/sort_order
  - `deleteStage(id)` — deletes; store must first count deals in that stage

- [ ] T3. NEW `src/features/company/components/pipeline-settings-tab.tsx`:
  - Import `DragDropContext, Droppable, Draggable` from `@hello-pangea/dnd`
  - Import `AlertDialog*` for delete confirmation
  - State: `editingStageId`, `addingStage` (bool), `newStageName`, `newStageColor`, `deleteConfirm`
  - Read `pipelineStages` from `useTier1()`
  - `onDragEnd`: recompute `sort_order` for all stages, call `updateStage` for each affected row
  - Stage row: GripVertical drag handle + color swatch (click → color picker popover) + name (click → inline input) + Delete button (Trash2)
  - Color picker: grid of 12 preset colors + hex input field
  - "Add Stage" button at bottom → inline add form
  - Delete confirmation: AlertDialog with deal count ("This stage has X active deals. Moving them to...") — query deal count from entity graph
  - Cannot delete when only 1 stage remains

- [ ] T4. NEW `src/features/company/components/__tests__/pipeline-settings-tab.spec.tsx`:
  - Render with mock pipeline stages from Tier1
  - Assert stage list renders
  - Assert delete button on last stage is disabled
  - Assert delete with deals → AlertDialog with count message

- [ ] T5. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- `sort_order` updated on DnD drop
- Color swatch reflects saved color
- Delete gate: 1 stage remaining → delete disabled
- Delete with deals: AlertDialog shown with correct count
