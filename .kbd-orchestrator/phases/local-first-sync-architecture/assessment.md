# Assessment — local-first-sync-architecture

> **Phase type:** Assessment only — no code changes.
> **Goal:** Design the most complete, elegant PGlite/pgvector local-sync
> architecture and eliminate ALL duplicate network calls for data that
> should load once and sync thereafter.
> **Input doc:** [`docs/architecture/hotseaters-local-first-architecture.md`](../../../docs/architecture/hotseaters-local-first-architecture.md)
> (an aspirational design written against the entity-graph API).
> **Date:** 2026-06-01

---

## 0. TL;DR

The input design doc describes an **entity-graph** runtime
(`startLocalFirstGraph` + `useEntityList`/`queryOnce` + module-scoped
graph) that **does not exist in this app**. The real runtime is a
hand-rolled **"Pattern 4 / through-the-database"** stack:
PGlite + `@electric-sql/pglite-sync`'s `syncShapeToTable` (one shape per
entity) + `useLiveQuery` from `@electric-sql/pglite-react`. Reads of
synced data are already local and duplicate-free. The real duplicate-
network-call problem is **scope**, not **mechanism**:

- **12 tables sync** (clients/trials/company/user_info/metadata family).
- **~7 feature domains do NOT sync** and REST-fetch on every visit:
  `deals`, `lead-radar`, `invoices`, `approvals`, `time-entries`,
  `subcontracts`, `settings`. These are the duplicate calls.
- **pgvector / embeddings: entirely absent.** Zero vector columns, zero
  embedding pipeline. The "pglite/pgvector" goal is unimplemented.
- The `prometheus-entity-management` graph layer the doc assumes **is
  published** (`startLocalFirstGraph`, `createPGlitePersistenceAdapter`,
  `createTenantScopedElectricAdapter` all exist in the package) but the
  app only consumes the *tenant-validation* slice of it, not the
  *graph read* slice.

Three coherent options follow in §5. **Recommendation: Option B**
(expand the existing through-the-database pattern to full table
coverage via `syncShapesToTables`, kill the non-synced REST stores, add
a pgvector sidecar). It is the lowest-risk path that actually eliminates
every duplicate call and lands pgvector, without betting the app on a
larger graph-layer migration.

---

## 1. What the goal actually is

"Eliminate ALL duplicate network calls for data we should have loaded
once and just sync on" decomposes into three measurable invariants:

1. **Load-once:** every tenant-scoped entity the app reads is fetched
   exactly once per session (initial shape sync), then served from
   PGlite. Re-navigating a route fires **zero** network reads.
2. **Sync-not-poll:** updates arrive as Electric shape deltas /
   Supabase realtime — never as a re-`GET`.
3. **Single-writer ingress:** all server→client data enters through one
   boot path, not N per-feature loaders.

"pglite/pgvector based" adds a fourth:

4. **Local semantic search:** embeddings live in PGlite (pgvector /
   `pg_embedding`) so similarity queries run locally with no network.

The assessment below scores the current implementation against all four.

---

## 2. Ground truth — what is actually built

### 2.1 The real read/sync path (verified in code)

| Concern | Reality | Evidence |
|---|---|---|
| Local DB | `PGliteWorker`, per-user IDB, **module-scoped singleton** (cached by userId) | [`pglite-client.ts`](../../../src/shared/db/pglite-client.ts) — `dbCache` Map |
| Server→local sync | **per-entity** `db.electric.syncShapeToTable(...)` in a loop over `SYNC_CONFIG` | [`electric-sync.ts:376`](../../../src/shared/db/electric-sync.ts) |
| Tenant safety | `createTenantScopedElectricAdapter` validates each shape predicate ⊆ RLS | [`electric-sync.ts:261`](../../../src/shared/db/electric-sync.ts) |
| Reads | `useLiveQuery` over the unified `*_synced ∪ *_local` view; **no REST on read** | [`use-tier-a-query.ts:69`](../../../src/shared/hooks/use-tier-a-query.ts) |
| Writes | INSTEAD-OF triggers → `local_writes` → `write-sync` drain → Supabase REST | [`write-sync.ts`](../../../src/shared/db/write-sync.ts), [`local-schema.sql`](../../../src/shared/db/local-schema.sql) |
| Realtime | `startRealtimeChannels` for single-row latency-sensitive rows (user_info, company) | [`realtime-channels.ts`](../../../src/shared/db/realtime-channels.ts) |
| Boot composition | one React gate, fires once after auth | [`sync-gate.tsx`](../../../src/app/sync-gate.tsx) |

