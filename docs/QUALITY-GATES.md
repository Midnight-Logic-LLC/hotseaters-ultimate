# Quality Gates

This doc lists every CI quality gate for `hotseaters-ultimate`, what each
checks, and how to fix violations.

> **Hard rules carry through every gate:** self-hosted Supabase only,
> HotSeatersMVP is the bible, components → hooks → stores → APIs.

---

## 1. TypeScript — `pnpm typecheck`

Strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
Fix by reading the error and narrowing the type. No `any`, no `as unknown as`.

## 2. ESLint — `pnpm lint`

### 2a. `eslint-plugin-boundaries` (RULE 3)

Enforces the architectural layering:

- Components → hooks only. No store, API, PGlite, Electric, Supabase imports.
- Hooks → stores only.
- Stores own the API/sync seam.
- `business-rules/` and `entities.ts` are pure.

If a component needs server data, add a hook in `features/<x>/hooks/` that
calls `useEntity*`. If a hook needs to fetch, put the fetch in a store under
`features/<x>/stores/` or `src/shared/db/`.

### 2b. `hotseaters/sync-config-rls-coherence` (RULE 5)

Custom rule in `eslint-rules/sync-config-rls-coherence.js`. Reads
`src/shared/db/sync-config.ts`, finds every entity name + tier, then scans
`../latest-data/supabase/migrations/*_rls_policies*.sql` for matching
`CREATE POLICY ... ON public.<entity>`. Any synced entity without a policy is
an error — without server-side RLS, Electric would happily ship cross-tenant
rows into PGlite.

**To fix:** add a SELECT (and write) policy on the table in the next
migration under `latest-data/supabase/migrations/`. Use the existing
`current_company_id()` helper for tenant scoping. Never rely on PGlite to
enforce isolation.

### 2c. `hotseaters/no-server-state-in-usestate` (warning)

Flags `useState<Client>(...)`-style patterns where `Client` matches an
entity from SYNC_CONFIG. Heuristic — false positives are possible. Replace
with `useEntity('client', id)` / `useEntityCRUD('client')` /
`useEntityView('client', {...})`.

## 3. Custom-rule self-test — `pnpm lint:rules`

Runs `eslint-rules/_self-test.mjs` programmatically against
`sync-config.ts`. Cheap belt-and-suspenders check: if the custom rule fails
to load or wire up, this fails loudly before `pnpm lint` quietly skips it.

## 4. Bundle size — `pnpm size`

`size-limit.config.cjs` defines per-bundle budgets:

| Asset                          | Budget        |
|--------------------------------|---------------|
| `dist/assets/index-*.js`       | 180 KB gzip   |
| `dist/assets/index-*.css`      | 30 KB gzip    |
| `dist/assets/index-*.js` brotli| 160 KB (info) |

If over budget: code-split (dynamic `import()` heavy libs like Tiptap,
leaflet, recharts, jspdf, html2canvas — none should be in the initial
chunk). Run `vite-bundle-visualizer` (or `pnpm build && du -h dist/assets`)
to find the offender.

## 5. Lighthouse — `pnpm lh` (opt-in via PR label `lh`)

`.lighthouserc.json` runs Lighthouse against:

- `/login`
- `/dashboard`
- `/clients`
- `/trials`

Assertions:

| Category        | Min score |
|-----------------|-----------|
| Performance     | 0.85      |
| Accessibility   | 0.90      |
| Best practices  | 0.90      |
| PWA             | 0.90 (warn) |

Web-vitals budgets:

| Metric | Max |
|--------|-----|
| LCP    | 2.5 s |
| INP    | 200 ms |
| CLS    | 0.05 |

Not run on every PR (label-gated to keep CI cheap). Run locally when
shipping a major UI change.

## 6. DB drift — `pnpm db:diff`

Runs `supabase db diff --schema public --linked` against
`SUPABASE_DB_URL`, which is a **self-hosted** Postgres (docker-compose dev
stack or `hotbase.prometheusags.ai`). The workflow explicitly fails if the
URL contains `.supabase.co` (RULE 1).

A diff in CI means your migration didn't apply cleanly, or someone changed
the live schema out-of-band. Re-run migrations.

## 7. User manual — `pnpm manual:validate`

Runs `validate-user-manual.mjs` (frontmatter + structural) and
`validate-user-manual-links.mjs` (no broken internal links). Triggered when
`content/user-manual/**` changes.

## Adding a new entity to the local-first surface

This is the most common reason a quality gate fires. Follow this checklist:

1. **Schema:** add `CREATE TABLE` to `latest-data/supabase/migrations/`.
2. **RLS:** add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` plus
   `CREATE POLICY <name>_tenant_select ON public.<table>` (and write
   policies) using `current_company_id()`.
3. **Sync config:** add an entry to `SYNC_CONFIG` in
   `src/shared/db/sync-config.ts`, with `tenantColumn` or a custom
   `shapeWhere`. Make sure `shapeWhere` is a subset of the RLS USING
   clause (RULE 5).
4. **EMIT_ORDER:** append the new name so the local-schema generator
   emits its `CREATE TABLE` in FK order.
5. **Regenerate:** `pnpm gen:pglite-schema`, commit the resulting
   `local-schema.sql`.
6. **Entity registration:** register the entity with
   `prometheus-entity-management` in `features/<x>/entities.ts`.
7. **Run gates locally:** `pnpm typecheck && pnpm lint && pnpm lint:rules`.

Skip any step → the custom ESLint rule or boundaries plugin fails CI.

## Opt-in local pre-commit hook

```
cp .githooks/pre-commit.example .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Husky is not installed by design.
