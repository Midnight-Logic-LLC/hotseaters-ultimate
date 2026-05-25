# Tasks — change-405

- [x] T1. NEW `src/shared/db/lookups-selectors.ts`:
  - `type LookupRow` covering the shared fields (`id`, `name`, `extra`, computed `type` / `revenue_probability`, etc.).
  - `selectPipelineStages(graph, companyId)`, `selectServiceCategories`, `selectConsultantTiers`, `selectClientTypes`. Each is a pure function: takes the `GraphState` snapshot + `companyId`, returns the projected array. No I/O.
  - Each selector joins `entity_metadata` (type `'EntityMetadata'`) to its parent `metadata_type` row by `metadata_type_id`, scope-filters by the matching string (`'pipeline_stage'` etc.), then tenant-filters (system rows + active company).
- [x] T2. NEW `src/shared/db/__tests__/lookups-selectors.spec.ts`. For each selector: seed a fixture graph snapshot covering (a) system row, (b) active-company row, (c) other-company row (must be excluded), (d) deactivated row (`is_active=false` still surfaces — the widget filters in its hook). Verify sort order: `pipelineStages` sorts by `(type, sort_order, name)`; others by `(sort_order, name)`.
- [x] T3. MODIFY `src/app/tier1-provider.tsx`:
  - Extend `Tier1Value` with the four new arrays.
  - Use `useGraphStore(useShallow((s) => ({ entities: s.entities })))` + `useMemo` to compute each projection. Pass `companyId` from the existing `useCurrentCompany()` result.
- [x] T4. NEW or MODIFY `src/app/__tests__/tier1-provider.spec.tsx`. Render `<Tier1Provider>` with a graph fixture; assert each lookup array's length + ordering; then upsert a new `entity_metadata` row in the store and assert the consumer re-renders with the new entry.
- [x] T5. Hook surface check: ensure `useTier1()` consumers in the existing codebase still type-check (no API breakage — pure additions).
- [x] T6. `pnpm typecheck && pnpm lint && pnpm test` green.

## Acceptance

- `useTier1().pipelineStages` returns the live list at component mount.
- Mutating an `entity_metadata` row in the graph (via Electric or hand
  upsert) updates the consumer view without a refetch.
- `pnpm test src/shared/db/__tests__/lookups-selectors.spec.ts`
  + `pnpm test src/app/__tests__/tier1-provider.spec.tsx` green.
- No file outside `shared/db/` or `app/` modified.