**This is a genuinely good local-first core.** Singletons are correct
(§2.3). Synced reads are already duplicate-free. The "dashboard fires a
dozen requests on every visit" symptom from the input doc **does not
reproduce for synced entities** — those read `useLiveQuery`.

### 2.2 The entity-graph the input doc assumes is NOT wired

`src/shared/db/CLAUDE.md` lists `entity-graph-bootstrap.ts` and
`graph-persistence-adapter.ts` as **delivered (Change 13)**. They do
**not exist**:

```
entity-graph-bootstrap.ts   → MISSING
graph-persistence-adapter.ts → MISSING
```

So every code snippet in the input doc (`startLocalFirstGraph`,
`useEntityList`, `queryOnce`, `createGraphAction`, `createGraphEffect`,
`registerSchema`) describes an architecture the app never adopted. The
doc is a **design proposal**, not a description of the codebase. **CLAUDE.md
is stale on this point and should be corrected** (flagged as a defect,
not fixed in this phase).

The library itself *does* publish these APIs
(`latest-data/packages/prometheus-entity-management/src/local-first-runtime.ts`,
`adapters/pglite-persistence.ts`, `adapters/electricsql-tenant.ts`), so
Option C (full graph adoption) is feasible — it's a choice, not a blocker.

### 2.3 Singletons — correct (no per-route re-instantiation)

| Runtime object | Scope | Verdict |
|---|---|---|
| PGlite worker | module-scope `dbCache` keyed by userId | ✅ once per user |
| Supabase client | module-scope singleton | ✅ |
| Electric shapes | started once in `startTenantSync` | ✅ |
| Realtime channels | started once in `startRealtimeChannels` | ✅ |
| Zustand stores | module-scope `create(...)` | ✅ |

The input doc's "move PGlite/RealtimeManager to module scope" fix is
**already done**. This is not a gap.

---

## 3. The REAL duplicate-network-call inventory

The duplicate calls are **not** in synced features — they're in features
that were never added to `SYNC_CONFIG` and therefore REST-fetch on every
mount. 67 `.select()/.from()/fetch()` sites exist outside the db seam;
the material ones break down as:

### 3.1 Non-synced domains (PRIMARY problem — every visit re-fetches)

| Feature | Store fetch sites | In SYNC_CONFIG? | Consequence |
|---|---|---|---|
| `deals` / sales-activity | 11 `.select()` ([sales-activity-store.ts](../../../src/features/deals/stores/sales-activity-store.ts)) | ❌ | activities/attorneys/clients re-GET on every Sales visit |
| `company` | 18 `.select/.update` ([company-store.ts](../../../src/features/company/stores/company-store.ts)) | partial (company row syncs; services/team/tiers REST) | service catalog + team re-GET |
| `lead-radar` | 3 `.select()` (leads, activities, attorneys) | ❌ | full re-load on every LeadRadar visit |
| `settings` | 4 | ❌ | re-GET |
| `subcontracts` | 3 | ❌ | re-GET |
| `invoices` | 1 (wide column list) | ❌ | re-GET |
| `approvals` | 1 | ❌ | re-GET |
| `time-entries` | 1 | ❌ | re-GET |

These stores are honestly labelled — company-store:24 literally reads
`"Read fetchers (used by hooks as REST fallback for the entity graph)"`
— but since **the entity graph was never built**, the "fallback" is the
*only* path, so it runs every time. **This is the entire duplicate-call
surface.** Eliminating it = adding these tables to sync.

### 3.2 RULE B violations (component-level fetch)

