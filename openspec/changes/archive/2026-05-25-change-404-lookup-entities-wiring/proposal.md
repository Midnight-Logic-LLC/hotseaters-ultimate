# change-404 — lookup entities + dashboard wiring

## Why
Reference data (`pipeline_stage`, `service`, `service_category`,
`metadata_type`, `settings_type`) is not registered with the entity graph.
The Dashboard's Sales Pipeline card has no real stages to bind against.
prometheus-entity-management v1.3's `registerEntityFromSql` lets us
generate schemas from the same SQL that creates the table — no hand-written
JSON Schemas.

## What changes
1. NEW `src/features/lookups/entities.ts` — register PipelineStage,
   Service, ServiceCategory, MetadataType, SettingsType via
   `registerEntityFromSql`.
2. NEW `src/features/lookups/hooks/` — `use-pipeline-stages`,
   `use-sales-stages`, `use-operations-stages`, `use-services`,
   `use-service-categories`, `use-metadata-types`, `use-settings-types`.
3. `src/app/app-router.tsx` — call `registerLookupEntities()` alongside
   the existing two.
4. `src/features/dashboard/hooks/use-dashboard-aggregates.ts` — consume
   `useSalesStages()` for weighted pipeline computation.
5. `src/features/dashboard/pages/dashboard-page.tsx` Sales Pipeline card
   binds to real stages.

## Out of scope
- Refactoring every selector currently using hardcoded options
  (separate cleanup PR).

## Tasks → see `tasks.md`.
