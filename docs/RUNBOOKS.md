# Runbooks

> Self-hosted Supabase only. HotSeatersMVP is the bible. Components → hooks → stores → APIs.

Operational playbooks for the things that come up more than once. Each
runbook is self-contained: assumptions stated, command list, expected
output, rollback. **HotSeatersMVP is the bible** — when in doubt about
behavior, read the legacy app before changing anything.

---

## R-01 — First-time clone + dev setup

**Assumptions:** macOS or Linux. `pnpm` 9.12+ installed. Docker installed.

```bash
# 1. clone both repos as siblings
mkdir -p ~/Projects/midnight && cd ~/Projects/midnight
git clone --recurse-submodules <latest-data-url> latest-data
git clone <hotseaters-ultimate-url> hotseaters-ultimate

# 2. bring up self-hosted Supabase + Electric
cd latest-data
docker compose up -d
# wait ~30s for Postgres + GoTrue + Electric to settle
docker compose ps   # everything should be "healthy"

# 3. apply the migrations (one-time)
docker compose run --rm db-migrate

# 4. install hotseaters-ultimate
cd ../hotseaters-ultimate
pnpm install
cp .env.example .env.local
# .env.local should point at http://localhost:8000 (Supabase) and
# http://localhost:3133 (Electric). Never *.supabase.co.

# 5. run the app
pnpm gen:pglite-schema
pnpm dev    # http://localhost:6173
```

**Smoke test:** sign in with Google OAuth → land on `/dashboard` → no
console errors → PGlite syncs (Network tab shows shape subscriptions).

---

## R-02 — Rotate Supabase keys

**Trigger:** key compromise, scheduled rotation, post-phase secret hygiene
(per constraints RULE 10).

**Targets:** `latest-data/.env`, `latest-data/packages/example-app/.env`,
`hotseaters-ultimate/.env.local`, K8s secret manifests for
`hotbase.prometheusags.ai`.

```bash
# 1. rotate at the source
cd ~/Projects/midnight/latest-data
docker compose exec supabase-studio /bin/bash -c 'gotrue admin rotate-jwt-secret' \
  # or: regenerate via the Studio UI → Settings → API → Reset

# 2. capture the new keys
docker compose logs supabase-auth | grep ANON_KEY
docker compose logs supabase-auth | grep SERVICE_ROLE_KEY

# 3. update local .env files
$EDITOR latest-data/.env
$EDITOR latest-data/packages/example-app/.env
$EDITOR hotseaters-ultimate/.env.local

# 4. update K8s secrets (hosted prod/staging)
cd ../latest-data
kubectl -n hotbase create secret generic supabase-keys \
  --from-literal=ANON_KEY=… \
  --from-literal=SERVICE_ROLE_KEY=… \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n hotbase rollout restart deployment/supabase-auth deployment/supabase-rest

# 5. verify
curl -s -H "apikey: $NEW_ANON_KEY" http://localhost:8000/auth/v1/health
```

**Rollback:** keep the previous key for 24h; flip env vars back if the new
key fails health checks.

---

## R-03 — Regenerate TypeScript types after a migration

**Trigger:** a new migration landed in `latest-data/supabase/migrations/`.

```bash
cd ~/Projects/midnight/latest-data
pnpm db:push                # apply pending migrations to the linked db
pnpm db:types:generate      # writes hotseaters-ultimate/src/shared/db/supabase-types.ts

cd ../hotseaters-ultimate
pnpm gen:pglite-schema      # mirror PGlite local schema
pnpm typecheck              # confirms the new types compile

git add src/shared/db/supabase-types.ts src/shared/db/local-schema.sql
git commit -m "chore: regenerate types after <migration name>"
```

**Verify drift:** `pnpm db:diff` should return no changes.

---

## R-04 — Force-resync a tenant's PGlite cache

**Trigger:** user reports stale data, mismatched company switch, or a
post-bridge-fix recovery.

The server is canonical. PGlite is cache. Wipe it locally.

```js
// In the running app, open the browser dev console:
import('@/shared/db/pglite-client').then(async ({ clearLocalTenantData }) => {
  await clearLocalTenantData();
  location.reload();
});
```

`clearLocalTenantData()`:
1. Aborts active Electric shape subscriptions.
2. Truncates every `_synced.*` and `_local.*` table.
3. Drains `local_writes` to Supabase REST first (so unsynced writes are
   not lost). If the drain fails, the function refuses to truncate and
   throws — fix the network issue first.
