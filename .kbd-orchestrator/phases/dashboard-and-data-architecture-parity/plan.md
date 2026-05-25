# Plan — dashboard-and-data-architecture-parity

**Project:** hotseaters-ultimate
**Phase:** dashboard-and-data-architecture-parity
**Change backend:** OpenSpec (initialized in this session; `openspec/` at repo root)
**Source assessment:** `.kbd-orchestrator/phases/dashboard-and-data-architecture-parity/assessment.md`
**Bible:** `HotSeatersMVP` (see RULE 0)
**Constraint anchor:** self-hosted Supabase only; 100 % bible parity required.

> Sycophancy-correction lens: every section below is concrete, citing files,
> line numbers, library APIs, and source URLs. No filler, no praise.

## Research summary (web + local docs, May 2026)

### R1 — PGlite per-user isolation

PGlite stores its data in IndexedDB. The browser scope is the **origin**, not
the Supabase user — so a single global PGlite instance leaks across user
switches on the same browser. There is no upstream "per-user" helper; the
established pattern is to key the IDB store name on `auth.user.id` and
destroy the instance on sign-out. ([Database build / postgres.new][r1a]
demonstrates the idiom: one PGlite instance per workspace, keyed by URL.)
Combined with [Supabase multi-tenant guidance][r1b], the correct stack is:

- One PGlite instance per `auth.user.id`, persisted at
  `idb://hotseaters/${userId}` (or OPFS equivalent).
- Server-side RLS keyed on `auth.uid()` is non-negotiable — the local
  isolation is defense-in-depth, not the only line.
- Tear down on sign-out, re-bootstrap on sign-in (`auth-store.signOut`
  → `pgliteClient.closeForUser()` then signOut completes;
  `onAuthStateChange('SIGNED_IN')` → `pgliteClient.openForUser(id)`).

### R2 — ElectricSQL shapes vs Supabase Realtime hybrid

[ElectricSQL docs][r2a] and [Supabase partner integration page][r2b] confirm
both can run side-by-side against the same Postgres:

- **Electric shapes** = HTTP-pulled, partial-replication snapshots that
  hydrate a local Postgres (PGlite) and stay live via long-poll. Optimal
  for read-heavy historical sets where offline replay matters.
  Auth via HTTP middleware (not RLS).
