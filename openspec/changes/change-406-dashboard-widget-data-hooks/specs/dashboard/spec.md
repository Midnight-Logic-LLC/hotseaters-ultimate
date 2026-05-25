## ADDED Requirements

### Requirement: Per-widget data hooks compose business rules
Each dashboard widget SHALL have a dedicated hook in `src/features/dashboard/hooks/use-*.ts` that owns its own `useEntityList` / `useEntityView` subscription and composes the pure business-rule modules in `src/features/dashboard/business-rules/`. No hook recomputes a calculation that exists in `business-rules/`; every numeric output flows through those modules.

#### Scenario: usePipelineSummary returns bible-matched weighted value
- **WHEN** the graph contains two `Trial` rows in sales stages — deal A `estimated_value=100000` in a stage with `revenue_probability=0.5`, deal B `estimated_value=50000` in a stage with `revenue_probability=0.2`
- **THEN** `usePipelineSummary({ now })` returns `{ pipelineValue: 150000, weightedValue: 60000, dealCount: 2 }`

#### Scenario: useTeamWeek folds in HSH subcontractors
- **WHEN** the graph contains two active `UserInfo` consultants + one `SubcontractAssignment` with `consultant_id` that authored time entries in the active week
- **THEN** `useTeamWeek({ now })` returns a 3-row array with the subcontractor row carrying `isHsh: true`

### Requirement: Hybrid-mode hooks fall back to REST for non-synced entities
Hooks targeting entities not in `SYNC_CONFIG` (`invoice`, `time_entry`, `subcontract_assignment`, `subcontract_request`, `lead`, `sales_activity`, `attorney`) SHALL use `useEntityView` with `mode: 'hybrid'` and a Supabase REST `remoteFetch`. When the offline-first phase later adds these to `SYNC_CONFIG`, the hooks SHALL auto-promote to local-only completeness without code change.

#### Scenario: Invoice-backed hook fires REST when graph is empty
- **WHEN** the entity graph has no `Invoice` rows AND `useRecentActivity()` mounts
- **THEN** the hook fires its `remoteFetch` against Supabase REST AND, on response, the result lands in the graph store keyed by the hook's `baseQueryKey`

#### Scenario: Same hook stays local-only when entities ARE synced
- **WHEN** `SYNC_CONFIG` later includes `invoice` (delivered by a future offline-first change) AND Electric has populated the local table
- **THEN** the same `useRecentActivity()` call returns `completenessMode === 'local'` and fires no REST request