4. Resets `_pglite_schema_version` to `NULL` so the next boot re-applies
   the local schema.

After the reload, the sync gate shows "Hydrating local cache…" while
Electric re-fills `*_synced`.

**Tauri:** the same call works inside the WebView. For a hard wipe,
delete the app's OPFS storage directory in iOS Files / Android Files.

---

## R-05 — Embed updated manual chunks

**Trigger:** a content commit touched `content/user-manual/*.mdx`.

```bash
cd ~/Projects/midnight/hotseaters-ultimate
pnpm manual:validate            # manifest + link check (refuses bad MDX)
pnpm manual:compile             # MDX → dist/manual/<slug>.{html,json}
pnpm manual:embed               # idempotent — content-hash skip
```

What `pnpm manual:embed` does (`scripts/embed-manual.mjs`):

1. Walks `content/user-manual/*.mdx`.
2. Reads `dist/manual/<slug>.json` (text, headings).
3. Computes `content_hash` per document; skips unchanged.
4. POSTs changed docs to the Supabase Edge Function `embed-manual`, which
   chunks by heading boundary + 800-token max with 100-token overlap,
   calls OpenAI `text-embedding-3-small`, and upserts into
   `manual_documents` + `manual_chunks`.

**Verify:** run a query in `example-app` chat — citations should link to
the updated slug + anchor. Direct check:

```sql
SELECT slug, updated_at FROM manual_documents ORDER BY updated_at DESC LIMIT 5;
SELECT COUNT(*) FROM manual_chunks WHERE document_id = '<id>';
```

**CI:** the same script runs in CI on `content/user-manual/**` changes.

---

## R-06 — Ship a new role to the matrix

**Trigger:** product introduces a new role (e.g. `Read-Only Investor`).

Three places must change in lockstep (see plan §0.9):

1. **Database** — add the role value to `user_info.company_role` (check
   constraint or enum). New migration in
   `latest-data/supabase/migrations/<ts>_add_<role>_role.sql`.

2. **RLS policies** — for every table the new role can read/write, add or
   adjust a policy. Use `public.current_user_role() IN ('Owner','…','<NewRole>')`.

3. **Client guard** — update the role union type in
   `src/shared/lib/role-mapping.ts`, add the role to every `<RoleGuard
   allow={[…]}>` it should appear on, and update `src/app/navigation.ts`
   so the new role sees the correct items.

**Verify:**

- pgTAP test: an authenticated user with the new role can read/write
  exactly the policied tables.
- Playwright: sign in as the new role, navigate every menu item, expect
  the role-gated routes to render or 403 per the matrix.

---

## R-07 — Tauri iOS device deploy

**Assumptions:** macOS 13+, Xcode 15+, Apple Developer account
provisioned. `pnpm tauri:ios:init` already run.

```bash
cd ~/Projects/midnight/hotseaters-ultimate

# 1. ensure the dev Supabase target works (Tauri WebView hits whatever
#    VITE_SUPABASE_URL says, so use your LAN IP, not localhost)
$EDITOR .env.local
# VITE_SUPABASE_URL=http://<lan-ip>:8000

# 2. plug in the iPhone, unlock it, trust the Mac
xcrun devicectl list devices

# 3. run on device
pnpm tauri:ios:dev --device "<device name>"
```

**Smoke test:**
- App boots, COOP/COEP not blocking PGlite.
- PGlite OPFS storage allocates (check `chrome://inspect` from Safari).
- Sign-in works (Google OAuth via SFSafariViewController).
- Bottom-tab + drawer renders, safe-area inset respected.

**Release build:**
```bash
pnpm tauri:ios:build --target aarch64-apple-ios
# upload via Transporter / Xcode → TestFlight
```

---

## R-08 — Tauri Android device deploy

**Assumptions:** Android Studio + SDK installed, NDK present, device in
USB-debug mode. `pnpm tauri:android:init` already run.

```bash
cd ~/Projects/midnight/hotseaters-ultimate

# 1. point at a LAN-reachable Supabase
$EDITOR .env.local

# 2. confirm device
adb devices

# 3. run on device
pnpm tauri:android:dev
```

**Smoke test:** same checklist as iOS, plus Chromium WebView devtools at
`chrome://inspect/#devices`.

