## ADDED Requirements

### Requirement: Lookup selectors project MetadataType by scope into typed arrays
The system SHALL ship `src/shared/db/lookups-selectors.ts` exporting pure projections — `selectPipelineStages`, `selectServiceCategories`, `selectConsultantTiers`, `selectClientTypes` — over the `MetadataType` slice of the entity-graph store. Each selector scope-filters by the matching string (`pipeline_stage` / `service_category` / `consultant_tier` / `client_type`), tenant-filters so only system-wide rows (`company_id IS NULL`) and rows belonging to the active `companyId` are admitted, lifts well-known fields out of `extra_schema` (e.g. `type`, `revenue_probability`), and sorts the result.

#### Scenario: selectPipelineStages filters by scope and tenant
- **WHEN** the graph contains four `MetadataType` rows: row A `scope=pipeline_stage company_id=current`, row B `scope=pipeline_stage company_id=null`, row C `scope=pipeline_stage company_id=other`, row D `scope=service_category company_id=current`
- **THEN** `selectPipelineStages(entities, currentCompanyId)` returns exactly rows A and B in order `[order ASC, name ASC]`, and row D is absent

#### Scenario: selectPipelineStages lifts revenue_probability out of extra_schema
- **WHEN** a `MetadataType` row has `extra_schema = { type: 'sales', revenue_probability: 0.7 }`
- **THEN** the selector projection for that row exposes `type: 'sales'` and `revenue_probability: 0.7` as top-level fields on the returned record

### Requirement: Tier1Provider surfaces lookup arrays as live context
`Tier1Provider` SHALL expose `pipelineStages`, `serviceCategories`, `consultantTiers`, `clientTypes` on the `Tier1Value` shape. Each is derived from the live entity-graph store via the corresponding selector with memoization so referential identity stays stable when unrelated graph entities update.

#### Scenario: Tier1 consumer sees live lookup updates
- **WHEN** a component reads `useTier1().pipelineStages` and a `MetadataType` row with `scope=pipeline_stage` is upserted into the graph store
- **THEN** the consumer re-renders with the updated array within one React tick — no explicit refetch

#### Scenario: Referential stability for unrelated changes
- **WHEN** an `EntityMetadata` row (different entity type) is upserted into the graph
- **THEN** `useTier1().pipelineStages` returns the same array reference as the prior render — it does NOT re-create the array
