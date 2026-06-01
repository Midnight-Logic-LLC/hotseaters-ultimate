# Plan — local-first-sync-architecture

> **Source:** [`assessment.md`](./assessment.md) → **Option B** (complete the
> through-the-database pattern). User-confirmed: pgvector = **D1**
> (server-generated embeddings synced as vector columns).
> **Backend:** OpenSpec (`change_backend: openspec`).
> **Date:** 2026-06-01
> **Goal of phase:** every tenant-scoped entity loads exactly once and updates
> by sync — zero duplicate network reads — plus local pgvector similarity.

---

## Guiding invariants (acceptance, repeated from assessment §8)

1. Re-navigating any route fires **0** entity-read network requests
   (Playwright network assertion on 2nd visit).
2. Server→local ingress is a **single** `syncShapesToTables` subscription.
3. Migrated stores keep **writes only**; reads come from `useLiveQuery`.
4. Every new `SYNC_CONFIG` shape has a matching RLS policy and a
   `shapeWhere ⊆ USING` (CI: `hotseaters/sync-config-rls-coherence`).
5. `pgvector` loaded in the worker; ≥1 entity has a synced `embedding`
   column with a local `<=>` hook and no per-query network.

---

## Key facts that shape the ordering (verified during planning)

- **All core target tables already have server RLS policies** in
  `latest-data/supabase/migrations/`: `sales_activity`, `attorney`,
  `subcontract_assignment`, `subcontract_request`, `settings_type`,
  `time_entry`, `lead`, `invoice`, `service`, `entity_setting`. → No new
  server policy work for the core set (big risk retired).
- **Most targets are clean `company_id = current_company_id()`** → trivial
  `shapeWhere`. EXCEPTIONS that need care:
  - **`attorney`** RLS uses an `EXISTS (… c.company_id = current_company_id())`
    subquery. **Electric shapes reject subqueries.** Must sync via a direct
    `company_id = ${cid}` predicate (attorney has its own `company_id`
    column) — verify the direct predicate is a subset of the EXISTS policy.
  - **`tier`** is tenant-scoped indirectly (no direct `company_id`). Needs a
    custom `shapeWhere` or stays REST (decide in S2).
- **The app already uses `createTenantScopedElectricAdapter`** for predicate
  validation; the migration to `syncShapesToTables` is internal to
  `electric-sync.ts` (the factory currently calls `syncShapeToTable` per
  entity at line 376).
- **Stores honestly label their reads** "REST fallback for the entity graph"
  → deleting them is low-risk once `useLiveQuery` covers the table.

---

## Change list (ordered)

Execution order encodes dependencies. S1 is the mechanism upgrade everything
else rides on. S2 expands coverage. S3–S5 retire the duplicate reads feature
by feature. S6 lands pgvector. S7 verifies + corrects docs.

| # | Change ID | Title | Depends on | Agent |
|---|---|---|---|---|
| 1 | `change-S01-multitable-sync-engine` | Migrate Electric ingress to a single transactional `syncShapesToTables` | — | database-reviewer → typescript-reviewer |
| 2 | `change-S02-sync-config-coverage` | Add all duplicate-fetching domains to `SYNC_CONFIG` (+RLS coherence) | S01 | database-reviewer |
| 3 | `change-S03-sales-leadradar-local-reads` | Convert deals/sales-activity + lead-radar stores to write-only; reads via `useLiveQuery` | S02 | typescript-reviewer |
| 4 | `change-S04-billing-ops-local-reads` | Convert invoices/approvals/time-entries/subcontracts stores to write-only | S02 | typescript-reviewer |
| 5 | `change-S05-settings-company-local-reads` | Convert settings + company-services/team/tiers reads to local | S02 | typescript-reviewer |
| 6 | `change-S06-pgvector-semantic-search` | Load `pgvector`; synced `embedding` columns + local `<=>` hook (D1) | S02 | database-reviewer → ai-engineer |
| 7 | `change-S07-verify-and-doc-correction` | Network-zero Playwright proof + correct stale CLAUDE.md / sync-policy | S03–S06 | e2e-runner |

---

## Per-change detail