**Release build:**
```bash
pnpm tauri:android:build --target aarch64-linux-android
# signed AAB lands in src-tauri/gen/android/app/build/outputs/bundle/release/
```

---

## R-09 — Rotate the OpenAI key

**Trigger:** key exposure, scheduled rotation. The constraints file flags
the current key as needing rotation post-phase (RULE 10).

```bash
# 1. mint a new key in the OpenAI dashboard, scope it to the smallest
#    set of API capabilities the embed-manual function needs.

# 2. update local .env files
$EDITOR latest-data/.env
$EDITOR latest-data/packages/example-app/.env

# 3. update the Supabase Edge Function secret (used by embed-manual)
cd ~/Projects/midnight/latest-data
supabase secrets set OPENAI_API_KEY=sk-… --project-ref local
supabase functions deploy embed-manual

# 4. K8s prod
kubectl -n hotbase create secret generic openai-keys \
  --from-literal=OPENAI_API_KEY=sk-… \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n hotbase rollout restart deployment/edge-runtime

# 5. revoke the old key in the OpenAI dashboard
```

**Verify:** `pnpm manual:embed` runs end-to-end without 401.

---

## R-10 — Debug a stuck `local_writes` drain

**Symptoms:** UI shows optimistic state forever; rows never reach the
server; `useGraphSyncStatus()` reports `pendingWrites > 0` that doesn't
decrease.

```sql
-- 1. inspect the queue from the browser console (PGlite)
SELECT * FROM _local.local_writes ORDER BY created_at LIMIT 50;
SELECT op, table_name, COUNT(*) FROM _local.local_writes GROUP BY 1, 2;

-- 2. find the row that's blocking — look for failed_at IS NOT NULL or
--    a high retry_count
SELECT * FROM _local.local_writes WHERE retry_count > 3;
```

```js
// 3. force a drain attempt with verbose logging
import('@/shared/db/write-sync').then((m) => m.drainOnce({ debug: true }));
```

Common causes:

- **RLS rejection** — the server policy denies the write. Look at the
  Supabase logs for the offending request (`pnpm --filter latest-data
  supabase logs api`). Fix the policy, then `drainOnce()` again.
- **Schema drift** — a column the server expects is missing because the
  client is behind a migration. Solution: run R-03, then R-04.
- **Network** — Supabase URL wrong, gateway down. Confirm
  `curl $VITE_SUPABASE_URL/rest/v1/` returns 200.
- **Triggers** — a server-side BEFORE INSERT trigger raises. Inspect
  with `SET LOCAL log_min_messages = 'debug1'`.

**Last resort:** discard the queue with explicit user confirmation.

```js
import('@/shared/db/pglite-client').then(async ({ pglite }) => {
  if (confirm('Discard all pending local writes? Unsynced changes will be lost.')) {
    await pglite.exec('TRUNCATE _local.local_writes;');
  }
});
```

---

## R-11 — Add a new Tier-A entity (condensed)

The full mechanical guide is in [`FEATURE-TEMPLATE.md`](./FEATURE-TEMPLATE.md).
This is the short version for an experienced contributor.

```bash
# 1. add to sync allowlist
$EDITOR src/shared/db/sync-config.ts
# append a SyncEntityConfig with tier: 'A', tenantColumn: 'company_id'

# 2. regenerate PGlite local schema
pnpm gen:pglite-schema

# 3. RLS policies
cd ../latest-data
pnpm db:migration:new <entity>_rls
# write tenant-read + role-write policies using
# public.current_user_info() / current_company_id() / current_user_role()
pnpm db:push
pnpm db:types:generate

# 4. scaffold the feature directory
cd ../hotseaters-ultimate
pnpm gen:feature <name>

# 5. fill entities.ts, stores/, hooks/, register in app-providers.tsx,
#    add route + RoleGuard in app-router.tsx.

# 6. gates
pnpm gen:pglite-schema:check
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
```

---

## Iterating on `@prometheus-ags/prometheus-entity-management`

The library is a git submodule at
[`packages/prometheus-entity-management`](../packages/prometheus-entity-management/),
linked into the app via `pnpm-workspace.yaml`'s `workspace:*` protocol.
Editing the library source is the fast loop — the app picks up changes
without `pnpm install`.

### Why this is the right loop (and not a vendor directory)

