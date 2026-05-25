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

## See also

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`FEATURE-TEMPLATE.md`](./FEATURE-TEMPLATE.md)
- [`CODEMAP.md`](./CODEMAP.md)
- Constraints: `/Users/gqadonis/Projects/midnight/latest-data/.kbd-orchestrator/constraints.md`
- Bible: `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`