| File | Lines | Issue |
|---|---|---|
| [`view-document-page.tsx`](../../../src/features/documents/pages/view-document-page.tsx) | 124, 155 | `await fetch(functionUrl)` in a page component |
| [`sign-document-page.tsx`](../../../src/features/documents/pages/sign-document-page.tsx) | 179, 305, 328 | three `fetch()` in a page component |

These call **Edge Functions** (e-sign/document render), not entity reads
— they are genuine server-required side-effects, not duplicate data
loads. They violate the layering rule (should move to a store) but they
are **not** part of the load-once problem. Classify as a separate
clean-up, not a sync target.

### 3.3 Unstable-query-key bug — LOW risk currently

`useLiveQuery` keys off the SQL string + params array, not an object
literal, so the "inline filter remints the key" failure mode from the
input doc §3 mostly doesn't apply here. No confirmed violations. (It
*would* apply if Option C's `useEntityList({filter})` is adopted — note
for that option.)

### 3.4 pgvector — ABSENT (the unmet half of the goal)

- No `vector` column in [`local-schema.sql`](../../../src/shared/db/local-schema.sql) or the common schema.
- No embedding generation, no `<=>`/cosine query, no `pgvector`/`pg_embedding` PGlite extension loaded in [`pglite.worker.ts`](../../../src/shared/db/pglite.worker.ts).
- The user's framing ("pglite/pgvector based") is currently **aspirational** — there is nothing to assess, only to design.

---

## 4. Inventory of ALL implementation methods (the full menu)

Researched against PGlite/Electric/TanStack primary docs (2025) plus the
in-repo `prometheus-entity-management` package. Every viable method for
"load once, sync, never re-fetch" in this stack:

### A. Sync-into-local-DB methods (server → PGlite)

