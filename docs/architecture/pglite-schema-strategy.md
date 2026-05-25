# PGlite Schema Strategy — Architectural Assessment

> Status: assessment (no code changes). Author: architect agent, 2026-05-25.
> Companion to [sync-policy.md](./sync-policy.md). Binding rules in
> [`CLAUDE.md`](../../CLAUDE.md) — esp. RULE 1, RULE 3, RULE 5, RULE E.

## Executive summary

The current PGlite schema lifecycle in `hotseaters-ultimate` is a
**single-monolithic-version + drop-and-rehydrate** model. It is brittle:
any schema change requires bumping `BUNDLED_PGLITE_SCHEMA_VERSION`,
regenerating one giant SQL blob, force-dropping every Tier-A table in
every user's browser, and waiting for Electric to re-hydrate. There is no
graceful degradation, no incremental migration, no plugin extensibility,
and the model is fundamentally incompatible with the coming WebRTC p2p
device sync.

**Recommendation in three bullets:**

1. **Replace the monolithic version stamp with a per-table fingerprint
   ledger.** Each `<entity>_synced` table carries its own version +
   column-set hash in a `_pglite_table_versions` registry; migrations are
   computed at boot per-table by diffing live `information_schema.columns`
   against the bundled fingerprint. Additive changes (new nullable
   column, widened type) are applied in-place via `ALTER TABLE`; only
   destructive changes (rename, drop, type-narrow) trigger a per-table
   drop+rehydrate.
2. **Make `prometheus-entity-management` the schema authority, not the
   SQL generator.** The library already ships `registerEntityFromSql`
   (parses `CREATE TABLE` to JSON Schema) and
   `createPGlitePersistenceAdapter`. Add three small upstream APIs —
   `SchemaRegistry`, `SchemaMigrator`, and `LookupCache` — so each
   feature declares its entities + lookup-entity tier + RLS-coherent
   shape predicate in TypeScript, and the runtime synthesizes the
   trio-pattern DDL + the migration plan automatically. This kills the
   hand-editable `scripts/gen-pglite-schema.mjs` text-parser and makes
   3rd-party plugins trivially additive.
3. **Treat every synced row as forward-compatible JSON.** Every
   `<entity>_synced` table gets a permanent `_extra JSONB` sidecar
   column. Electric writes any server columns the client doesn't yet
   know about into `_extra`; reads project them back via the view.
   Result: a client several migrations behind a server *keeps working*
   on data it understands and silently buffers the rest. Combined with
   per-table versioning, this delivers the "even when there are
   problems, the system still works" requirement and provides the
   CRDT-compatible substrate the WebRTC sync will need.

---

## 1. Current architecture diagnosis

### 1.1 What exists today

| File | Responsibility | Failure mode |
|---|---|---|
| `src/shared/db/pglite-client.ts:48` | Hard-coded `BUNDLED_PGLITE_SCHEMA_VERSION` constant | One bump invalidates every browser; easy to forget |
| `src/shared/db/pglite-client.ts:127-145` | Boot check: if version mismatch → drop every Tier-A `_synced` + `_local`, re-apply schemas, blank `_sync_meta`, force re-hydration | All-or-nothing; if drop succeeds and re-apply fails, app is bricked until cache clear |
| `src/shared/db/local-schema-common.sql:23` | `INSERT … ON CONFLICT DO UPDATE` stamps the bundled version *on every boot* — meaning the version stamp on disk **always equals the bundled version after a successful schema apply**, so the boot-time mismatch check at `pglite-client.ts:127` actually relies on the version *before* `db.exec(schemaCommonSql)` re-stamps it. The whole comparison happens AFTER the SQL has already overwritten the version. **This is a latent bug**: the schema apply must NOT touch `_pglite_schema_version` for the mismatch check to mean anything. Today it works by accident because the `INSERT … ON CONFLICT DO UPDATE` runs *before* the `SELECT version` below it, but the version it reads is the *new* one. Verify with a test. |
| `scripts/gen-pglite-schema.mjs` | Regex-parses `sync-config.ts`, regex-parses Supabase `CREATE TABLE`, emits trio (synced + local + view + 3 triggers) per entity | (a) regex-based TS parse breaks on minor refactors, (b) `extractColumns` skips constraints but doesn't parse `DEFAULT`, `CHECK`, `REFERENCES`, so server-side defaults aren't reflected, (c) no column-rename detection, (d) no schema diff — always full emit, (e) the generator is run by humans, then the constant must be hand-bumped to match |
| `src/shared/db/sync-config.ts:78` | Hand-curated list of 12 entities, each with custom `shapeWhere` | Adding a feature = edit this file + edit the generator output + bump constant + write migration; four hand-coordinated artifacts |
| `src/shared/db/electric-sync.ts:208` | `db.electric.syncShapeToTable` writes to `<entity>_synced` with hardcoded `primaryKey` | If the server adds a column, Electric's shape stream delivers it; PGlite either rejects the unknown column or silently drops it (depends on PGlite version) — either way silent data loss |
| `local-schema-common.sql` (hand-curated) vs. `local-schema-user.sql` (generated) | Same trio pattern duplicated by hand in `common` for `metadata_type` + `entity_metadata` | Two sources of truth; the comment at `local-schema-common.sql:1` admits it ("Hand-curated from local-schema.sql"). When the generator changes, `common` drifts. |

