# change-D01 — Deals-scope data layer

## Why

The bible's DealTracker reads `useDealsTrialsData({ scope: 'deals' })` — a
deals-scoped view over the **trial** entity (a "deal" is a trial at an early
pipeline stage). No `deal`/`opportunity` table exists or is needed: the port's
`trial` entity already carries `pipeline_stage_id` + `deal_document_id` and is
synced. This change builds the data seam the DealTracker/Sales surfaces consume,
over the existing trial entity. NO migration.

## What changes

1. NEW `src/features/deals/hooks/use-deals-trials-data.ts` — hook taking
   `{ scope: 'deals' | 'trials' }`, returning trials filtered/projected for the
   scope (deals = early pipeline stages per the bible), plus pipelineStages /
   services / consultants from `useTier1()`. Mirrors the bible hook's returned
   field names so downstream components port cleanly. RULE C (hooks → stores).
2. NEW `src/features/deals/stores/deals-store.ts` (if needed beyond the trial
   store) — deal-scope actions (stage transition, etc.). RULE D.
3. Confirm `trial` entity exposes all fields the deal surface needs; extend
   `entities.ts` only if a field is missing (no new table).
4. Tests: `use-deals-trials-data.spec.ts` — scope filtering + projection.

## Impact

App code (hooks/stores) + tests. No schema/migration. Depends on nothing.