- **Supabase Realtime** = WebSocket-pushed per-row CDC. Optimal for
  latency-sensitive single-row updates (current user's profile, current
  company's theme). Auth via Postgres RLS.

The split in the assessment table is consistent with this architecture and
with prometheus-entity-management v1.3's tenant-scoped adapter (R3).

### R3 — prometheus-entity-management v1.3 already ships what we need

From `packages/prometheus-entity-management/README.md` (latest-data
submodule):

| API | What it gives us |
|-----|------------------|
| `createPGlitePersistenceAdapter(pglite, options?)` | Persists the entity graph snapshot **inside** PGlite (table `_graph_snapshot` by default). One serializer to maintain instead of two. |
| `createTenantScopedElectricAdapter(opts)` | Refuses to attach Electric shapes that lack a `tenantColumn`. Builds the `WHERE` from a validated `{ companyId }` claim. Shape predicates can never widen past RLS — exactly the leakage guard we want for D5/D6/D7. |
| `registerEntityFromSql({ entityType, createTableSql })` | Generates JSON Schema from a Postgres `CREATE TABLE` block. Eliminates the hand-written schemas in `entities.ts:26-50, 53-77, 79-98`. |
| `useEntityListAsTable(opts)` | Stable `data` reference for TanStack Table consumers (dashboard tables). |
| `startLocalFirstGraph({ ..., retryPolicy, poisonHandler })` | Retry-with-backoff for offline action replay. Useful when the user's connection drops mid-edit. |

**Implication for the plan:** Change C uses
`createTenantScopedElectricAdapter` + `createPGlitePersistenceAdapter`
instead of hand-rolling tenant filtering. Change D uses
`registerEntityFromSql` for the five lookup types so we don't author five
hand-coded JSON schemas.

[r1a]: https://github.com/supabase-community/database-build
[r1b]: https://medium.com/@itsuki.enjoy/supabase-support-multi-tenancy-with-detail-template-project-34f3a3d97ee4
[r2a]: https://electric-sql.com/docs/integrations/supabase
[r2b]: https://supabase.com/partners/electricsql

## Ordered change list

The phase ships as 4 OpenSpec changes (one per architectural concern,
ordered by dependency). Files created under
`openspec/changes/change-40N-*` are the source of truth for execution;
each has a `proposal.md`, `tasks.md`, and (where it changes contracts) a
`specs/` directory.

| # | OpenSpec id | Touches | Recommended agent | Risk |
|---|-------------|---------|-------------------|------|
| 1 | `change-401-routing-redirect-last-route` | `landing-page.tsx`, `app-router.tsx`, NEW `last-route-tracker.tsx`, `user-info-store.ts` | typescript-reviewer + tdd-guide | Low |
| 2 | `change-402-app-shell-dashboard-parity` | `app-shell.tsx`, NEW `sidebar-user-footer.tsx`, `dashboard-page.tsx`, NEW `use-dashboard-aggregates.ts`, NEW `revenue-trend-card.tsx`, port of 5–6 bible widgets | a11y-architect + ui-ux-designer + typescript-reviewer | Med (recharts + 12 widgets) |
| 3 | `change-403-per-user-pglite-sync-policy` | `pglite-client.ts` (refactor), NEW `local-schema-common.sql`/`local-schema-user.sql`, NEW `realtime-channels.ts`, `electric-sync.ts` (extend), `auth-store.ts` (close/open hooks), NEW `docs/architecture/sync-policy.md` | architect + security-reviewer + typescript-reviewer | High (data layer) |
| 4 | `change-404-lookup-entities-wiring` | NEW `src/features/lookups/entities.ts`, NEW `src/features/lookups/hooks/*`, `app-router.tsx` (register call), wire Dashboard `PipelineCard` to real stages | typescript-reviewer | Low |

Change 401 unblocks 402 (no point polishing widgets nobody reaches).
Change 403 unblocks 404 (lookups need shapes and the tenant adapter).
402 and 403 can run **in parallel** if two devs/agents are available —
they touch disjoint files. 404 closes after both land.

## Change 401 — routing + redirect + last-route

**Goal:** every authenticated user lands on `/Dashboard` (or last-viewed
page) immediately after sign-in. `/dashboard` lowercase alias works.
`lastViewedPage` persists per the bible.

**Bible references:**
- `HotSeatersMVP/src/App.jsx:97-100` — `window.location.replace('/Dashboard')`
  for authenticated visitors on `/` or `/Landing`.
- `HotSeatersMVP/src/Layout.jsx:364-419` — auth-aware branching: pending
  invite → /AcceptInvite, no userInfo → /Onboarding, inactive →
  AccountDeactivated screen (handled below in render), no company →
  /Onboarding, otherwise redirect to `lastViewedPage` on first mount.
- `HotSeatersMVP/src/Layout.jsx:443-479` — 500 ms debounced writer for
  `user_info.preferences.lastViewedPage` + `sidebarCollapsed`.
- `HotSeatersMVP/src/Layout.jsx:407-419` — initial-load redirect guarded
  by `initialRedirectDoneRef` so sidebar Dashboard clicks don't bounce
  back to the saved route.

**Tasks:**
1. **landing-page.tsx** — replace the static marketing-only render with:
   - `useAuth() + useTier1()` read
   - Render marketing page when `!isAuthenticated`
   - Otherwise branch exactly as `Layout.jsx:364-419` (pending invite
     → /AcceptInvite, no userInfo → /Onboarding, inactive →
     /account-rejected, no company → /Onboarding, else → last-viewed
     OR /Dashboard). Use `<Navigate to=... replace />`, not
     `window.location.replace` — we're inside React Router.
2. **app-router.tsx** — add `<Route path="dashboard" element={<Navigate
   to="/Dashboard" replace />} />` inside the protected subtree (after
   the existing `Dashboard` route at line 124). Also add
   `<LastRouteTracker />` as a sibling of `<Outlet />` inside
   `<AuthGate>`.
3. **last-route-tracker.tsx** (NEW) — pure component with no render
   output:
   - reads `useLocation()` + `useCurrentUser()`
   - debounced 500 ms writer keyed on `pathname` (skip the public set:
     Landing, Onboarding, AcceptInvite, SignDocument, ViewDocument,
     PrivacyPolicy, TermsOfService, login, register, forgot-password)
   - calls `userInfoStore.patchPreferences({ lastViewedPage: pageName })`
   - guards: no-op when `userInfo === null` or current page is the
     skip list.
4. **user-info-store.ts** — add `patchPreferences(patch: Record<string,
   unknown>): Promise<void>` action that calls the existing Supabase
   `UserInfo.update(userInfo.id, { preferences: {...prev, ...patch} })`
   pattern. Tier-1 reactivity propagates the update back through Realtime
   (see Change 403).

**Tests (Playwright + Vitest):**
- Unit: `last-route-tracker.spec.ts` — verify debounce, skip list,
  no-op when userInfo missing.
- E2E: `auth-and-dashboard-reach.spec.ts`:
  - `it('lands on /Dashboard on fresh sign-in')`
  - `it('preserves /Trials across reload')`
  - `it('lands on last-viewed page after sign-out/sign-in')`
  - `it('redirects /dashboard lowercase → /Dashboard')`

**Definition of done:**
- All 4 E2E specs green against the local dev server.
- Production smoke: real Google sign-in on
  `https://hotseaters-ultimate.prometheusags.ai` lands on /Dashboard.

## Change 402 — app-shell + dashboard widget parity

**Goal:** /Dashboard renders 100 % of the bible's widgets at 1440×900 with
the same data shape, fonts, spacing, colours, and interaction behaviour.
Sidebar gains the missing footer; logos are unified.

**Bible references (all from `HotSeatersMVP/src/`):**
- `Layout.jsx:543-630` — sidebar shell incl. `SidebarHeader`,
  `SidebarUserFooter`, `Toaster`, `TrialBanner`, `CompanyMigration`,
  Google-Fonts injection.
- `Layout.jsx:591` — `<SidebarUserFooter user={user} userInfo={userInfo} />`.
- `Layout.jsx:550` — `<Toaster position="top-center" />`.
- `Layout.jsx:619` — `<TrialBanner company={company} />`.
- `pages/Dashboard.jsx:691-883` — 6 KPI tiles.
- `pages/Dashboard.jsx:886-1083` — Pipeline + QuickStats + Recent Activity row.
- `pages/Dashboard.jsx:1085-end` — Weekly + Monthly team performance,
  active trial performance, upcoming trials, Quick Actions.
- `pages/Dashboard.jsx:413-525` — revenue trend chart math (monthly +
  weekly + cumulative + trend-line + goal-line).
- `pages/Dashboard.jsx:303-401` — projected-invoices algorithm (split
  billing, weekly/monthly/per-trial branches).

**Tasks (in execution order):**

### 402.a — Logo unification + shell components
1. Adopt `/brand/chameleon-logo.png` as canonical (already mirrored). Update:
   - `src/app/app-shell.tsx:128` — replace `/logo.svg` with the chameleon.
   - any other `/logo.svg` reference (`grep -r logo.svg src/`).
   - Auth pages already use it.
2. **sidebar-user-footer.tsx** (NEW) — port from
   `HotSeatersMVP/src/components/sidebar/SidebarUserFooter.jsx`. Surfaces:
   user avatar, name, role badge, sign-out menu, settings link, "switch
   company" for multi-company users. Wire `signOut` to existing
   `auth-store.signOut`.
3. **app-shell.tsx** — mount:
   - `<Toaster position="top-center" />` (sonner already a dep — check
     `package.json` to confirm).
   - `<TrialBanner company={company} />` (port from
     `HotSeatersMVP/src/components/TrialBanner.jsx`).
   - `<CompanyMigration />` — defer to a follow-up; only renders when
     company has a pending migration flag.
   - `<SidebarUserFooter>` between `<SidebarContent>` and `<SidebarRail>`.
4. Theme: keep current static Montserrat/Inter font tokens. The bible's
   per-company Google-Fonts injection (`Layout.jsx:516-549`) lands with
   Change 403's `company` Realtime channel.

### 402.b — Dashboard KPI tiles + Recent Activity row
1. **use-dashboard-aggregates.ts** (NEW) — single hook that consumes the
   entity-graph (no fetches) and produces the bible's exact aggregates:
   - `revenueYtd`, `revenueChange` (vs last month)
   - `pipelineValue`, `weightedPipelineValue`, `dealsActive`
   - `outstandingAmount`, `outstandingCount`
   - `trialsActive`, `trialsUpcoming`, `trialsYtdCount`,
     `revenuePerTrialYtd`
   - `recentInvoices` (top 3 by `invoice_date`), `recentlyWonDeals` (top
     3 by `won_date`)
   - `activeConsultants`, `avgHoursPerConsultant`
   - `openHSHPosts`, `activeHSHGigs`
   - `dealsByStage`, `trialsByStage`
   - `weeklyUserStats`, `monthlyUserStats`, `trialStats`
   Each derived value is **pure** — given the same entity-graph snapshot,
   it returns the same output. No date arithmetic against `Date.now()`
   inside the hook; pass `now` in if needed for tests.
2. **dashboard-page.tsx** — replace the 3 `StubCard` calls with real
   `Card` blocks ported from `Dashboard.jsx:763-883`. JSX is essentially
   verbatim with `var(--theme-*)` tokens preserved.
3. Port the **Sales Pipeline** + **Quick Stats** + **Recent Activity**
   row from `Dashboard.jsx:890-1083`. Pipeline uses recharts (already a
   dep per `package.json`).
4. Drop the existing `StatCard` for "Active Clients" + "Team" — those
   were placeholders; the bible doesn't have them in that location.
5. Port the **Needs Attention** banner from `Dashboard.jsx:711-755` —
   reuses `useMyStaleLeadsCount` (port from
   `HotSeatersMVP/src/hooks/useMyStaleLeadsCount.js`).

### 402.c — Team performance + Active trial performance + Upcoming + Quick Actions
1. Port weekly/monthly team-performance bar charts
   (`Dashboard.jsx:1085-end` — needs page 2 of that file read).
2. Port the active-trial performance card (hours + revenue per trial).
3. Port the upcoming-trials list (next 5 by `start_date`).
4. Port the Quick Actions row (4–6 CTA tiles: New Client, New Trial,
   Time Entry, Invoice, Approvals).

### 402.d — Revenue trend chart (deferrable to 402.e if 402.a–c is large)
1. **revenue-trend-card.tsx** (NEW, recharts) — port the
   `Dashboard.jsx:413-525` math + the stacked-bar render. Includes:
   - Monthly / weekly toggle, persisted in `userInfo.preferences`.
   - Cumulative toggle, persisted in `userInfo.preferences`.
   - Trend line (linear regression).
   - Goal line (`company.annual_revenue_target` / periods-per-year).
   - Projected revenue stacked on actual, colour-coded.

**Tests:**
- Unit: `use-dashboard-aggregates.spec.ts` — table-driven against fixture
  graph snapshots; matches bible math exactly.
- Visual diff: extend the existing `change-209` bible-parity harness to
  cover `/Dashboard` at 1440×900 (desktop) and 414×896 (mobile).
- E2E: `dashboard-widget-parity.spec.ts`:
  - 6 KPI tiles render with non-stub content
  - Sales Pipeline bar chart renders with `pipelineStages.length` bars
  - Recent Activity shows 0–3 wins + 0–3 invoices
  - Sign-out via SidebarUserFooter works

**Definition of done:**
- Visual diff against bible's `/Dashboard` screenshot ≤ 5 % drift.
- All `StubCard` instances removed from `dashboard-page.tsx`.
- Sidebar shows user name + sign-out; sign-out actually signs out.
- Chameleon logo on login, sidebar, mobile header — one source.

## Change 403 — per-user PGlite + sync policy

**Goal:** each Supabase user gets their own PGlite instance. Reference
data syncs once via Electric (common schema). Tenanted data syncs via
Electric shapes scoped by `company_id` through
`createTenantScopedElectricAdapter`. Latency-sensitive single-row
domains sync via Supabase Realtime. Cross-user data leakage is
architecturally impossible, not just policy-prevented.

**Library references:**
- `@prometheus-ags/prometheus-entity-management` v1.3 (already vendored
  in `packages/`):
  - `createPGlitePersistenceAdapter(pglite, options?)` — graph
    snapshot persistence inside PGlite.
  - `createTenantScopedElectricAdapter({ tenantColumn, claim })` —
    refuses shapes that don't declare `tenantColumn`; builds WHERE
    from validated `{ companyId }` claim.
  - `startLocalFirstGraph({ ..., retryPolicy, poisonHandler })` —
    offline replay with backoff.

**Tasks:**

### 403.a — Per-user PGlite key
1. Refactor `src/shared/db/pglite-client.ts`:
   - Replace the singleton with `openForUser(userId: string): Promise<PGlite>`
     and `closeForUser(userId: string): Promise<void>`.
   - Use `idb://hotseaters/${userId}` as the persistent name.
   - Cache the open instance per `userId` in module state; resolve
     immediately if already open.
2. **auth-store.ts** wire-up:
   - `signIn` success → `await pglite.openForUser(session.user.id)`,
     then start sync.
   - `signOut` → stop sync, `await pglite.closeForUser(prevUserId)`,
     then call Supabase signOut.
   - `onAuthStateChange('TOKEN_REFRESHED')` → no-op for PGlite.
3. **entity-graph reset**: when switching users, the Zustand graph
   stores must reset to empty. Add `useGraphStore.getState().reset()` to
   the signOut path. (If the function isn't already exposed, vendor it
   in.)

### 403.b — Schema split
1. Rename current `src/shared/db/local-schema.sql` → split:
   - `local-schema-common.sql` — system/reference tables:
     `metadata_type`, `entity_metadata`, `settings_type`, country/state
     lookups (`country`, `state`), pipeline-stage seed catalogs.
     Idempotent. Applied **once per user-PGlite first boot**, not per
     app load.
   - `local-schema-user.sql` — tenanted tables (`client`,
     `client_address`, `client_service_override`, `trial`,
     `trial_service`, `trial_contact`, `trial_segment`, `invoice`,
     `bill_payment`, `time_entry`, `expense`, `subcontract_request`,
     `subcontract_assignment`, `deal_document`, `document_signer`,
     `company`, `user_info`). Each gets `company_id`-filtered shape at
     Electric/Realtime boundary.
2. **pglite-client.ts** bootstrap order on first open per user:
   1. open PGlite
   2. apply `local-schema-common.sql`
   3. apply `local-schema-user.sql`
   4. attach `createPGlitePersistenceAdapter(pglite)` to graph
   5. start Electric subscriptions via `createTenantScopedElectricAdapter`
   6. start Realtime channels

### 403.c — Electric tenant adapter wiring
1. **electric-sync.ts** — wrap shape registrations through
   `createTenantScopedElectricAdapter({ tenantColumn: 'company_id',
   claim: () => ({ companyId: useAuthSession.getState().companyId }) })`.
   This means a shape that forgets to declare `tenantColumn` throws at
   attach time (defense in depth).
2. Register shapes for the Electric domains from the assessment R7
   table:
   - clients + addresses + service overrides
   - trials + trial_service + trial_contact + trial_segment
   - invoices + bill_payment
   - time_entry + expense
   - subcontract_request + subcontract_assignment
   - deal_document + document_signer
   - reference: pipeline_stage + service + service_category +
     metadata_type + settings_type (these go through the **common**
     adapter — no tenantColumn — gated by a separate
     `createSystemReferenceAdapter` helper; see 403.f).
3. Sync writes back: `write-sync.ts` already pushes optimistic changes
   to Supabase REST/Edge functions; no changes needed unless tenant
   adapter's outbound writes need the same tenant guard (verify against
   v1.3 docs).

