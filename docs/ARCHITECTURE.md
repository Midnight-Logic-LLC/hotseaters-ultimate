# Architecture

> Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

This document is the high-level mental model for `hotseaters-ultimate`. Read
this first; then `FEATURE-TEMPLATE.md` for the mechanical steps and
`CODEMAP.md` for the file-tree mapping.

## 1. The four layers

Every feature is a vertical slice through four layers. The dependency
direction is strict and **CI-enforced** via `eslint-plugin-boundaries`.

```
┌──────────────────────────────────────────────────────────────┐
│ components / pages                                           │
│   read state from hooks; render UI; never touch I/O          │
└──────────────────────────────────────────────────────────────┘
                          ▲   consume
                          │
┌──────────────────────────────────────────────────────────────┐
│ hooks                                                        │
│   thin wrappers over entity-graph hooks                      │
│   useEntity / useEntityList / useEntityCRUD / useEntityView  │
└──────────────────────────────────────────────────────────────┘
                          ▲   consume
                          │
┌──────────────────────────────────────────────────────────────┐
│ stores  (features/*/stores  AND  shared/db)                  │
│   the ONLY layer allowed to touch PGlite / Electric /        │
│   Supabase / entity-management engine + adapters             │
└──────────────────────────────────────────────────────────────┘
                          ▲   sync
                          │
┌──────────────────────────────────────────────────────────────┐
│ data sources                                                 │
│   PGlite (WASM Postgres in a Web Worker)                     │
│   ElectricSQL (read-sync from Postgres)                      │
│   Supabase REST (writes, server-only entities)               │
└──────────────────────────────────────────────────────────────┘
```

A component that imports from `@/shared/db` or `@electric-sql/*` is a
**bug**. The boundaries plugin will block the PR.

## 2. PGlite: the synced / local / view trio

Every **Tier-A** server table maps to three PGlite objects plus one queue:

```
server.<table>
   │ Electric shape (tenant-scoped WHERE)
   ▼
PGlite._synced.<table>          ← canonical server rows (read-only locally)
PGlite._local.<table>           ← optimistic local rows + tombstones
PGlite.public.<table>           ← VIEW that merges synced ∪ local minus tombstones
                                   with INSTEAD-OF INSERT/UPDATE/DELETE triggers

PGlite._local.local_writes      ← FIFO queue of pending mutations
                                   drained by write-sync.ts
```

**Read path:** the UI reads the `public.<table>` view. The graph
normalizes rows by `(type, id)`. Hooks return graph-projected entities.

**Write path:**

1. Component calls a hook (`useAttorneyCrud().update(id, patch)`).
2. The hook → entity graph → store → INSERT/UPDATE/DELETE on the **view**.
3. The view's INSTEAD-OF trigger writes to `_local.<table>` and appends a
   row to `local_writes`. Optimistic update is visible immediately.
4. `pg_notify` wakes the write-sync drain.
5. `write-sync.ts` POSTs the pending mutation to Supabase REST.
6. Server commit propagates back through Electric → `_synced.<table>`.
7. The drain removes the satisfied row from `local_writes`.

**Tier-B** tables skip `_local` and `local_writes`; the view is just an
alias of `_synced.<table>`. **Tier-C** tables are not present in PGlite at
all — stores fetch them via Supabase REST on demand and feed the graph
manually.

PGlite has **no RLS**. Coherence with the server is enforced by:

- Electric shape `WHERE` predicates ⊆ corresponding RLS `USING` clauses.
- The tenant-scoped Electric adapter refuses to attach unscoped shapes.
- A CI lint compares shape predicates against the RLS policy source.

## 3. Electric shape sync + RLS coherence

```
Postgres (Supabase, self-hosted)
   │
   │  Electric reads the WAL
   ▼
Electric server (localhost:3133  OR  electricsql.prometheusags.ai)
   │
   │  shapes:  { table, where: company_id = <cid>, columns: […] }
   ▼
PGlite._synced.<table>  (one shape per Tier-A/B entity)
```

Shapes are registered **once**, at the app root (`src/app/app-providers.tsx`),
after authentication resolves a `companyId`. Every shape carries a tenant
predicate. Untenanted shapes are refused by the registry adapter.

The shape `WHERE` clause for table T must be a SUBSET of T's RLS `SELECT`
policy `USING` clause. The CI lint catches drift. See plan §0.10.

## 4. Auth bridge: `auth.users` ↔ `user_info`

```
auth.users (Supabase managed)
   id UUID PK
        ▲
        │ FK (auth_user_id UUID UNIQUE)
        │
public.user_info (our V2 table)
   id            UUID PK   ← app-facing identity
   auth_user_id  UUID UNIQUE FK → auth.users(id)
   legacy_id     TEXT UNIQUE NULL
   company_id    UUID FK → company(id)
   company_role  TEXT NOT NULL  -- Owner | Admin | Sales | Trial Consultant
```

**Invariants:**

1. `auth.users.id` is **never** an FK target in domain tables. Always
   indirect through `user_info.id`.
2. An `AFTER INSERT` trigger on `auth.users` creates a minimal
   `user_info` row with `auth_user_id` set, `company_id = NULL`, and the
   right initial role.
3. Invite flow: the existing `user_info` row gets its `auth_user_id`
   filled in on first OAuth/magic-link login.
4. RLS policies use `user_info.auth_user_id = auth.uid()` via the
   `public.current_user_info()` `SECURITY DEFINER` helper.

The bridge migration lives in
`latest-data/supabase/migrations/<ts>_auth_user_info_bridge.sql`.

