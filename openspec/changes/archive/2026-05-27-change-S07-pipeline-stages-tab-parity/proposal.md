# change-S07 — Pipeline Stages tab full parity

## Why

The bible's `PipelineStageManagement.jsx` (764 LOC) lets users add, rename,
reorder (DnD), recolor, and delete pipeline stages. The port currently has a
placeholder. The `metadata_type` table now has 6 pipeline stage rows seeded
(Active, Interviewing, Offer Extended, Hired, Not a Fit, + legacy Active UUID).

Pipeline stages are referenced by Deals throughout the app — deleting a stage
that has active deals must warn the user.

## What changes

1. NEW `src/features/company/components/pipeline-settings-tab.tsx`
   - DnD reorder of stages
   - Add stage: name + color picker
   - Edit stage: inline name + color
   - Delete stage: AlertDialog showing deal count in that stage (if any)
   - Color picker: a grid of preset colors + custom hex input
   - Default stage indicator (cannot delete the last active stage)
   - All via `usePipelineStages()` from Tier1 + `usePipelineStageCRUD()` store hook

## Acceptance

- DnD reorder saves `sort_order` to `metadata_type` via store
- Color change saves immediately
- Delete with deals in stage → confirmation showing count
- Cannot delete the last pipeline stage