### 403.d — Realtime channels for latency-sensitive single-row domains
1. NEW `src/shared/db/realtime-channels.ts`:
   - One channel for current `user_info` row (id =
     `auth-store.currentUserInfoId`).
   - One channel for current `company` row (id = userInfo.company_id).
   - One channel for `notifications` table filtered to current user.
   - Each handler writes the incoming row directly into the graph via
     `useGraphStore.getState().putEntity(type, row)`, which propagates to
     every subscribed component instantly.
2. Subscription lifecycle is tied to the PGlite open/close cycle
   (`openForUser` opens channels; `closeForUser` removes them).

### 403.e — Documentation
1. NEW `docs/architecture/sync-policy.md` — the per-domain table from
   assessment R7 verbatim, plus the rationale and a "how to add a new
   table" recipe.

### 403.f — System reference adapter (no tenant column)
1. A thin helper that attaches Electric shapes for system tables (no
   `tenantColumn`) but **only on the common-schema PGlite path**. Prevents
   accidentally attaching a tenanted shape via the wrong adapter.

**Tests:**
- Unit: `pglite-isolation.spec.ts` (Playwright):
  - Sign in as A, write a Client. Sign out. Sign in as B. Assert B's
    PGlite query returns 0 clients with A's `legacy_id`.
  - IDB inspection: assert two databases exist (`hotseaters/A`,
    `hotseaters/B`).
