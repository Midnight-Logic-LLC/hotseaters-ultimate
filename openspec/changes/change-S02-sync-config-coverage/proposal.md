# change-S02 — sync-config coverage

## Why
The duplicate network calls are tables that REST-fetch on every visit because
they were never added to `SYNC_CONFIG`. All core targets already have server
RLS policies, so they are eligible to sync now.

## What changes
Add to `SYNC_CONFIG` + `EMIT_ORDER` and regenerate the local schema:
`sales_activity`, `lead`, `attorney`, `invoice`, `time_entry`,
`subcontract_request`, `subcontract_assignment`, `settings_type`, `service`.
Each gets a `shapeWhere` that is a subset of its RLS USING clause.

Special handling:
- **attorney** — RLS is an EXISTS subquery (shapes reject subqueries); sync via
  direct `company_id = ${cid}` and verify it ⊆ the EXISTS policy.
- **tier** — tenant-scoped indirectly; decide custom `shapeWhere` vs stay-REST.

## Impact
`src/shared/db/sync-config.ts`, generated `local-schema.sql`,
`BUNDLED_PGLITE_SCHEMA_VERSION`. Depends on S01. RULE 5 (CI-enforced coherence).