### 1.2 Concrete failure scenarios the architecture cannot survive

1. **Additive column on server, no client rebuild yet.** Electric
   delivers the column → either crash on insert or silent drop. No
   `_extra` JSONB safety net.
2. **Constant bumped, generator forgotten.** Boot mismatches version,
   drops tables, re-applies *old* SQL, restamps as new — silent
   corruption. Nothing in CI prevents this.
3. **Drop succeeds, re-apply fails (network blip during Electric
   reconnect).** PGlite has empty tables; reads return empty. UI shows
   "no data" — not "we're recovering". The `dropTierATables` at
   `pglite-client.ts:156` is not transactional with the subsequent
   `db.exec(schemaCommonSql)`.
4. **Two devices for one user; both update at the same time** (the
   WebRTC future). The current model has no concept of per-row version
   vectors or causality — `<entity>_local` is a flat shadow with
   `is_deleted` and no Lamport clock or LWW timestamp beyond
   `updated_at`.
5. **Plugin author adds an entity.** They cannot — `SYNC_CONFIG` is a
   static export, the generator runs from `pnpm gen:pglite-schema`, and
   the constant is in `pglite-client.ts`. There is no extension point.
6. **Lookup table refresh.** Every lookup (`metadata_type`,
   `entity_metadata`) re-syncs through Electric on every login. There
   is no content-hashed cache, no "this hasn't changed since
   2026-04-12, skip" path. The lookup data is treated identically to
   hot operational data.

### 1.3 Architectural smells

- The version stamp lives in 3 places (constant in
  `pglite-client.ts:48`, literal in `local-schema-common.sql:24`,
  latest migration timestamp inside the generator) and they're
  synchronized by humans.
- `_sync_meta` has a `schema_version` column at
  `local-schema-common.sql:31` that is **never read or written** by any
  code path.
- `local-schema-common.sql` was originally generated, was hand-edited,
  and the comment block now warns it's "hand-curated" — exactly the
  death spiral the generator was supposed to prevent.
- `electric-sync.ts:148` returns a no-op `ShapeStream` stub to satisfy
  the tenant-scoped adapter's type, but uses
  `db.electric.syncShapeToTable` underneath. The library's
  `createElectricAdapter` ChangeSet pipeline is bypassed entirely —
  meaning the entity graph never sees synced rows directly; stores must
  query PGlite themselves. The library is doing half the work; the
  consumer reimplemented the other half.

---

## 2. Problem taxonomy

| # | User pain point | Concrete sub-problems |
|---|---|---|
| P1 | "Even when there are problems, the system still works" | (a) additive server columns must never crash the client; (b) drop+rehydrate must never leave the app in an empty-but-functional-looking state; (c) failed migrations must be detectable and recoverable; (d) the app must distinguish "no data" from "I'm catching up". |
| P2 | "An instance unused for a while gets updated easily and keeps working once the user logs in again" | (a) clients N migrations behind must apply additive migrations in-place without losing local writes; (b) destructive migrations must be detected per-table, not per-app; (c) re-hydration of a single drifted table should not blow away unrelated tables. |
| P3 | "User changes are handled smoothly (one person may own multiple users)" | (a) `closeForUser` → `openForUser` must be zero-warm-up — handled today by per-user IDB but graph state currently leaks (entity graph is keyed by `tenant:${companyId}`, not user; if two users share a company, the snapshot is right; if same person/different companies, the snapshot is wrong on first switch). |
| P4 | "Lookup data is handled efficiently — no constant sync" | (a) need a tier for content-hashed lookups (Tier L?); (b) refresh on a cadence + ETag-style validation, not Electric long-poll; (c) lookups must be readable before tenant claim is available (CLAUDE.md already says this for `metadata_type`). |
| P5 | "Integrates well with `prometheus-entity-management`" | (a) the entity graph should be the cache surface, not PGlite views; (b) Electric ChangeSets should land in the graph, not just in PGlite tables; (c) the package should own schema lifecycle, not the consumer. |
| C1 | Plugin model — 3rd-party schemas | (a) entities declared in plugin code at runtime; (b) per-plugin migration ledger; (c) per-plugin shape predicates that auto-pass RLS-coherence checks. |
| C2 | WebRTC p2p device sync | (a) per-row version vectors or HLCs; (b) merge function per entity; (c) schema fingerprint must be exchangeable so two devices know whether they speak the same dialect. |
| C3 | Client/server divergence window | (a) optimistic write timeout + reconcile; (b) `_extra` JSONB for unknown columns; (c) per-table "lagged" flag visible to UI so a feature can self-disable when its table is behind. |