- Unit: `tenant-adapter.spec.ts` — attaching a shape without
  `tenantColumn` throws.
- E2E: theme change via Studio shows up in the running app within 2 s
  (Realtime path).
- Smoke: offline edit → reconnect → backlog drains via retryPolicy.

**Definition of done:**
- Cross-user isolation test green.
- `docs/architecture/sync-policy.md` lands and is linked from
  `CLAUDE.md`.
- No shape attaches in dev without a tenant column (verified by an
  intentional misuse test in CI).

## Change 404 — lookup entities + dashboard wiring

**Goal:** reference data (`pipeline_stage`, `service`, `service_category`,
`metadata_type`, `settings_type`) is reachable from any component via
entity-graph hooks. Dashboard's Sales Pipeline card stops using
hardcoded stages and uses the real lookup.

**Tasks:**
1. **src/features/lookups/entities.ts** (NEW) — use
   `registerEntityFromSql({ entityType, createTableSql })` against the
   common-schema SQL strings. Eliminates hand-written JSON Schemas.
2. **src/features/lookups/hooks/** (NEW):
   - `use-pipeline-stages.ts` — `useEntityList({ type: 'PipelineStage',
     where: { is_active: true, type: undefined }, orderBy: 'sort_order' })`.
     Variants: `use-sales-stages`, `use-operations-stages`.
   - `use-services.ts`, `use-service-categories.ts`,
     `use-metadata-types.ts` (with `scope` filter parameter),
     `use-settings-types.ts`.
3. **app-router.tsx** — at module load alongside
   `registerClientEntities()` and `registerTrialsFeatureEntities()`, add
   `registerLookupEntities()`.
4. **dashboard-page.tsx** + **use-dashboard-aggregates.ts** — switch the
   Sales Pipeline card from hardcoded stage names to
   `useSalesStages()`. Weighted pipeline computes against each stage's
   `revenue_probability`.
5. **client-type-picker.tsx** / similar selectors — if they currently
   hardcode their options, refactor to read from the new lookup hooks
   (out of scope for this change unless trivially adjacent).

**Tests:**
- Unit: `use-pipeline-stages.spec.ts` — fixture graph snapshot →
  expected ordering.
- E2E: `dashboard-pipeline-real-data.spec.ts` — seed two pipeline_stage
  rows, render dashboard, assert the bar chart has two bars labelled
  with the seed names.

**Definition of done:**
- Sales Pipeline card renders real stage names + counts.
- No hardcoded pipeline-stage strings remain in `dashboard-*` or any
  feature page (grep gate in CI: `git grep -i "Prospect\|Qualification"
  src/features/dashboard/` returns empty).

## OpenSpec change skeletons

The four change directories under `openspec/changes/` are pre-created
in this phase. Next step is to populate each with `proposal.md` +
`tasks.md`. Recommended invocation from within the project:

```
openspec proposal change-401-routing-redirect-last-route \
  --title "Routing redirect + last-route" \
  --summary "Add /dashboard alias, auth-aware landing redirect, lastViewedPage tracker." \
  --rationale ".kbd-orchestrator/phases/dashboard-and-data-architecture-parity/plan.md#change-401"
```

(Then repeat for 402, 403, 404. The proposals can also be hand-written;
the OpenSpec CLI just scaffolds.)

## Verification — per-phase definition of done

After all four changes ship to
`https://hotseaters-ultimate.prometheusags.ai`:

1. Real Google sign-in lands on `/Dashboard` or last-viewed page.
2. `/dashboard` lowercase → `/Dashboard`.
3. Dashboard renders every widget from
   `HotSeatersMVP/src/pages/Dashboard.jsx` at ≤ 5 % visual drift vs the
   bible screenshot.
4. Sidebar shows user footer with working sign-out, group order
   matches bible exactly (Overview → Sales → Operations → HotSeatHub →
   Billing → Company → Help).
5. Chameleon logo is the only logo source across login / sidebar / mobile header.
6. Sign in as user A, create client. Sign out. Sign in as user B —
   B does not see A's client. IDB inspection shows two databases.
7. Theme change in self-hosted Studio reflects in app within 2 s
   (Realtime path).
8. `git grep -i "Prospect\|Qualification"` in `src/features/dashboard/`
   returns empty (no hardcoded stages).
9. Existing bible-parity Playwright harness re-runs green on
   `/Dashboard` route at 1440×900 and 414×896.
10. `pnpm typecheck && pnpm test && pnpm test:e2e` green.

## Out of scope (deferred to follow-up phases)

- Onboarding wizard bible-parity re-audit (queued from prior phase as
  task #68 — its own KBD phase).
- Microsoft OAuth wiring (button stays disabled with tooltip).
- `<CompanyMigration />` component port.
- The 80+ Doc* routes (deprecated by RULE 7).
- TanStack Table integration via `useEntityListAsTable` for the trials
  list page — separate change.

## Recommended next step

Spawn 4 parallel implementer agents (Change 401 first because it
unblocks 402; 402 + 403 in parallel; 404 after both land). Use
`/kbd-execute dashboard-and-data-architecture-parity` to dispatch.
