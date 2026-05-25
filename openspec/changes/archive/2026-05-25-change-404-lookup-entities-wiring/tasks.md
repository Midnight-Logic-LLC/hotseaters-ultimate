# Tasks — change-404

- [ ] T1. NEW `src/features/lookups/entities.ts`. Use `registerEntityFromSql({ entityType, createTableSql })` for: PipelineStage, Service, ServiceCategory, MetadataType, SettingsType. Source SQL strings from `local-schema-common.sql` (created in change-403).
- [ ] T2. NEW `src/features/lookups/hooks/use-pipeline-stages.ts` — `useEntityList({ type: 'PipelineStage', where: { is_active: true }, orderBy: 'sort_order' })`. Variants `useSalesStages` (filters `type='sales'`), `useOperationsStages` (filters `type='operations'`).
- [ ] T3. NEW `src/features/lookups/hooks/use-services.ts`, `use-service-categories.ts`, `use-metadata-types.ts` (with `scope` filter param), `use-settings-types.ts`.
- [ ] T4. `src/app/app-router.tsx` — `import { registerLookupEntities } from '@/features/lookups/entities';` and call alongside existing registrations.
- [ ] T5. `src/features/dashboard/hooks/use-dashboard-aggregates.ts` — consume `useSalesStages()` for `dealsByStage` and weighted pipeline.
- [ ] T6. `src/features/dashboard/pages/dashboard-page.tsx` — Sales Pipeline binds to real stages.
- [ ] T7. NEW unit `use-pipeline-stages.spec.ts` — fixture graph snapshot → expected ordering.
- [ ] T8. NEW E2E `dashboard-pipeline-real-data.spec.ts` — seed two pipeline_stage rows, render dashboard, assert two bars with seed names.
- [ ] T9. CI grep gate: `git grep -i "Prospect\|Qualification" src/features/dashboard/` returns empty.
- [ ] T10. `pnpm typecheck && pnpm test && pnpm test:e2e` green.