| # | Method | What it is | Fit here |
|---|---|---|---|
| A1 | **`syncShapeToTable` (per entity)** — *current* | One Electric shape → one PGlite table, looped over a config. | In use. Works; no cross-table transactional consistency. |
| A2 | **`syncShapesToTables` (multi-table)** | One subscription syncs N shapes with **transactional consistency** (a server tx lands atomically in PGlite). One `onInitialSync` for the whole set. | ⭐ Direct upgrade of A1. Removes partial-hydration races, single boot signal. ([PGlite docs](https://pglite.dev/docs/sync)) |
| A3 | **`prometheus-entity-management` graph + `createTenantScopedElectricAdapter` + `createPGlitePersistenceAdapter`** | Library-owned graph store; shapes feed normalized nodes; snapshot persists for warm start; reads via `useEntityList`/`queryOnce`. | The input-doc design. Powerful, but a full read-layer migration. |
| A4 | **TanStack DB Electric collections** | `electricCollection` + differential-dataflow live queries; sub-ms cross-collection joins, local writes with rollback. | Modern, elegant, but **replaces** the Zustand+useLiveQuery read layer wholesale and adds a dep. ([Electric×TanStack](https://electric.ax/blog/2025/07/29/super-fast-apps-on-sync-with-tanstack-db)) |
| A5 | **Raw `ShapeStream` + manual apply** | Hand-roll shape consumption. | No reason to; A1/A2 wrap this. |
| A6 | **Supabase Realtime only (no Electric)** | `postgres_changes` deltas into `*_synced`. | Already used for single-row latency cases; not a bulk-load mechanism (no historical backfill/resumability). |

### B. Read / reactivity methods (PGlite → React, no refetch)

| # | Method | Fit |
|---|---|---|
| B1 | **`useLiveQuery` (pglite-react)** — *current* | In use; reactive local reads, zero refetch. Good. |
| B2 | **`useEntityList`/`useEntityView`/`queryOnce` (entity graph)** | Comes with A3; normalized graph reads + reactive aggregates. |
| B3 | **TanStack DB `useLiveQuery`** | Comes with A4; differential-dataflow, fastest re-render, in-memory joins. |
| B4 | **Manual PGlite `live.query` subscriptions** | What B1 wraps; no need to drop down. |

### C. Write methods (already solved, listed for completeness)

| # | Method | Fit |
|---|---|---|
| C1 | **INSTEAD-OF triggers → `local_writes` → drain → REST** — *current* | In place, offline-capable, optimistic. Keep. |
| C2 | Electric write-path (`@electric-sql/*` through-the-DB write) | Equivalent philosophy; the repo's trigger-based version is bespoke but working. |
| C3 | TanStack DB optimistic mutations | Comes with A4 only. |

### D. pgvector / semantic-search methods (the missing capability)

| # | Method | What it is | Fit |
|---|---|---|---|
| D1 | **PGlite `pgvector` extension + synced `embedding vector(N)` column** | Embeddings are a server column, synced via the same shape as the row; similarity (`<=>`) runs locally. | ⭐ Cleanest. Embeddings ride existing sync; no extra network. Requires server-side embedding generation + adding the extension to the worker. |
| D2 | **Local embedding generation (Transformers.js) + local-only vector table** | Embed in-browser, store in PGlite, never round-trip. | Heaviest client bundle; good for privacy/offline-pure; overkill unless embeddings must be local-only. |
| D3 | **Server-side pgvector, REST/RPC similarity (no local vectors)** | Keep vectors server-side, query via RPC. | ❌ Re-introduces per-query network calls — violates the load-once goal. Rejected. |

---

## 5. Three options (built from the menu above)

### Option A — "Tidy the edges" (minimal)
**Composition:** keep A1 + B1 + C1. Add the ~7 missing domains to
`SYNC_CONFIG` one by one (still per-entity `syncShapeToTable`). Delete
the now-dead REST `.select()` fetchers in those stores. pgvector via D3
(server RPC) *or* deferred.

- **Eliminates duplicate calls?** Yes for the added tables.
- **Cross-table consistency?** No (per-shape races remain).
- **pgvector?** Weakly (D3 keeps network) or not at all.
- **Effort:** Low. **Elegance:** Low — entrenches the per-entity loop and the misleading "fallback" stores.
- **Risk:** Low.

### Option B — "Complete the through-the-database pattern" ⭐ RECOMMENDED
**Composition:** **A2** (migrate the loop to one `syncShapesToTables`
call covering *all* tenant tables) + **B1** (keep `useLiveQuery` — no
read-layer churn) + **C1** (keep the working write path) + **D1**
(pgvector extension + synced `embedding` columns).

Concretely:
1. Move every duplicate-fetching domain (deals, lead-radar, invoices,
   approvals, time-entries, subcontracts, settings, company services/
   team/tiers) into `SYNC_CONFIG` with correct `shapeWhere ⊆ RLS`.
2. Replace the per-entity `syncShapeToTable` loop with one
   `syncShapesToTables({ shapes, key, onInitialSync })` → transactional
   multi-table consistency + a single real "synced" signal for the boot
   gate (fixes the hydration-race the existing tests already chase).
3. Delete the REST read-fetchers in the migrated stores; stores keep
   only writes (which already go through `local_writes`).
4. Load `pgvector` in `pglite.worker.ts`; add `embedding vector(N)` to
   the entities that need search (clients, trials, leads); server
   generates embeddings; they sync as ordinary columns; local `<=>`
   similarity hook.

- **Eliminates duplicate calls?** **Completely** — every entity loads once, reads are local, writes drain async.
- **Cross-table consistency?** Yes (A2).
- **pgvector?** Yes, local, no per-query network (D1).
- **Effort:** Medium. **Elegance:** High — one ingress, one read pattern, honest stores.
- **Risk:** Medium-low — same primitives the app already uses, scaled up. Biggest task is writing correct RLS-coherent `shapeWhere` per new table (CI rule already enforces coherence).

### Option C — "Adopt the entity graph" (the input doc's vision)
**Composition:** **A3 + B2** — wire `startLocalFirstGraph` +
`createPGlitePersistenceAdapter` + `createTenantScopedElectricAdapter`,
migrate all reads from `useLiveQuery` to `useEntityList`/`queryOnce`,
add `createGraphAction` for optimistic writes, `createGraphEffect` for
notifications, pgvector via D1.

- **Eliminates duplicate calls?** Yes, and adds normalized-graph
  relational reads + reactive aggregates + warm-start snapshot.
- **pgvector?** Yes (D1).
- **Effort:** **High** — touches every feature's read hooks (13+
  `useLiveQuery` sites + all stores), introduces the unstable-query-key
  class of bug (§3.3), and depends on graph APIs the app has never
  exercised in production.
- **Elegance:** Highest *if* fully adopted. **Risk:** High — largest
  blast radius during an active page-parity hardening phase; reintroduces
  a migration (Change 13) that was already abandoned once.

*(TanStack DB / A4+B3 is a fourth, even larger rewrite — noted in §4 but
not advanced as an option: it discards the repo's Zustand+trigger
investment for a new dependency, which contradicts the "surgical,
preserve what works" project discipline.)*

---

## 6. Recommendation — Option B

**Pick Option B.** Reasoning:

1. **It targets the actual bug.** The duplicate calls are non-synced
   domains REST-fetching on every visit (§3.1), not a broken read
   mechanism. Option B fixes exactly that by extending sync coverage —
   no read-layer rewrite needed.
2. **It keeps everything that already works.** `useLiveQuery`, the
   trigger/`local_writes`/drain write path, per-user IDB isolation, the
   tenant-scoped adapter's RLS validation — all proven, all retained.
   This honors the project's "surgical changes / don't refactor what
   isn't broken" discipline.
3. **`syncShapesToTables` is a genuine upgrade, not a gamble.** It's the
   same vendor, same mental model, and it *removes* a known class of bug
   (partial-hydration races the repo already has tests for) by making
   multi-table sync transactional with one boot signal.
4. **It lands pgvector the cheap way (D1).** Embeddings become synced
   columns — they inherit load-once for free and never re-hit the
   network for similarity. This satisfies the "pglite/pgvector" half of
   the goal that is currently 0% built.
5. **It avoids re-opening an abandoned migration.** Option C is
   literally the Change-13 entity-graph work that was started, written
   into CLAUDE.md as "done," and then not delivered. Re-committing to it
   mid-parity-hardening is high-risk. Option B reaches the same
   load-once invariant without it. (Option C remains a reasonable
   *future* phase once parity hardening closes.)

**Option B is the most complete, elegant result reachable at acceptable
risk:** one ingress (`syncShapesToTables`), one read pattern
(`useLiveQuery`), honest write-only stores, local pgvector. Every
tenant-scoped datum loads exactly once and updates by sync — zero
duplicate network calls.

---

## 7. Gaps / corrections surfaced (for the plan phase, not fixed here)

1. **CLAUDE.md (`src/shared/db/CLAUDE.md`) is stale** — claims Change 13
   entity-graph files are delivered; they don't exist. Correct the
   "delivered" table.
2. **`company-store.ts:24` comment** ("REST fallback for the entity
   graph") is misleading — there is no graph; it's the primary path.
   Re-document or remove once Option B migrates the reads.
3. **`sync-policy.md` lists future Tier-A tables** (Invoice, BillPayment,
   TimeEntry, Expense) "future" — Option B promotes them to actual.
4. **RLS coherence is the gating work** — every new `SYNC_CONFIG` entry
   needs a `shapeWhere ⊆ CREATE POLICY` in latest-data migrations; the
   `hotseaters/sync-config-rls-coherence` lint already enforces this, so
   missing policies will block — inventory them during planning.
5. **pgvector dimension + embedding source** must be decided (server
   model? which entities get search?) before D1 can be specified.

---

## 8. Definition of done for the eventual implementation phase (Option B)

- Every feature that today REST-fetches tenant data on mount instead
  reads `useLiveQuery`; its store retains writes only.
- `electric-sync.ts` uses a single `syncShapesToTables` subscription;
  boot gate flips "synced" on one `onInitialSync`.
- Re-navigating any route fires **0** entity-read network requests
  (verifiable: Playwright network assertion on a second visit).
- `pgvector` loaded in the worker; at least one entity carries a synced
  `embedding` column with a working local `<=>` similarity hook and no
  per-query network.
- Every new `SYNC_CONFIG` shape has a matching RLS policy (CI green on
  `sync-config-rls-coherence`).
- `pnpm typecheck && pnpm lint && pnpm test` green; CLAUDE.md corrected.