---

## 3. Industry research

Sources cited inline. Search dates: 2026-05-25.

### 3.1 PGlite migration tooling

- **PGlite team's official position (as of 2026):** PGlite ships no
  migration framework. The recommended pattern in the docs is "use
  your existing tool that emits Postgres DDL" — Drizzle Kit, Atlas,
  sqlx, or hand-rolled. See https://pglite.dev/docs/usage#migrations
  and the discussion at https://github.com/electric-sql/pglite/discussions/137.
  PGlite does support `pg_dump`-style export and `loadDataDir` for
  snapshot restore — relevant for "burn it down and reload from cold
  backup".
- **`@electric-sql/pglite` `live` extension**
  (https://pglite.dev/docs/live-queries) reacts to row changes but does
  NOT react to schema changes. A schema change requires the consumer
  to re-prepare statements.
- **Community pattern (most-cited):** a
  `meta_migrations(id INT PK, applied_at TIMESTAMPTZ)` table + a
  `migrations: { id: number; up: (db) => Promise<void> }[]` array,
  iterated at boot. Same shape as `golang-migrate` or `db-migrate`.
  Works fine for additive migrations; falls over on rename/drop unless
  paired with a backup-restore cycle.

### 3.2 ElectricSQL — schema evolution

- **Electric's official guidance:** the shape protocol is
  **column-additive-tolerant on the server side but not the client.**
  If the server adds a column, the shape stream delivers it; if your
  local table doesn't have it, PGlite raises
  `column "x" does not exist`. The docs at
  https://electric-sql.com/docs/guides/shapes#evolving-shapes recommend
  `ALTER TABLE … ADD COLUMN` at boot before subscribing.
- **`shapeKey` semantics**
  (https://electric-sql.com/docs/api/clients/typescript#syncshapetotable):
  if the `shapeKey` is reused with a different `where` clause, Electric
  resumes from the persisted offset and may deliver inconsistent rows.
  Reset key on shape-shape changes.
- **Electric 1.x roadmap** mentions "shape schema descriptors" (server
  emits column list with each shape header) but as of 2026 the client
  does not consume them. PRs welcome.

### 3.3 Drizzle Kit + PGlite

- Drizzle's `migrate()` function works against PGlite via the
  `drizzle-orm/pglite` driver
  (https://orm.drizzle.team/docs/connect-pglite). The migration journal
  is a small JSON file; the `__drizzle_migrations` table is created in
  PGlite. Pros: well-tested, fast, additive-safe. Cons: Drizzle wants
  to own the schema definition (TS-first), which collides with our
  "Supabase migrations are the source of truth" rule. Workaround:
  generate Drizzle schema FROM the Supabase migrations at build time
  (Drizzle's `introspect` against a docker'd Supabase).
- Bundle size: Drizzle migrator core is ~15KB gz; the journal+SQL
  files add per-migration.

### 3.4 Other local-first competitors

| Tool | Schema evolution model | Plugin extensibility | P2P readiness | Lookup caching |
|---|---|---|---|---|
| **ElectricSQL** (current) | Manual `ALTER TABLE` + reset shapeKey; "additive only, otherwise rehydrate" | None — shapes defined in app code | None — single Postgres source of truth | None — every shape is treated equally |
| **PowerSync** (https://docs.powersync.com/usage/sync-rules/schema-updates) | First-class: `client_schema_version` exchanged in handshake; sync rules can target schema version; offers `partial_replication`. Lookup-table pattern via "low-priority buckets" explicitly documented. | Sync rules in YAML; supports per-tenant + per-user buckets | Single-source; no p2p | "Low-priority buckets" + bucket-level versioning |
| **Replicache / Rocicorp Zero** (https://zero.rocicorp.dev/docs/zero-schema) | Zero ships a `schema.ts` with explicit `version: number` and a `migrate()` per version. Schema version is part of the sync handshake; mismatched clients receive a "please refresh" signal but can keep reading at the old schema. | Schema is closed-world; plugin = fork | Designed for the central Zero-cache; no p2p | First-class: `relationships` + materialized client-side views; lookups hosted as tiny "always-loaded" queries |
| **Triplit** (https://triplit.dev/docs/schemas) | Schemas are TS-defined with `version` per collection; the server validates; migrations applied client-side via dispatched migration events | Plugin-friendly: collections are dynamically registerable | Has experimental P2P via Hocuspocus-style sync | Collection-level TTL caching |
| **RxDB** (https://rxdb.info/migration-schema.html) | First-class: every collection has `schemaHashVersion` + per-version migration strategies; supports lazy migration (only on first read of a doc); plugin model | Collections are registerable at any time | First-class P2P plugin (WebRTC) | TTL + "lokijs cache" plugin |
| **Evolu** (https://www.evolu.dev/docs/api/schema) | Effect-Schema-defined; schema diff at boot; supports CRDT merge per table | Closed schema | First-class (E2E encrypted CRDT) | N/A |
| **CR-SQLite / Vlcn** (https://github.com/vlcn-io/cr-sqlite) | Bring your own; the CRR layer wraps tables marked as CRR | Pluggable | Designed for p2p (causal-length CRDTs) | App's responsibility |
| **Triplit + Yjs schemas + WebRTC** | CRDT-native | Yes | Yes | Yes |

Most informative two for our use case: **PowerSync** (proves per-table
version + lookup-bucket separation works at scale, see
https://docs.powersync.com/architecture/client-architecture#schema-evolution)
and **RxDB** (proves `schemaHashVersion` + per-collection lazy
migration + WebRTC sync compose cleanly, see
https://rxdb.info/replication-webrtc.html).

### 3.5 Schema fingerprinting + JSON sidecar

- **Schema fingerprint** = stable hash over
  `{table, [column-name, normalized-type, nullable, default-fingerprint]}`.
  Used by PowerSync, Triplit, RxDB. Detects drift without timestamp
  comparison. Implementation: sort columns alphabetically, SHA-256 over
  the canonical string.
- **JSON sidecar / "extra" column**: Stripe, Shopify, and many SaaS
  APIs use this on the wire (`metadata` JSONB). Avro/Protobuf evolution
  rules formalize it. For a local DB, an `_extra JSONB DEFAULT '{}'::jsonb`
  column on every synced table catches every server column the client
  doesn't know yet. Reads project `_extra ->> 'col_x'` as needed; once
  the client ships a migration that adds `col_x` as a real column, the
  migration backfills from `_extra` and drops the key.

### 3.6 Plugin / extensible schema patterns

- **Strapi** (https://docs.strapi.io/dev-docs/api/content-api): plugins
  declare content types in TS; Strapi merges them into a single schema
  at boot; per-plugin migration directories.
- **Directus** (https://docs.directus.io/extensions/): same, but driven
  by DB-introspected metadata.
- **Postgrest** (https://postgrest.org/) — no schema management; relies
  on the underlying Postgres.
- **Pattern that transfers to our case**: a
  `SchemaRegistry.register(plugin)` API; each plugin contributes (a)
  entity definitions, (b) per-version migrations, (c) shape predicates,
  (d) RLS expectations. Boot iterates all registered plugins, computes
  a merged migration plan, applies in dependency order.

---

## 4. Recommended architecture

### 4.1 Top-level model

```
┌─────────────────────────────────────────────────────────────────────┐
│  Plugin / feature module                                             │
│  features/clients/entities.ts                                        │
│  ──────────────────────────────────────────                          │
│  defineSyncedEntity({                                                │
│    name: 'client',                                                   │
│    tier: 'A',                                                        │
│    schema: registerEntityFromSql({ createTableSql }),                │
│    shapeWhere: (cid) => `company_id = ${cid}`,                       │
│    migrations: [{ to: 5, steps: [...] }],                            │
│    rls: { matches: 'company_id = current_company_id()' },            │
│  })                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                         │ register at module init
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SchemaRegistry  (UPSTREAM in prometheus-entity-management)          │
│  ──────────────────────────────────────────                          │
│  - Collects every defineSyncedEntity call                            │
│  - Computes per-entity fingerprint = sha256(canonical(columns))      │
│  - Emits the trio DDL on demand (no more gen-pglite-schema.mjs)      │
│  - Owns _pglite_table_versions registry                              │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SchemaMigrator  (UPSTREAM)                                          │
│  ──────────────────────────────────────────                          │
│  At boot, for each registered entity:                                │
│    1. Read existing columns from PGlite information_schema           │
│    2. Compute live fingerprint                                       │
│    3. Compare to bundled fingerprint                                 │
│       - identical            → no-op                                 │
│       - additive only        → ALTER TABLE … ADD COLUMN              │
│       - widening only        → ALTER TABLE … ALTER COLUMN TYPE       │
│       - destructive          → drop + recreate ONE table, reset      │
│                                THAT table's shapeKey only            │
│    4. Re-emit view + triggers (idempotent)                           │
│    5. Stamp new fingerprint in _pglite_table_versions                │
│  All wrapped in BEGIN/COMMIT per table.                              │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LookupCache  (UPSTREAM)                                             │
│  ──────────────────────────────────────────                          │
│  Tier 'L' entities:                                                  │
│   - REST fetched (Supabase POST /rpc/lookup_<x>)                     │
│   - Content-hashed (ETag from server, stored in _lookup_meta)        │
│   - Refreshed every N hours OR on cache-miss                         │
│   - Stored in dedicated table; NEVER trio-pattern                    │
│   - Readable BEFORE tenant claim resolves                            │
│   - Plugged into the entity graph as a single bulk-upsert            │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Existing per-user PGlite + Electric (keep as-is)                    │
│  + every <entity>_synced gains `_extra JSONB NOT NULL DEFAULT '{}'`  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Per-table version vectors — table layout

```sql
-- new system table, replaces the single-row _pglite_schema_version
CREATE TABLE _pglite_table_versions (
  table_name      TEXT PRIMARY KEY,
  fingerprint     TEXT NOT NULL,                 -- sha256 of column canonical
  bundled_version TEXT NOT NULL,                 -- semver-ish, app-set
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  state           TEXT NOT NULL DEFAULT 'ok'    -- 'ok' | 'migrating' | 'failed' | 'lagged'
                   CHECK (state IN ('ok','migrating','failed','lagged'))
);

-- new system table, plugin ledger
CREATE TABLE _pglite_plugin_registry (
  plugin_id       TEXT PRIMARY KEY,
  version         TEXT NOT NULL,
  installed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  tables          JSONB NOT NULL                 -- ["client", "client_address", ...]
);
```

`state = 'migrating'` is set BEFORE any DDL and cleared on commit; a
crash mid-migration leaves the row as `'migrating'`, which the next
boot detects and either retries or escalates to drop+rehydrate.

`state = 'lagged'` is set when the local fingerprint is *older* than
the server-shape-descriptor fingerprint (when Electric eventually
delivers schema descriptors) — UI features that read this table can
render a banner "Some data is updating".

### 4.3 Migration classification — what triggers what

| Diff type | Example | Action | Data loss? |
|---|---|---|---|
| Additive nullable column | server adds `client.referral_source TEXT` | `ALTER TABLE client_synced ADD COLUMN referral_source TEXT;` then re-emit view + triggers | none |
| Additive NOT NULL column with default | `archived_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch'` | Same, with the DEFAULT | none |
| Widening type | `varchar(50)` → `text` | `ALTER TABLE … ALTER COLUMN … TYPE TEXT;` | none |
| Narrowing type | `text` → `varchar(20)` | Drop+recreate that one table; reset its shapeKey | local writes for that table only |
| Rename column | `client.email` → `client.email_address` | Treat as drop-old + add-new; backfill from `_extra` if Electric is still sending the old name | local writes preserved if backfill rule provided |
| Drop column | server drops `client.legacy_x` | `ALTER TABLE … DROP COLUMN IF EXISTS legacy_x;` | local writes referring to that column are silently dropped |
| New entity | plugin adds `referral` | Full trio DDL emit; new row in `_pglite_table_versions` | none |
| Drop entity | feature removed | Full trio drop; plugin uninstall removes the row | the whole table |

**The key insight**: today, *all* of these collapse into "drop
everything Tier-A". The recommendation is to make 6 of the 8 cases
zero-data-loss.

### 4.4 `_extra` JSONB sidecar — forward-compat substrate

Every `<entity>_synced` and `<entity>_local` gets one extra column:

```sql
_extra JSONB NOT NULL DEFAULT '{}'::jsonb
```

When Electric delivers a row with a column the local schema doesn't
have, the `syncShapeToTable` writer (we'd need a thin wrapper) routes
unknown keys into `_extra`. When the migration later promotes that
column to a real column, a backfill clause copies `_extra->>'<col>'`
into the new column and `DELETE`s the key.

This is the load-bearing piece for "the system still works even with
problems" — a server can add a column on Monday, a tab opened Sunday
keeps working through Friday on the old schema.

### 4.5 What the package must own (PRs to `prometheus-entity-management`)

Today the package has `createPGlitePersistenceAdapter`,
`createTenantScopedElectricAdapter`, `registerEntityFromSql`. It does
NOT have:

| Proposed API | Purpose | Roughly |
|---|---|---|
| `createSchemaRegistry()` | Singleton + `register(def)` per entity; merges plugins; emits the trio DDL string | New module |
| `createSchemaMigrator({ pglite, registry })` | Runs the boot-time plan; `state` machine on `_pglite_table_versions`; transactional per-table | New module |
| `createLookupCache({ pglite, source })` | Tier-L registry; content-hashed REST fetch; bulk upsert into graph | New module |
| `createSyncedEntityWriter({ pglite, registry })` | Wraps `syncShapeToTable`; routes unknown columns to `_extra`; reports per-table `lagged` state | Replaces consumer's direct `db.electric.syncShapeToTable` |
| `useGraphSchemaState()` | React hook surfacing per-table `state` for UI banners | New hook |
| `defineSyncedEntity({…})` | Declarative entity definition (replaces `SYNC_CONFIG` row) | New helper |

These are small, additive, and consistent with the library's existing
design (declare-then-runtime-orchestrates).

### 4.6 Lookup-entity strategy (Tier L)

- **Tier definition**: read-mostly reference data with stable IDs and
  low write rate (e.g. `metadata_type`, `entity_metadata`, future
  `country`, `state`, `currency`, system `pipeline_stage`).
- **Transport**: Supabase REST or RPC, NOT Electric. Reason: Electric
  long-poll cost per lookup ≈ same as per hot entity; lookups don't
  need <100ms freshness.
- **Cache key**: `(plugin_id, lookup_name, content_etag)`. ETag
  delivered by an RPC that emits `xxhash(jsonb_agg(row ORDER BY id))`.
- **Refresh policy**: on first read after `_lookup_meta.last_checked`
  is older than `max_age_minutes` (default 60), HEAD the ETag; if
  unchanged, bump `last_checked` and serve cached; if changed, full
  reload.
- **Pre-auth readability**: lookups MUST be readable before a
  `tenantClaim` resolves (system-wide rows have `company_id IS NULL`).
  The cache is keyed at the `idb://hotseaters-public` shared store;
  tenant-scoped overlays merge in after auth.

This solves P4 without breaking RULE 5 — lookups that contain tenant
rows still flow through Electric on the tenant-scoped path; only
system-wide rows live in the public store.

### 4.7 User-switching protocol

The per-user IDB isolation at `pglite-client.ts:113` already handles
99% of the problem. The remaining 1%:

- `entity-graph-bootstrap.ts:56` keys the persistence under
  `tenant:${companyId}`. If the same person owns two users in different
  companies, the snapshot follows the company, not the user. Combined
  with per-user IDB, this is correct — each user's IDB has its own
  `_graph_snapshot` row scoped to its tenant.
- On `closeForUser`, the entity graph runtime must be `dispose()`d
  (currently is). The Realtime channels must be stopped (currently is,
  via `stopRealtimeChannels`).
- The Supabase auth session must be PKCE-rotated (out of scope for
  schema, but mention in handoff).
- Recommendation: a single
  `userSession.handoff(fromUserId, toUserId)` orchestrator that
  sequences (a) flush pending writes for `from`, (b) close graph +
  PGlite for `from`, (c) open PGlite + graph for `to`, (d) wait for
  shape catch-up. State machine in the sync gate.

### 4.8 WebRTC p2p device sync compatibility

The schema layer's contract with the future p2p layer:

1. **Every Tier-A row carries a Hybrid Logical Clock** (`_hlc TEXT`)
   and an **author device ID** (`_origin TEXT`). Add to `_synced` AND
   `_local`. Electric is unaware; the field is server-NULL-tolerant;
   p2p sync fills it.
2. **`_extra` JSONB is also the CRDT delta envelope.** Yjs-style binary
   state vectors live in `_extra._yjs` when present. A pure-Supabase
   client treats it as opaque; a p2p-enabled client decodes and merges.
3. **Schema fingerprint exchange**: when two devices peer, the first
   handshake message includes `_pglite_table_versions`. Mismatched
   fingerprints downgrade the session to "metadata-only sync" until
   both upgrade. Matches PowerSync's pattern.
4. **Merge function per entity**: the `defineSyncedEntity` API gains
   an optional `merge: (a, b) => row` callback. Default = LWW by
   `updated_at`. Custom mergers register here, NOT inside store code.

None of this needs implementing today — but adding `_hlc`, `_origin`,
and `_extra` to the trio NOW means the wire format doesn't break when
p2p ships.

### 4.9 Plugin extensibility

```ts
// plugin author code (no fork required)
import { definePlugin, defineSyncedEntity } from '@prometheus-ags/prometheus-entity-management';

export const ReferralsPlugin = definePlugin({
  id: 'referrals',
  version: '1.2.0',
  entities: [
    defineSyncedEntity({
      name: 'referral',
      tier: 'A',
      createTableSql: REFERRAL_DDL,
      shapeWhere: (cid) => `company_id = ${cid}`,
      rls: { matches: 'company_id = current_company_id()' },
      migrations: [
        { to: 2, additive: ['notes TEXT'] },
        { to: 3, destructive: ['DROP COLUMN old_status'] },
      ],
    }),
  ],
});

// app boot
schemaRegistry.install(ReferralsPlugin);
```

Boot walks the registry, computes the merged migration plan, applies
per-table. The host app no longer needs `sync-config.ts`; entities
self-register at module import.

### 4.10 Graceful degradation matrix

| Failure | Today | Recommended |
|---|---|---|
| Server adds column, client behind | crash or silent drop | `_extra` JSONB absorbs it; UI continues |
| Single-table destructive migration | drops all 12 tables | drops 1 table, rehydrates only that shape |
| Mid-migration crash | brick (empty tables, version stamped) | `_pglite_table_versions.state = 'migrating'` → next boot retries; if retry fails, that table fails open (read-only on `_extra`) |
| Plugin uninstalled | not supported | DROP entity tables; remove from registry; entity graph evicts type |
| Lookup data stale | re-syncs on every login | ETag check; only fetches if changed |
| Two devices conflicting | last-write-wins implicit | HLC-stamped LWW with optional custom merger |
| Constant forgotten | silent corruption (see §1.1) | impossible — fingerprint computed from registered DDL, no manual stamp |

---

## 5. Migration plan — 5 milestones

### M1 — Stop the bleeding (1 sprint, in-repo only)

- Fix the latent bug: move the `_pglite_schema_version`
  `INSERT … ON CONFLICT` OUT of `local-schema-common.sql` and into the
  migration runner so the boot-time mismatch check reads the *previous*
  value.
- Add `_extra JSONB DEFAULT '{}'` to every `<entity>_synced` and
  `<entity>_local` in `local-schema-common.sql` + the generator.
- Wrap `dropTierATables` + re-apply in `BEGIN; … COMMIT;` (currently
  `db.exec(dropStatements)` is one autocommit batch but the subsequent
  `db.exec(schemaCommonSql)` is a separate batch — split-brain
  possible).
- **Acceptance**: a forced version bump that fails partway through
  leaves PGlite in a recoverable state, not bricked. Cypress test:
  kill the worker mid-migration, reload, assert the app boots.

### M2 — Per-table fingerprints (2 sprints, in-repo + thin upstream contract)

- Introduce `_pglite_table_versions` in `local-schema-common.sql`.
- Rewrite `pglite-client.ts:127-145` to iterate the registry
  per-table, classify the diff (additive vs. destructive), apply the
  minimum DDL.
- Keep the existing generator BUT teach it to emit fingerprints
  alongside the DDL.
- **Acceptance**: adding a nullable column to a Supabase table +
  regenerating + reloading produces a 50ms `ALTER TABLE`, NOT a
  re-hydration. Visible in DevTools.

### M3 — Move schema authority into `prometheus-entity-management` (3 sprints, upstream PR)

- Upstream PR with the 6 APIs in §4.5.
- Migrate `src/shared/db/sync-config.ts` from a static array to N
  `defineSyncedEntity` calls inside `src/features/<x>/entities.ts`.
- Delete `scripts/gen-pglite-schema.mjs`; the registry computes DDL at
  boot. Bundle size cost: ~3KB for the emitter.
- **Acceptance**: a feature folder can be added/removed/branch-isolated
  without touching `shared/db`. CI test: rename a feature folder, app
  still boots.

### M4 — Lookup tier + `LookupCache` (1 sprint)

- Implement Tier L per §4.6.
- Move `metadata_type` (system-wide rows only) + future
  `country`/`state`/`currency` to Tier L.
- Add a shared `idb://hotseaters-public` PGlite instance for cross-user
  lookup data.
- **Acceptance**: cold start on a known user with unchanged lookups
  makes 1 HEAD request total for lookups instead of N shape
  subscriptions.

### M5 — HLC, `_origin`, plugin model, p2p-ready (3 sprints — can ship before WebRTC lands)

- Add `_hlc`, `_origin` to all Tier-A trios.
- Ship `definePlugin` + `schemaRegistry.install`.
- Document the merger contract.
- **Acceptance**: a synthetic test rig replays two devices' writes with
  overlapping HLCs and produces a deterministic merged state.

### What belongs where

| Work item | This repo | `prometheus-entity-management` | New tooling |
|---|---|---|---|
| M1 fixes | ✅ | – | – |
| `_extra` sidecar | ✅ (schema) | small wrapper in `syncedEntityWriter` | – |
| Per-table versions | ✅ | – | – |
| `defineSyncedEntity` API | ✅ consumers | ✅ implementation | – |
| `SchemaMigrator` | ✅ consumer | ✅ implementation | – |
| `LookupCache` | – | ✅ implementation | – |
| Plugin model | ✅ consumers | ✅ implementation | – |
| HLC / `_origin` | ✅ schema | ✅ merger contract | – |
| Drizzle introspection of Supabase | – | – | ✅ optional CI step |

---

## 6. Rejected alternatives

1. **Adopt Drizzle Kit wholesale.** Rejected because (a) Drizzle wants
   to own the schema in TS; our source of truth is Supabase SQL
   migrations (RULE-adjacent); (b) Drizzle's migrator runs
   per-migration-file, which is server-side thinking — for a browser
   client that may be N migrations behind a server we just spun up
   yesterday, we don't want to "apply migrations 1..47 in order"
   client-side. We want a "diff current → target" model. (c) Drizzle
   gives us nothing on the lookup-tier or plugin axis.
2. **Switch to PowerSync.** Solves most pain points out of the box,
   but (a) it's hosted/paid for the dev experience and our RULE 8 says
   no Vercel-hosted services (the same posture applies); (b) the
   self-hosted PowerSync server is non-trivial to operate alongside
   the existing self-hosted Supabase + Electric; (c) it replaces
   ElectricSQL, not extends it — a strategic rewrite this team can't
   afford mid-port. Worth re-evaluating in 12 months if Electric stalls.
3. **Adopt RxDB.** Best-in-class schema-evolution model and built-in
   WebRTC plugin. Rejected because (a) it's a Mongo-shaped document
   store, not a SQL store; (b) we'd lose PGlite + the
   `*_synced/*_local/view` trio that lets us use real SQL joins in
   stores; (c) it doesn't speak to our Supabase RLS investment.
4. **Stay on the monolithic version, just add `_extra`.** Tempting
   (small change, big bang for the buck). Rejected because it does not
   solve P2 (incremental updates), C1 (plugins), or C2 (p2p). `_extra`
   is necessary but insufficient.

---

## 7. Open questions for the team

1. **Plugin trust boundary.** Can plugin DDL be arbitrary, or must it
   pass a linter (no `DROP SCHEMA public`, etc.)? If 3rd parties ship
   plugins, the answer must be a linter.
2. **Lookup TTL default.** 60 min reasonable for `metadata_type`. What
   about `country`/`state` (effectively immutable) vs. `pipeline_stage`
   (tenant-customizable, more like Tier-A)?
3. **HLC clock source.** Server-issued via `extensions.uuid-ossp` or
   client-NTP? Server-issued is simpler; client-NTP is required for
   offline-first p2p without a coordinator.
4. **Schema-version mismatch UI.** When a feature's table is
   `state = 'lagged'`, do we (a) disable the feature, (b) show stale
   data with a banner, (c) silently degrade? Recommend (b) for read;
   (a) for write.
5. **Per-user PGlite quota.** With per-user IDB, a user-rich browser
   balloons disk. Need a per-user GC sweep on sign-out for inactive
   accounts (>30 days).
6. **Supabase migration directory access in CI.** Currently
   `scripts/gen-pglite-schema.mjs` walks
   `latest-data/supabase/migrations/`. After M3, we don't run the
   generator, but `defineSyncedEntity` still wants the canonical
   `CREATE TABLE` text. Proposal: a build step that copies the
   relevant `CREATE TABLE` blocks from migrations into
   `src/features/<x>/entities.sql` as imported strings. CI verifies
   they match.
7. **Backwards compatibility for in-flight users.** Strategy for users
   who load the app during the M2 deploy with `_pglite_schema_version`
   populated but no `_pglite_table_versions`: detect, treat as
   "fingerprint = none for all tables", apply the standard diff →
   likely no-op for unchanged tables, additive for any that drifted.

---

## 8. References

- PGlite docs — migrations: https://pglite.dev/docs/usage#migrations
- PGlite live extension: https://pglite.dev/docs/live-queries
- PGlite migrations discussion: https://github.com/electric-sql/pglite/discussions/137
- ElectricSQL — evolving shapes: https://electric-sql.com/docs/guides/shapes#evolving-shapes
- ElectricSQL — syncShapeToTable: https://electric-sql.com/docs/api/clients/typescript#syncshapetotable
- Drizzle + PGlite driver: https://orm.drizzle.team/docs/connect-pglite
- PowerSync — schema updates: https://docs.powersync.com/usage/sync-rules/schema-updates
- PowerSync — client architecture: https://docs.powersync.com/architecture/client-architecture#schema-evolution
- Rocicorp Zero — schema: https://zero.rocicorp.dev/docs/zero-schema
- Triplit — schemas: https://triplit.dev/docs/schemas
- RxDB — schema migration: https://rxdb.info/migration-schema.html
- RxDB — WebRTC replication: https://rxdb.info/replication-webrtc.html
- Evolu — schema API: https://www.evolu.dev/docs/api/schema
- CR-SQLite (Vlcn): https://github.com/vlcn-io/cr-sqlite
- Strapi content API: https://docs.strapi.io/dev-docs/api/content-api
- Directus extensions: https://docs.directus.io/extensions/
- Hybrid Logical Clocks (Kulkarni et al., 2014): https://cse.buffalo.edu/tech-reports/2014-04.pdf

---

### Files referenced from this repo

- [`CLAUDE.md`](../../CLAUDE.md) (RULES 1, 3, 5, E)
- [`src/shared/db/pglite-client.ts`](../../src/shared/db/pglite-client.ts) (lines 48, 113, 127–145, 156)
- [`src/shared/db/sync-config.ts`](../../src/shared/db/sync-config.ts) (lines 78–170)
- [`src/shared/db/local-schema-common.sql`](../../src/shared/db/local-schema-common.sql) (lines 18–31)
- [`src/shared/db/electric-sync.ts`](../../src/shared/db/electric-sync.ts) (lines 148, 208)
- [`src/shared/db/entity-graph-bootstrap.ts`](../../src/shared/db/entity-graph-bootstrap.ts) (line 56)
- [`scripts/gen-pglite-schema.mjs`](../../scripts/gen-pglite-schema.mjs)
- `node_modules/@prometheus-ags/prometheus-entity-management/dist/index.d.ts` (lines 1665–1837 — `TenantScopedTableConfig`, `createPGlitePersistenceAdapter`, `registerEntityFromSql`)
