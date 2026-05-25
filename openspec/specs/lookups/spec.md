# lookups Specification

## Purpose
TBD - created by archiving change change-404-lookup-entities-wiring. Update Purpose after archive.
## Requirements
### Requirement: Lookup entities registered via registerEntityFromSql
The system SHALL register PipelineStage, Service, ServiceCategory, MetadataType, and SettingsType as entity-graph entities using `registerEntityFromSql` from `@prometheus-ags/prometheus-entity-management` v1.3. The SQL source for each registration MUST come from `local-schema-common.sql`. `registerLookupEntities()` MUST run at app bootstrap alongside `registerClientEntities()` and `registerTrialsFeatureEntities()`.

#### Scenario: App boots and lookups are queryable
- **WHEN** the app mounts and `registerLookupEntities()` has run
- **THEN** `useEntityList({ type: "PipelineStage" })` resolves the seeded rows from PGlite

#### Scenario: Dashboard Sales Pipeline binds to real stages
- **WHEN** two `pipeline_stage` rows exist with `type = "sales"` and `is_active = true`
- **THEN** DashboardPage renders the Sales Pipeline bar chart with exactly two bars labelled with the seeded `name` values

### Requirement: Weighted pipeline uses each stage's revenue_probability
The dashboard aggregator hook SHALL compute weighted pipeline value as the sum over active deals of `estimated_value * stage.revenue_probability`, using the stage row resolved from the lookup hook (not a hardcoded mapping).

#### Scenario: Two stages with different probabilities
- **WHEN** stage A has probability 0.8 and stage B has probability 0.3, deal X is in stage A with `estimated_value = 100000`, and deal Y is in stage B with `estimated_value = 50000`
- **THEN** `useDashboardAggregates().weightedPipelineValue` equals `95000`

### Requirement: No hardcoded pipeline-stage strings in dashboard feature
The repository SHALL contain no hardcoded pipeline-stage names anywhere under `src/features/dashboard/`. This is enforced by a CI grep gate.

#### Scenario: CI grep gate runs on this branch
- **WHEN** CI runs `git grep -iE "Prospect|Qualification|Discovery|Proposal|Negotiation" src/features/dashboard/`
- **THEN** the command exits with no matches

