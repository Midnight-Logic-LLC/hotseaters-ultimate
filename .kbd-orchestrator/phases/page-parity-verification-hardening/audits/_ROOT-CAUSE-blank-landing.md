# Root cause — deployed public pages render blank (79% drift)

_Diagnosed 2026-05-29 via headless Playwright against the live deployment._

## TL;DR

NOT a stale deploy. The deploy pipeline (`deploy.yml`) succeeds on every push
and the deployed bundle is current with `main`. The public landing route
**crashes at mount** with:

```
[pageerror] No PGlite instance found, use PGliteProvider to provide one
```

React unmounts on the throw → `#root` is empty → blank page → ~79% pixel drift.

## Evidence

Headless Chromium load of `https://hotseaters-ultimate.prometheusags.ai/`:

- final URL: `/` (no redirect)
- `#root` innerHTML length: **0**
- body innerText: **""**
- headings: **[]**
- pageerror: **"No PGlite instance found, use PGliteProvider to provide one"**

## Why the earlier "fix" (commit 7c17b0d) didn't cover this

`7c17b0d` hoisted `PGliteProvider` above `Tier1Provider` and guarded
`Tier1Provider`'s `MetadataTypeSyncer` so it only renders when
`useSyncGateDb()` is non-null. That fixed the **Settings** crash (an authed
route).

But it never addressed the **public** route. On a signed-out visit:

1. No session → `SyncGate` sits in `phase: 'idle'` → `boot.db` is null →
   **no `<PGliteProvider>`** wraps children.
2. `LandingPage` calls `useCurrentUser()` (line 246).
3. `useCurrentUser` → `useTierAById('user_info', …)` (`use-current-user.ts:12`).
4. `useTierAById` → `useLiveQuery(...)` (`use-tier-a-query.ts:119`).
5. `useLiveQuery` calls `usePGlite()` **first, unconditionally**, before it
   ever looks at the query string. With no provider, `usePGlite()` throws.

## Why the `shouldQuery ? realQuery : 'SELECT 1 WHERE false'` guard is a no-op

The dummy-query guard in `use-tier-a-query.ts` was meant to disable the query
when there's no tenant. But `useLiveQuery`'s implementation
(`@electric-sql/pglite-react`) is:

```js
function P(query, params, n){ let o = usePGlite(); /* …uses o.live.query… */ }
```

`usePGlite()` runs **before** the query string is inspected. So passing a
no-op query does not prevent the throw — the hook throws at the
provider-context read, not at query execution. The guard only prevents *running
SQL*, not the *crash*.

## Scope — this is a SHARED-LAYER bug (RULE 0.3)

Every `use-tier-a-query` hook (`useTierAQuery`, `useCompanyRow`, `useTierAById`,
`useMetadataTypeRows`) has the same latent crash whenever called outside a
`PGliteProvider`. Consumers that run on signed-out / pre-sync routes:

- `useCurrentUser` → `useTierAById` (called by LandingPage, and likely other
  public surfaces)
- `useCurrentCompany` → `useCompanyRow`

Per RULE 0.3, the fix belongs in the shared hook layer, not per-page.

## The fix (change-V11-adjacent — but it's a real bug, fix now)

`usePGlite(db?)` returns `db` directly when passed an explicit argument and only
reads context (and throws) when called with no argument. The
`use-tier-a-query` hooks must therefore avoid calling `useLiveQuery` when no
PGlite handle exists — using the **same `useSyncGateDb()` gate + child-component
isolation** pattern already proven in `tier1-provider.tsx`'s
`MetadataTypeSyncer`, OR by reading the db from `useSyncGateDb()` and short-
circuiting to empty rows when it is null (without calling `useLiveQuery` at
all — which requires the call to live in a child that only mounts when db≠null,
to satisfy rules-of-hooks).

Chosen approach: see the implementing commit. The acceptance test is the
headless diagnostic (`diag-landing.mjs`) showing `#root` non-empty and the
hero heading present, plus `pnpm test:bible-parity` drift on `/` dropping from
79% to <5%.

## RESOLUTION (2026-05-29)

Fixed in `src/app/sync-gate.tsx`: children now **always** render inside a
`PGliteProvider`. When `boot.db` is null (signed-out / pre-hydration), the
provider value is a `NOOP_PGLITE` stub whose `live.query` / `live.incrementalQuery`
invoke the result callback once with an empty result and return a no-op
subscription. `usePGlite()` therefore never throws, and the
`use-tier-a-query` hooks' existing `SELECT 1 WHERE false` no-op query keeps
them returning empty rows until the real handle replaces the stub.
`SyncGateDbContext` still exposes only the REAL handle (`boot.db ?? null`), so
`MetadataTypeSyncer`'s guard is unchanged.

**Verified against a local production build** (`pnpm build` + `pnpm preview`)
with the headless diagnostic:

- `#root` innerHTML: **50,469 chars** (was 0)
- body text: full hero copy present
- headings: `["HotSeaters", "The Complete Business Toolkit for Trial Techs",
  "From Chaos to Clarity", "Ready to Transform Your Business?"]`
- **console errors: none** (the PGlite throw is gone)

Gate trio green (typecheck 0, lint 0, tests 407/407). Pushing to `main`
auto-deploys via `deploy.yml`; the deployed `/` drift should collapse from
79% to <5% once ArgoCD rolls the new image. Re-run `pnpm test:bible-parity`
after the rollout to confirm.


## DEPLOY VERIFIED (2026-05-29)

Commit 77e285b deployed successfully (deploy.yml 4m27s). Headless re-check of
the LIVE site confirms the fix: `#root` = 50,469 chars, all headings present,
ZERO console errors. The blank-page production bug is RESOLVED in production.

Note: residual bible-parity drift on marketing pages is NOT this bug — it is
the deployed-bible-ahead-of-source calibration issue (see _DRIFT-BACKLOG.md).
