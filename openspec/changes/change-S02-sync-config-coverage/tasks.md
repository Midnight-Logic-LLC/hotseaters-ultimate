# Tasks — change-S02

- [x] Add `sales_activity`, `lead`, `time_entry`, `invoice`, `subcontract_request` to `SYNC_CONFIG` (direct `company_id` shapeWhere)
- [x] Add `attorney` with direct `company_id` shapeWhere; prove ⊆ EXISTS RLS policy (attorney has own company_id, = its client's by construction)
- [x] Add `subcontract_assignment` with custom shapeWhere (no company_id col): `hiring_company_id = cid OR subcontractor_company_id = cid` (= RLS exactly)
- [x] DECISION `tier`: DEFERRED (0 CREATE POLICY → would fail RLS-coherence lint; indirect tenant scope) — stays REST
- [x] DECISION `settings_type`: DEFERRED (RLS USING(true) global lookup → belongs in system-shapes.ts, not tenant SYNC_CONFIG)
- [x] DECISION `service`: DROPPED from scope (company-store services read metadata_type scope='service', already synced; `service` table unused — YAGNI)
- [x] Set tier A (writeable) for all 7 additions
- [x] Update `EMIT_ORDER` in FK-dependency order (attorney/lead after client; sales_activity/invoice/time_entry/subcontract_* after trials)
- [x] `pnpm gen:pglite-schema` → 19 `_synced` tables emitted; schema version 20260530000001
- [x] Bump `BUNDLED_PGLITE_SCHEMA_VERSION` 20260526000001 → 20260530000001
- [x] `sync-config-rls-coherence` lint green (all 19 entities have a CREATE POLICY)
- [x] `pnpm lint:rules` smoke-test OK; `pnpm typecheck` clean; 36/36 src/shared/db tests pass

## Notes / gaps (documented, not blocking)
- `subcontract_request`: only company_id-OWNED rows sync. RLS also admits rows
  where current company is in `invited_company_ids` (JSONB `?` operator), which
  Electric shapes can't express. Invited-but-not-owned requests stay REST until
  a sub-shape / server view exposes them.
- `tier`, `settings_type`, `service` deferred (see decisions above).
- ROOT-CAUSE FIX during this change: the gen-pglite-schema parser silently
  DROPPED `lead` because inline comments BETWEEN array objects broke its naive
  `{ … }` splitter (it merged trial_service_assignment+lead). Fixed by removing
  the inter-object comments. The generator's silent-drop (no error on a
  parsed-but-missing entity) is a latent hazard → flagged as a separate task.