### change-S01 — multitable-sync-engine
**Why:** Today `electric-sync.ts` loops `syncShapeToTable` once per entity
([line 376](../../../src/shared/db/electric-sync.ts)). That gives no
cross-table transactional consistency and N independent "synced" signals —
the source of the hydration-race the repo already has tests for
(`electric-sync-hydration-race.spec.ts`). `syncShapesToTables`
([PGlite docs](https://pglite.dev/docs/sync)) lands a server transaction
atomically and fires one `onInitialSync`.

**What changes:**
- Rewrite the `attachShape` factory to build a `shapes` record from
  `SYNC_CONFIG` and issue **one** `db.electric.syncShapesToTables({ shapes, key, onInitialSync, onError })`.
- Keep `createTenantScopedElectricAdapter` predicate validation per table.
- Boot gate ([`sync-gate.tsx`](../../../src/app/sync-gate.tsx)) flips
  "synced" on the single `onInitialSync` instead of counting N subs.
- Preserve `shapeKey`/`key` persistence for resumable streams.

**Risk / watch:** PGlite limitation — *cannot sync two shapes into the same
table*. Confirm no table appears twice (the two-class metadata_type shape is
one shape with an OR predicate — fine). `must-refetch` handling via
`onMustRefetch`.

**Acceptance:** existing sync tests green; one `onInitialSync`; no behavior
change for the 12 already-synced tables (regression baseline).

---

### change-S02 — sync-config-coverage
**Why:** The duplicate calls are tables missing from `SYNC_CONFIG`
(assessment §3.1).

**What changes — add to `SYNC_CONFIG` + `EMIT_ORDER`, regenerate schema:**

| Table | tenantColumn / shapeWhere | RLS coherence | Notes |
|---|---|---|---|
| `sales_activity` | `company_id` | `company_id = current_company_id()` ✅ direct | Tier A (writeable) |
| `lead` | `company_id` | direct ✅ | Tier A |
| `attorney` | `company_id` (direct) | RLS is EXISTS-subquery; **verify direct ⊆ EXISTS** | shape can't use subquery |
| `invoice` | `company_id` | direct ✅ | Tier B read-mostly (decide A/B) |
| `time_entry` | `company_id` | direct ✅ | Tier A |
| `subcontract_request` | `company_id` | direct ✅ | Tier A |
| `subcontract_assignment` | `company_id` | direct ✅ | Tier A |
| `settings_type` | `company_id` | direct ✅ | Tier B |
| `service` | `company_id` | direct ✅ | for company catalog |
| `tier` | **indirect** | needs custom `shapeWhere` or stays REST | **DECISION POINT** |

- Run `pnpm gen:pglite-schema`; bump `BUNDLED_PGLITE_SCHEMA_VERSION`.
- Add `*_local` shadow + INSTEAD-OF triggers for Tier-A additions
  (generator does this).
- For each, confirm the RLS policy exists (it does for all but `tier`'s
  indirect case) and the lint passes.

**Risk / watch:** `attorney` subquery; `tier` indirection; shape memory for
large historical tables (`time_entry`, `invoice`) — consider column
projection to drop heavy blobs (assessment notes `columns?` exists for this).

**Acceptance:** `sync-config-rls-coherence` lint green; schema regenerates;
all new tables hydrate into PGlite on boot.

---

### change-S03 — sales-leadradar-local-reads
**Why:** `sales-activity-store.ts` (9 `.from('sales_activity')` + 5
`.from('attorney')`) and `lead-radar-store.ts` re-GET on every visit.

**What changes:**
- Replace store read-fetchers with feature hooks that call `useTierAQuery`
  / `useLiveQuery` over the now-synced `sales_activity`, `attorney`, `lead`
  views.
- Stores retain **only** create/update/delete (already routed through
  `local_writes` triggers for Tier-A tables).
- Delete dead REST `load*` fetchers; update any hook that imported them.

**Risk / watch:** `attorney` join shape used by deals — confirm local view
satisfies the in-detail matrix reads. RULE B/C/D layering preserved.

**Acceptance:** Sales + LeadRadar 2nd-visit network reads = 0; UI parity
unchanged.

---

### change-S04 — billing-ops-local-reads
**Why:** `invoices`, `approvals`, `time-entries`, `subcontracts` stores each
REST-fetch on mount.

**What changes:** same recipe as S03 for `invoice`, `time_entry`,
`subcontract_request`, `subcontract_assignment`. Reads → `useLiveQuery`;
stores → writes only.

**Risk / watch:** `approvals` reads may be derived/joined across invoice +
time_entry — confirm the local views cover the approval queue query.

**Acceptance:** Invoices/Approvals/T&E/Subcontracts 2nd-visit reads = 0.

---

### change-S05 — settings-company-local-reads
**Why:** `settings-store.ts` (settings_type, entity_setting) and
`company-store.ts` services/team/tiers REST-fetch.

**What changes:**
- `settings_type` + `entity_setting` reads → local (entity_setting already
  partially synced; extend per the v0.2 split noted in sync-config.ts:126).
- company `service` catalog + team (`user_info` already synced) reads →
  local.
- `tier`: if S02 kept it REST (indirect tenant scope), document why it
  remains a server fetch; otherwise convert.

**Risk / watch:** `entity_setting` v0.1 only synced company-owned rows;
user/template-owned settings were intentionally server-only. Decide whether
this phase closes that gap or documents it as remaining REST.

**Acceptance:** Settings + Company-config 2nd-visit reads = 0 (or documented
exceptions for genuinely user/template-scoped settings).

---

### change-S06 — pgvector-semantic-search (D1)
**Why:** the "pglite/pgvector" half of the goal is 0% built (assessment §3.4).
User chose **D1**: server-generated embeddings synced as vector columns.

**What changes:**
- Load the `pgvector` extension in
  [`pglite.worker.ts`](../../../src/shared/db/pglite.worker.ts) (alongside
  `live` + `electricSync`).
- Add `embedding vector(N)` to the search entities (candidates per
  assessment: `client`, `trial`, `lead`) on the server migration AND the
  generated local schema; embeddings sync as ordinary columns via S01's
  multi-table sync.
- Add a `useSemanticSearch` shared hook running a local `ORDER BY embedding
  <=> $query LIMIT k` over PGlite.
- Server-side embedding generation (model + trigger/edge function) is a
  **latest-data** task — this change defines the column contract + local
  query; note the server dependency.

**DECISION POINTS (resolve at change start):**
- Embedding **dimension N** + server model (e.g. 384 / 768 / 1536).
- Which entities get search (confirm client/trial/lead).
- HNSW vs IVFFlat index in PGlite (or none at expected row counts).

**Risk / watch:** vector column size vs shape memory (S01 limitation); ensure
`columns?` projection doesn't drop the embedding.

**Acceptance:** worker loads pgvector; ≥1 entity returns local `<=>`
similarity results with no network call; embeddings arrive via sync only.

---

### change-S07 — verify-and-doc-correction
**Why:** prove the invariant and fix the stale docs surfaced in assessment §7.

**What changes:**
- Playwright spec: load app, visit each migrated route twice, assert **0**
  entity-read network requests on the 2nd visit (the phase's headline gate).
- Correct [`src/shared/db/CLAUDE.md`](../../../src/shared/db/CLAUDE.md): the
  Change-13 entity-graph files are NOT delivered — remove the false
  "delivered" claim, document the actual `useLiveQuery` pattern.
- Update [`sync-policy.md`](../../../docs/architecture/sync-policy.md): promote
  the now-synced tables out of "future Tier-A".
- Re-document the misleading "REST fallback for the entity graph" store
  comments.

**Acceptance:** `pnpm typecheck && pnpm lint && pnpm test` green; network-zero
Playwright spec green; docs match reality.

---

## Out of scope (this phase)

- Full entity-graph adoption (`startLocalFirstGraph` / `useEntityList`) —
  that is Option C, a separate future phase.
- TanStack DB migration (Option A4) — not pursued.
- Client-side embedding generation (D2) — user chose D1.
- Server-side embedding model implementation — lives in latest-data; this
  phase defines the synced-column contract and the local query only.
- Document/e-sign Edge-Function `fetch()` calls in
  view/sign-document pages — genuine side-effects, not duplicate reads;
  a layering cleanup tracked separately.

---

## Verification commands

```bash
pnpm gen:pglite-schema      # after S02 / S06 schema changes
pnpm typecheck
pnpm lint                   # boundaries + sync-config-rls-coherence (RULE 5)
pnpm test
pnpm test:e2e               # incl. S07 network-zero spec
```
