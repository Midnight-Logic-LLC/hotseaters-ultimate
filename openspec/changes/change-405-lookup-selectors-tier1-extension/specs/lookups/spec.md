## ADDED Requirements

### Requirement: Lookup selectors project entity_metadata into typed arrays
The system SHALL ship `src/shared/db/lookups-selectors.ts` exporting pure `selectGraph` projections — `selectPipelineStages`, `selectServiceCategories`, `selectConsultantTiers`, `selectClientTypes` — that join `entity_metadata` rows to their `metadata_type` parent by `metadata_type_id`, scope-filter by the matching scope string, and tenant-filter so only system-wide rows (`company_id IS NULL`) and rows belonging to the active `companyId` are included.

#### Scenario: selectPipelineStages joins scope=pipeline_stage
- **WHEN** the graph contains a `metadata_type` row with `scope = "pipeline_stage"` and three `entity_metadata` children with that `metadata_type_id`, all `company_id = current` or `null`
- **THEN** `selectPipelineStages(graph, currentCompanyId)` returns three rows sorted by `(type, sort_order, name)` with `revenue_probability`, `is_active`, and `name` projected from each row's `extra`

#### Scenario: selectPipelineStages excludes other-tenant rows
- **WHEN** the graph also contains an `entity_metadata` row with `company_id = "other-company"`
- **THEN** that row does NOT appear in `selectPipelineStages(graph, currentCompanyId)`'s output

### Requirement: Tier1Provider surfaces lookup arrays as live context
`Tier1Provider` SHALL expose `pipelineStages`, `serviceCategories`, `consultantTiers`, `clientTypes` on the `Tier1Value` shape. Each is derived from the live entity-graph store via the corresponding selector with memoization so referential identity stays stable across unrelated graph changes.

#### Scenario: Tier1 consumer sees live lookup updates
- **WHEN** a component reads `useTier1().pipelineStages` and an `entity_metadata` row is upserted into the graph store
- **THEN** the consumer re-renders with the updated array within one React tick — without any explicit refetch
