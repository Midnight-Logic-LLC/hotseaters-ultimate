# Feature Template

> Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

This is the mechanical guide for adding a new feature to `hotseaters-ultimate`.
Follow the steps in order. The architectural invariants are CI-enforced —
deviating means a failed build, not a debate.

## Glossary

- **Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/`. The legacy
  app whose behavior, copy, fields, and order you are matching.
- **Tier:** how a server table relates to PGlite (`A` = synced + writeable
  offline, `B` = synced read-only, `C` = server-only / REST on demand). See
  the plan §0.12.
- **Aggregate:** the root entity + its tightly-owned children (e.g.
  `Client` + `ClientAddress`).

## Worked example: `attorneys`

The steps below are illustrated for the upcoming `attorneys` feature, which
will introduce an `attorney` table (`company_id` scoped, accessed in trial
flows). The bible page is `HotSeatersMVP/src/pages/Attorneys.jsx` (and the
matching components under `src/components/attorneys/`). Adjust paths and
names for your feature.

---

## Step 0 — Decide the sync tier

Walk the checklist in plan §0.12. The new entity is **Tier A** only if
**every** answer is yes:

- [ ] **Tenant-scoped:** has a `company_id` column (or a precise transitive
  scoping path that the Electric shape can encode).
- [ ] **Bounded working set:** per-tenant row count expected to stay below
  ~10⁵ over typical lifetime.
- [ ] **Hot read path:** primary UI flows would visibly degrade if every
  read round-tripped to Supabase.
- [ ] **Editable offline or read-frequently:** justifies the storage + sync cost.
- [ ] **No regulated raw data:** not financial raw rows, not signed-document
  blobs, not raw audit trails.

If one answer is no:

- All synced reads, no offline writes → **Tier B** (`*_synced` only, view
  aliases the synced table).
- Heavy / regulated / rarely-touched → **Tier C** (no PGlite presence; the
  store fetches via Supabase REST on demand and feeds the entity graph).

For `attorney`:

| Question | Answer |
|---|---|
| Tenant-scoped? | Yes — `company_id` FK. |
| Bounded? | Yes — a tenant has at most a few thousand attorneys. |
| Hot read path? | Yes — picked in every trial-contact form. |
| Offline / read-frequently? | Yes — read frequently, occasional writes. |
| No regulated raw data? | Yes — public-record contact info only. |

→ **Tier A.**

## Step 1 — Add the entity to `src/shared/db/sync-config.ts`

Open `src/shared/db/sync-config.ts` and add an entry to the `SYNC_CONFIG`
array. Keep the order FK-dependency-correct (parents before children).

```ts
// src/shared/db/sync-config.ts
export const SYNC_CONFIG: SyncEntityConfig[] = [
  // ...existing entries...
  {
    name: 'attorney',
    tier: 'A',
    tenantColumn: 'company_id',
    notes: 'Per-trial contact lookup; read on every trial form.',
  },
];
```

Tier-B example (read-only):

```ts
{
  name: 'notification',
  tier: 'B',
  tenantColumn: 'company_id',
  shapeWhere: (cid) => `company_id = ${cid} AND created_at > now() - interval '30 days'`,
  notes: 'Last 30 days only; older entries fetched on demand.',
}
```

Tier C is **not** added here. If you decided Tier C, skip to step 3 and
build the store to call Supabase REST directly.

## Step 2 — Regenerate the PGlite local schema

```bash
pnpm gen:pglite-schema
```

This rewrites `src/shared/db/local-schema.sql`. The generator reads
`sync-config.ts` plus the migrations in
`latest-data/supabase/migrations/` and emits the `*_synced` / `*_local` /
view trio (Tier A) or just `*_synced` (Tier B).

Commit the regenerated file. CI runs
`pnpm gen:pglite-schema:check` and fails on drift.

## Step 3 — Add RLS policies

Open the most recent `*_rls_policies*.sql` migration in
`latest-data/supabase/migrations/`. If the feature is large enough to
deserve its own migration, create one:

```bash
cd ../latest-data
pnpm db:migration:new attorneys_rls
```

Add policies for every action the UI needs (`SELECT`, `INSERT`, `UPDATE`,
`DELETE`). Use the helpers from the bridge migration:
`public.current_user_info()`, `public.current_company_id()`,
`public.current_user_role()`.

```sql
-- latest-data/supabase/migrations/<ts>_attorneys_rls.sql
ALTER TABLE public.attorney ENABLE ROW LEVEL SECURITY;

CREATE POLICY attorney_tenant_read ON public.attorney
  FOR SELECT
  USING (company_id = public.current_company_id());

CREATE POLICY attorney_role_write ON public.attorney
  FOR INSERT
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.current_user_role() IN ('Owner', 'Admin', 'Sales')
  );

CREATE POLICY attorney_role_update ON public.attorney
  FOR UPDATE
  USING (company_id = public.current_company_id())
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.current_user_role() IN ('Owner', 'Admin', 'Sales')
  );

CREATE POLICY attorney_role_delete ON public.attorney
  FOR DELETE
  USING (
    company_id = public.current_company_id()
    AND public.current_user_role() IN ('Owner', 'Admin')
  );