The submodule's remote is the canonical
`git@github.com:Prometheus-AGS/prometheus-entity-management.git` repo,
so any fix landed here is one push away from being upstream. Edits to
this directory ARE edits to the library. There is no separate
"vendor copy" to keep in sync — that confusion caused a real
regression in May 2026 where an earlier round's `useEntityList` memo
fix landed in a sibling clone at `latest-data/packages/...` instead
of this submodule; the warning reappeared because the app's
workspace link resolves to THIS path, not that one. (Confirmed via
`pnpm ls --filter hotseaters-ultimate @prometheus-ags/prometheus-entity-management`
showing `link:packages/prometheus-entity-management`.)

Rule: **the fix lives where the workspace link points**. Read
`pnpm-workspace.yaml` if ever in doubt.

### Land a fix

```bash
# 1. Edit the source in the submodule
$EDITOR packages/prometheus-entity-management/src/<file>.ts

# 2. Typecheck + test inside the submodule
cd packages/prometheus-entity-management
pnpm typecheck
pnpm test

# 3. Rebuild (consumers don't need this for the workspace link path,
#    but npm publish does — and it's cheap)
pnpm build

# 4. App-side smoke: from the superproject root
cd -                              # back to hotseaters-ultimate root
pnpm typecheck && pnpm test       # must stay 298/298 green
pnpm dev                          # manually verify in browser
```

The app picks up the source change instantly through the `workspace:*`
link — no `pnpm install` needed.

### Publish a new version

```bash
cd packages/prometheus-entity-management

# 1. Bump version in package.json (semver)
$EDITOR package.json              # version: "1.3.0" → "1.3.1"

# 2. Add a CHANGELOG.md entry under "## [<new-version>] — <YYYY-MM-DD>"
$EDITOR CHANGELOG.md

# 3. Commit inside the submodule
git add package.json CHANGELOG.md src/<file>.ts
git commit -m "fix(...): <one-line summary>"
git push origin main

# 4. Publish (pnpm or npm — package CLAUDE.md says pnpm, but either works)
pnpm publish                      # uses publishConfig.access: "public"
# or: npm publish (after `npm login` if not authenticated)

# 5. Confirm the new version is live
npm view @prometheus-ags/prometheus-entity-management versions
```

### Bump the submodule pointer in the superproject

After committing inside the submodule, the superproject sees the
submodule directory as "modified" because its SHA pointer is now
stale. Stage + commit the bump so CI installs the new SHA:

```bash
# From hotseaters-ultimate root
git add packages/prometheus-entity-management
git commit -m "chore(submodule): bump entity-mgmt to <version> (<short reason>)"
git push
```

If you skip this step, the app keeps working locally (workspace link
is live), but CI and fresh clones will install the old submodule SHA
and the bug will reappear. **Always commit the SHA bump.**

### When npm publish is deferred

Sometimes the fix is too small to publish immediately, or the
release window is wrong. In that case:

- Land the source + commit + push to the submodule's `main`.
- Commit the submodule SHA bump in the superproject.
- Leave the published version unchanged on npm; downstream consumers
  not using the workspace link will keep getting the older version
  until you publish.
- Track the deferral by leaving the bumped version in
  `packages/prometheus-entity-management/package.json` but noting in
  CHANGELOG that publishing is pending. The next change can pick it
  up by simply running `pnpm publish` (no version-bump needed if the
  version was already advanced).

---

## Updating the recharts fork