## 5. Role model

| Role | Permissions | Route scope |
|---|---|---|
| Owner | Full; billing; subscriptions; HSH posting | Everything |
| Admin | Full operational; team mgmt; no billing | All except `/settings/billing` |
| Sales | Deals, clients, lead radar, proposals, time on own work, dashboards | `/sales`, `/deals`, `/clients`, `/trials` (read), `/schedule` (read), `/documents` (generate), `/time-tracking` (own) |
| Trial Consultant | View assigned trials, log time/expenses, read documents | `/trials`, `/schedule`, `/time-tracking`, `/time`, `/dashboard`, `/team`, `/profile`, `/documents` (read), `/notifications`, `/gigs`, `/help-wanted`, `/favorites` |
| System Admin (cross-tenant) | Admin tool only | `/admin` |

**Route enforcement:** `<RoleGuard allow={[…]}>` wraps each route element
in `src/app/app-router.tsx`. The guard reads `useCurrentRoles()` which is
backed by `useEntity('UserInfo', currentId)`.

**Server enforcement:** RLS. The guard is UX, not security.

## 6. Entity graph (`prometheus-entity-management` v1.3)

The entity graph is the **only** consumer-facing data API. There is no
TanStack Query. Stores feed normalized rows by `(type, id)` into the graph;
hooks read them out.

```
store.upsert({ type: 'Attorney', id, ...row })   ← write into graph
       │
       ▼
graph (normalized by type+id, with relations from registerSchema)
       │
       ▼
hooks:                                            ← read from graph
  useEntity('Attorney', id)
  useEntityList('Attorney', { where, sort })
  useEntityCRUD('Attorney')
  useEntityView('Attorney', viewKey)
  useGraphSyncStatus()
```

**Persistence adapter:** the PGlite-backed adapter syncs the graph to
`*_synced` views on subscribe and pushes mutations through the local-write
queue. Configured once in `src/shared/db/entity-graph-bootstrap.ts`.

**Tenant-scoped Electric adapter:** wraps shape registration; refuses
unscoped shapes (RULE 5).

## 7. Theme system

CSS custom properties are the source of truth. Tailwind v4 reads them via
`@theme inline`. The runtime applies/inverts them by writing to
`document.documentElement.style` through `applyThemeVars(name, mode)` in
`src/shared/lib/theme.ts`.

```css
:root {
  --color-surface: oklch(98% 0 0);
  --color-text: oklch(18% 0 0);
  --color-accent: oklch(68% 0.21 250);
  --text-base: clamp(1rem, 0.92rem + 0.4vw, 1.125rem);
  --space-section: clamp(4rem, 3rem + 5vw, 10rem);
  --duration-fast: 150ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Components reach for tokens via Tailwind utilities (`bg-surface`,
`text-accent`) — never hex literals. Animations target `transform`,
`opacity`, `clip-path`, `filter` only.

## 8. Mobile-first (Tauri primary, PWA fallback)

Every UI decision passes the question: *does this work in an iOS/Android
WebView?*

- Sidebar collapses to bottom-tab + drawer below `md`.
- Touch targets ≥ 44pt (enforced in `src/index.css`).
- `vaul` drawers for sheets; `ResponsiveModal` picks bottom-sheet on
  mobile, centered dialog on `md+`.
- COOP/COEP headers in both `vite.config.ts` (web) and
  `tauri.conf.json` `security.headers` (Tauri).
- PGlite-in-WebView is smoke-tested on iOS + Android emulators before any
  Tauri scaffold is "done."
- Safe-area insets honored on every shell surface.

## 9. Documentation as content

The legacy app's `Doc*.jsx` pages are retired. Manual content lives at
`content/user-manual/*.mdx`, paired with an `index.json` manifest. The
build pipeline compiles each MDX to:

- `dist/manual/<slug>.html` — fetched at runtime by `<ManualPage slug>`.
- `dist/manual/<slug>.json` — input to the embedding pipeline.

UX:

- `/manual` — TOC index from `index.json`.
- `/manual/<slug>` — fragment with anchor links, prev/next, client search.
- Mobile contextual help — `vaul` bottom sheet keyed off the current route.

## 10. RAG pipeline

`content/user-manual/` → chunks → pgvector → chat.

```
content/user-manual/*.mdx
   │
   │  scripts/embed-manual.mjs  (idempotent, content-hash skip)
   ▼
OpenAI text-embedding-3-small
   │
   ▼
Supabase Edge Function `embed-manual`
   │
   ▼
manual_documents  ─┬─►  manual_chunks (embedding vector(1536), HNSW)
                   │
                   ▼
        match_manual_chunks(query_embedding, threshold, count)
                   │
                   ▼
example-app /features/ai-chat  (@assistant-ui/react + @ai-sdk/openai)
   tool:  searchManual(query) → top-K chunks with citations
   citations link to /manual/<slug>#<anchor> in hotseaters-ultimate
```

Manual content has **public read** RLS on `manual_documents` and
`manual_chunks`. Writes are restricted to the service role.

The RAG chat ships in `example-app` for v0.1. The in-app help chat in
`hotseaters-ultimate` is v0.2 — it will reuse the same Edge Function.

## See also

- [`FEATURE-TEMPLATE.md`](./FEATURE-TEMPLATE.md) — how to add a feature.
- [`RUNBOOKS.md`](./RUNBOOKS.md) — operations.
- [`CODEMAP.md`](./CODEMAP.md) — file-tree.
- Plan: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
