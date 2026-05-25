# change-405 — Lookup selectors + Tier1 extension

## Why
Phase A of the dashboard rebuild landed in commit `28808a7` — 7 pure
business-rule modules + 70 tests that every widget will compose. The
next blocker is **lookup data plumbing**: widgets need
`pipelineStages`, `serviceCategories`, `consultantTiers`, `clientTypes`
as live, normalized arrays — not raw `entity_metadata` rows.

Bible's `Tier1DataContext` surfaces 9 entities to every page; the
ultimate port already exposes `userInfo`, `company`, `role` via
`Tier1Provider`. The remaining four lookups are already Tier-A
(`metadata_type`, `entity_metadata` flow through Electric → PGlite →
graph), but no `selectGraph` projection exists that scope-filters
them into the per-feature shape the bible expects.

## What changes
1. NEW `src/shared/db/lookups-selectors.ts` — memoized `selectGraph`
   projections built on the existing entity-graph contents:
   - `selectPipelineStages(graph, companyId)` →
     `Array<{ id, name, type: 'sales'|'operations'|''|, revenue_probability, is_active, sort_order, ... }>`
     from `entity_metadata` rows whose `metadata_type.scope =
     'pipeline_stage'`. Result sorted by `(type, sort_order, name)`.
   - `selectServiceCategories(graph, companyId)` — same pattern,
     `scope = 'service_category'`.
   - `selectConsultantTiers(graph, companyId)` — `scope =
     'consultant_tier'`.
   - `selectClientTypes(graph, companyId)` — `scope = 'client_type'`.
   - Each projection drops rows where `company_id` is neither
     `null` (system-wide) nor the active `companyId` (defensive — the
     Electric shape already filters, but the projection is the place
     where shape changes are forgiving).
2. NEW `src/shared/db/__tests__/lookups-selectors.spec.ts` — for each
   selector: seed a fixture graph snapshot, assert sort order, scope
   filter, and `company_id` defensiveness.
3. MODIFY `src/app/tier1-provider.tsx`:
   - Add `pipelineStages`, `serviceCategories`, `consultantTiers`,
     `clientTypes` to `Tier1Value`.
   - Source them via `useGraphStore(useShallow(...))` calling the four
     selectors against the live store + `companyId` from
     `useCurrentCompany()`.
   - Memoize the projections so referential identity is stable between
     unrelated graph changes (bibles's `useMemo` pattern at
     `Tier1DataContext.jsx:63-73`).
4. MODIFY/NEW `src/app/__tests__/tier1-provider.spec.tsx` — assert
   that mutating an `entity_metadata` row in the graph triggers a
   re-render of the consumer with the new value.

## Out of scope
- The dashboard widget hooks (change-406).
- Migrating consumers of the deprecated raw-SQL hooks (change-408).
- Lookup-cache tier with ETag refresh (`pglite-schema-strategy-offline-first`
  change-416, deferred).

## Tasks → see `tasks.md`.