We don't depend on the npm-published `recharts`; we depend on
[`GQAdonis/recharts`](https://github.com/GQAdonis/recharts.git) via
`"recharts": "github:GQAdonis/recharts#release"` in `package.json`.
This gives us a fast loop when a recharts bug surfaces (mostly React 19
ResponsiveContainer / ChartDataContextProvider quirks): patch `src/` on
the fork, rebuild, push to `release`, `pnpm update recharts` in the app.

### Branch layout

- `main` — tracks upstream `recharts/recharts` main + our own commits.
  Only `src/` is committed; build artifacts are gitignored exactly like
  upstream.
- `release` — snapshot branch. Force-pushed every time we want to
  publish a new build. Carries `src/` PLUS `lib/`, `es6/`, `umd/`,
  `types/` (the artifacts pnpm needs to install the package from git).

### Publish a new release snapshot

```bash
cd /path/to/GQAdonis/recharts          # local clone of the fork

# Land any source-level fix on main first, then:
git checkout main
git pull origin main
npm install --no-audit --no-fund        # recharts ships npm scripts
npm run build                           # cjs + es6 + umd + types

# Move the build artifacts to the release branch
git checkout -B release
# Un-ignore the build dirs on this branch only:
sed -i.bak -E '/^(umd|lib|es6|\/types)$/d' .gitignore && rm -f .gitignore.bak
git add -f .gitignore lib es6 umd types
git commit --no-verify -m "release: build artifacts from main @ $(git rev-parse --short main)"
git push --no-verify -u origin release --force-with-lease
```

`--no-verify` bypasses the upstream husky `lint-staged` pre-commit /
pre-push hooks, which would otherwise try to lint thousands of build
artifacts and hang. The `release` branch is a snapshot, not history;
force-push is the intended workflow.

### Consume the new release in the app

```bash
cd /path/to/hotseaters-ultimate
pnpm update recharts
pnpm typecheck && pnpm test    # must stay green
pnpm dev                       # smoke-test the dashboard
```

`pnpm-lock.yaml` records the exact commit SHA of the `release` branch
tarball, so the install is reproducible across machines and CI.

### Why a fork at all

Upstream recharts has unfixed-on-npm bugs that bite us:

- [#5489 — Infinite re-renders when container content changes (Alpha)](https://github.com/recharts/recharts/issues/5489)
- [#6613 — `useActiveTooltipDataPoints` Maximum update depth (PR #6616 closed)](https://github.com/recharts/recharts/issues/6613)
- [#6716 — ResponsiveContainer logs incorrect width(-1) warning](https://github.com/recharts/recharts/issues/6716)
- [#5173 — ComposedChart + ResponsiveContainer minified React 19 displayName bug](https://github.com/recharts/recharts/issues/5173)

When we hit one we either cherry-pick the merged-upstream fix onto
`main` and re-publish, or land our own fix and (ideally) upstream it
later.

---

## Electric routing in dev + prod

### How shape streams reach Electric

Browser → Envoy → Electric. The browser hits
`$VITE_ELECTRIC_URL/v1/shape` (which is the same Envoy host:port as
`$VITE_SUPABASE_URL` — `http://localhost:8000` in dev,
`https://hotbase.prometheusags.ai` in prod). Envoy has a dedicated route
for `/v1/shape` that forwards to the Electric upstream (`electric:3000`
inside the docker network) and inherits the host-level wide-open CORS
block, so cross-origin XHRs from any dev origin work.

The Envoy route is configured in
`latest-data/volumes/api/envoy/lds.template.yaml` (search for
`electric-v1-shape`) plus the `electric` cluster in
`latest-data/volumes/api/envoy/cds.yaml`. Both basic_auth and RBAC are
explicitly disabled / set to ALLOW at the route level — Electric does
its own auth.

### Auth

Electric is gated by a shared API key sent as `?secret=…` on every
shape request. The app reads it from `VITE_ELECTRIC_SECRET` (yes, the
`VITE_` prefix is intentional — it ships in the browser bundle) and the
key in `hotseaters-ultimate/.env` must equal `ELECTRIC_SECRET` in
`latest-data/.env`.

### Threat model

The shared secret only gates *shape access*; per-tenant scope is
enforced independently by Postgres RLS at the upstream. A leaked
client-side secret would let an attacker request shape streams, but
RLS would still return only the rows the JWT identity is allowed to
see — and unscoped shapes are refused at attach time by
`createTenantScopedElectricAdapter` (RULE 5).

### HTTP/1.1 connection cap (cosmetic warning)

Browsers cap concurrent HTTP/1.1 connections at ~6 per origin. With
~10+ shapes mounting at once on first dashboard load, the
Electric-client logs a warning that excess shapes queue behind the
first six. Hydration still completes within ~1s; visible to the user
only as a brief flash of skeletons. Prod fix is HTTP/2 termination at
the Envoy ingress (already in place on
`hotbase.prometheusags.ai`); the local docker-compose stack is
HTTP/1.1 and the warning is expected.

### Common failure modes

- `401 Unauthorized` on every `/v1/shape` request → `VITE_ELECTRIC_SECRET`
  doesn't match `ELECTRIC_SECRET` in `latest-data/.env`. Both must be
  the *same string*; refresh dev after editing `.env`.
- `CORS policy: No 'Access-Control-Allow-Origin' header` →
  `VITE_ELECTRIC_URL` is pointing at the raw Electric port (e.g.
  `http://localhost:13000`) instead of the Envoy gateway
  (`http://localhost:8000`). Electric itself does NOT ship CORS
  headers; Envoy does. Fix the env var, refresh.
- `404 not found` on `/v1/shape` from Envoy → the
  `electric-v1-shape` route or `electric` cluster is missing from
  `lds.template.yaml` / `cds.yaml`. Restart with
  `docker compose -f .../latest-data/docker-compose.yaml up -d --force-recreate api-gw`.

---

## R-13 — Registering a new entity (2.0 transport-registry)

Added in `@prometheus-ags/prometheus-entity-management@2.0.0`. Every entity
the app fetches from Supabase must be registered once at app boot; hooks then
use the registry instead of inline `fetch` closures.

### The four steps

**Step 1 — Add the entity type to `src/shared/db/entity-transports.ts`**

```ts
// Tier-A (synced to PGlite via Electric — authoritative: true, staleTime: 5 000 ms)
reg('MyNewEntity', 'my_new_entity_table', true, 5_000);

// Tier-C (REST-only — authoritative: false, no staleTime)
reg('MyNewEntity', 'my_new_entity_table', false);
```

Pick Tier-A if the entity is in `src/shared/db/sync-config.ts` (PGlite-synced).
Pick Tier-C for anything fetched straight from Supabase REST without local sync.

**Step 2 — Create the feature hook**

```ts
// src/features/<feature>/hooks/use-<entity>.ts
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';

interface MyEntityRow { id: string; company_id: string; /* ... */ }

export function useMyEntity() {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  return useEntities<MyEntityRow>('MyNewEntity', {
    filter: companyId
      ? [{ field: 'company_id', op: 'eq', value: companyId }]
      : null,
    enabled: !!companyId,
  });
}
```

`useEntities` returns `{ items, isLoading, isError, error, refetch }`.
`error` is `TerminalError | TransientError | null` — use `instanceof TerminalError`
to distinguish 4xx (table missing, permission denied) from 5xx/network faults.

**Step 3 — Consume the hook in a component**

```tsx
// components follow RULE B: no stores, no supabase, no PGlite
import { useMyEntity } from '@/features/<feature>/hooks/use-<entity>';

export function MyWidget() {
  const { items, isLoading, isError } = useMyEntity();
  if (isLoading) return <Skeleton />;
  if (isError)  return <ErrorState />;
  return <ul>{items.map(e => <li key={e.id}>{e.id}</li>)}</ul>;
}
```

**Step 4 — Add the entity to `src/features/<feature>/entities.ts`** (if not there)

```ts
import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management';
registerEntityJsonSchema('MyNewEntity', { /* JSON Schema */ });
```

### Error handling reference

| Error class | HTTP range | Retry? | UI treatment |
|---|---|---|---|
| `TerminalError` | 4xx (400, 403, 404) | No | Show static error state; don't retry |
| `TransientError` | 5xx + network | Yes (3×, backoff) | Show skeleton; hook retries automatically |

```ts
import { TerminalError } from '@prometheus-ags/prometheus-entity-management';

if (error instanceof TerminalError && error.status === 404) {
  // table does not exist yet — render graceful empty state
}
```

### The LEAD_RADAR_AVAILABLE pattern (gating a missing schema)

If the DB table for an entity doesn't exist yet, the REST transport will return
a `TerminalError` (HTTP 400/404) — no retry storm. You can still gate the fetch
with a flag so no request fires at all:

```ts
// in the hook
const { items } = useEntities<MyRow>('Lead', {
  filter: ...,
  enabled: FEATURE_FLAG_ENABLED && !!companyId,
});
```

Flip `FEATURE_FLAG_ENABLED = true` once the migration lands. Zero other changes.

### Verification checklist

- [ ] `registerEntityTransport('MyNewEntity', ...)` present in `entity-transports.ts`
- [ ] `registerAllTransports()` is called before the first hook renders (already true — it runs at module evaluation time in `app-providers.tsx`)
- [ ] `pnpm typecheck` clean
- [ ] Hook returns correct `items` in a test with a mocked `useEntities`
- [ ] Widget renders graceful skeleton while `isLoading`, graceful empty state when `items.length === 0`

---

## See also

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`FEATURE-TEMPLATE.md`](./FEATURE-TEMPLATE.md)
- [`CODEMAP.md`](./CODEMAP.md)
- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
- Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`