```

**Coherence rule (RULE 5):** the Electric shape's `WHERE` predicate must be
a subset of the `SELECT` policy `USING (...)` clause. Above, the shape
predicate is `company_id = <cid>` (from `tenantColumn: 'company_id'`) which
is identical to the policy `USING` — coherent.

Apply locally:

```bash
cd ../latest-data
pnpm db:push    # or `supabase db reset` for a clean local
```

Regenerate TypeScript types:

```bash
pnpm db:types:generate
```

## Step 4 — Scaffold the feature directory

```bash
pnpm gen:feature attorneys
```

This creates `src/features/attorneys/` with this shape:

```
src/features/attorneys/
├── CLAUDE.md
├── entities.ts
├── business-rules/
│   ├── __tests__/
│   │   └── placeholder.test.ts
│   └── placeholder.ts
├── components/
│   └── AttorneysRow.tsx
├── hooks/
│   └── use-attorneys-list.ts
├── pages/
│   └── AttorneysListPage.tsx
└── stores/
    └── attorneys-store.ts
```

The script refuses to overwrite an existing directory.

## Step 5 — Fill in the layers

In strict dependency order, replace the TODOs:

### 5.1 `entities.ts`

- Replace the placeholder JSON Schema with the columns from
  `local-schema.sql` (read the view definition for the entity).
- Declare `registerSchema` relations for any child aggregates (e.g.
  `addresses: { cardinality: 'hasMany', targetType: 'AttorneyAddress', foreignKey: 'attorney_id' }`).
- The function must stay idempotent — it's called from `app-providers.tsx`.

### 5.2 `business-rules/*`

- One file per pure rule. No I/O. No React.
- One test file per rule under `__tests__/`.
- Source the rules from the bible. If the legacy file is
  `HotSeatersMVP/src/utils/attorneyName.js`, port the logic verbatim and
  add a comment linking back to it.

### 5.3 `stores/*`

- The ONLY layer in this feature allowed to import
  `@/shared/db/{pglite-client,supabase-client,electric-sync}`,
  `@electric-sql/*`, `@supabase/*`, or the entity-management
  `engine`/`adapters`.
- Register the entity with the entity graph engine at module load.
- Tier-A stores use the synced/local/view trio; Tier-C stores call
  `supabase.from('attorney')` directly and call `graph.upsert(...)`.

### 5.4 `hooks/*`

- Pure wrappers over `useEntity`, `useEntityList`, `useEntityCRUD`,
  `useEntityView`, `useGraphSyncStatus`.
- One hook per UI use case (`useAttorneysList`, `useAttorney`,
  `useAttorneyCrud`).
- Never call `fetch`, `supabase.*`, or PGlite.

### 5.5 `components/*` and `pages/*`

- Consume hooks only. No store imports. No fetch.
- Match the bible's labels, ordering, and behavior. UI may modernize the
  visual style; functional behavior must match.

### 5.6 Register entities at app start

In `src/app/app-providers.tsx`, call `registerAttorneyEntities()` next to
the other feature registrations (idempotent).

## Step 6 — Route + role guard

In `src/app/app-router.tsx`, add the route inside the authenticated shell:

```tsx
import { lazy } from 'react';
import { RoleGuard } from './role-guard';

const AttorneysListPage = lazy(
  () => import('@/features/attorneys/pages/AttorneysListPage'),
);

// ...inside the router config
{
  path: '/attorneys',
  element: (
    <RoleGuard allow={['Owner', 'Admin', 'Sales', 'Trial Consultant']}>
      <AttorneysListPage />
    </RoleGuard>
  ),
}
```

If the route must appear in navigation, also update
`src/app/navigation.ts` and (if a primary mobile destination)
`src/app/bottom-tab-bar.tsx`.

## Step 7 — Tests

Minimum bar:

- **Business-rule unit tests** under
  `src/features/<name>/business-rules/__tests__/*.test.ts`.
- **One Playwright e2e spec** under `e2e/attorneys.spec.ts` covering
  list → create → edit → delete with a seeded tenant.

Optional but recommended:

- Component tests for any complex form with conditional fields.
- A `*.bdd.ts` Cucumber-style spec for any multi-step workflow.

## Step 8 — Quality gates (must all pass before commit)

```bash
pnpm gen:pglite-schema:check  # no drift in local-schema.sql
pnpm typecheck
pnpm lint                     # eslint-plugin-boundaries enforces RULE 3
pnpm test                     # vitest
pnpm test:e2e                 # playwright (against the local stack)
```

If the boundaries rule fails, you have a component importing a store, a
hook calling `fetch`, or a store imported outside `src/shared/db` or
`src/features/*/stores/*`. Fix the layering, not the rule.

## PR description boilerplate

Every feature PR must include:

> Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.
>
> - Sync tier: <A / B / C>
> - Entity added to `sync-config.ts`: yes / N/A
> - `local-schema.sql` regenerated: yes / N/A
> - RLS policies added in `latest-data/supabase/migrations/<ts>_…`
> - Allowlist coherence: shape WHERE ⊆ RLS USING — verified
> - Tests: unit (X), e2e (Y)

## See also

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — what each layer is for.
- [`RUNBOOKS.md`](./RUNBOOKS.md) — operations and migrations.
- [`CODEMAP.md`](./CODEMAP.md) — where everything lives.
- Plan: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/phases/hotseaters-pglite-port/plan.md`
- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
- Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`
