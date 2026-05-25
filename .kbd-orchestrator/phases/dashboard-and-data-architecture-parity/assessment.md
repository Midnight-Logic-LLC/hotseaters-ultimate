# Dashboard reach + app-shell bible parity + data-architecture foundation

## Context

After the auth-surfaces work landed (chameleon login, sign-up, forgot-password,
PKCE race fix, `isAuthenticated`/`hasCompany` split), a real Google sign-in
now reaches the authenticated subtree — but the user is **not landing on the
dashboard the screenshot promises**. The bible's `/Dashboard` is a 1440-LOC
information-dense surface (6 KPI tiles, sales pipeline bar chart, Quick
Stats, Recent Activity, weekly + monthly team performance, active trial
performance, upcoming trials, Quick Actions, revenue trend with projected
overlay). The port's `dashboard-page.tsx` is 221 LOC with three of the six
KPI tiles rendered as `StubCard` placeholders ("Lands when Invoice syncs
v0.2") and no charts at all.

In parallel, four architectural items must be cemented now while the
surface area is still small: token storage, last-route restoration,
prometheus-entity-management + Zustand for global entity state (including
lookups), and PGlite client-first pattern with per-user isolation.
ElectricSQL and Supabase Realtime must be split per domain — neither one
solo solves every requirement.

Sycophancy-correction lens applied throughout: every claim below cites a
file path with line numbers; deltas are stated as **Delta → Root Cause →
Corrective Action**, not as praise or generic "improvements".

## Evidence inventory (read in this session)

| File | LOC | Read |
|---|---|---|
| `HotSeatersMVP/src/App.jsx` | 263 | full |
| `HotSeatersMVP/src/Layout.jsx` | 631 | full |
| `HotSeatersMVP/src/pages/Dashboard.jsx` | 1441 | 1–1095 (paginated; remainder is more team/trial/timeline cards) |
| `hotseaters-ultimate/src/app/app-shell.tsx` | 266 | full |
| `hotseaters-ultimate/src/app/app-router.tsx` | 278 | full |
| `hotseaters-ultimate/src/app/navigation.ts` | 174 | full |
| `hotseaters-ultimate/src/app/tier1-provider.tsx` | 135 | full |
| `hotseaters-ultimate/src/features/dashboard/pages/dashboard-page.tsx` | 221 | full |
| `hotseaters-ultimate/src/shared/db/` | 11 files | listed |

Port already has: `pglite-client.ts`, `pglite.worker.ts`, `electric-sync.ts`,
`entity-graph-bootstrap.ts`, `sync-config.ts`, `sync-gate.tsx`, `write-sync.ts`,
`local-schema.sql`. The plumbing exists; the gaps are isolation policy,
domain routing (Electric vs Realtime), and dashboard wiring.

## Delta → Root Cause → Corrective Action

### D1. After login the user does not reach a dashboard at `/dashboard`

- **Delta.** `app-router.tsx:124` only defines `path="Dashboard"` (capital
  D). There is no lowercase `/dashboard` route, and **no landing-page
  redirect** for authenticated visitors. Bible `App.jsx:97-100` does
  `window.location.replace('/Dashboard')` for any `isAuthenticated`
  visitor on `/` or `/Landing`.
- **Root cause.** Two stacked bugs: (a) authenticated users hitting `/`
  see the marketing page, (b) `/dashboard` lowercase falls through to
  the `*` not-found.
- **Corrective action.** In `LandingPage`, add an auth-aware redirect
  matching `Layout.jsx:364-419` semantics (pending invite, no userInfo,
  inactive, no company, otherwise last-viewed or `/Dashboard`). Add
  `<Route path="dashboard" element={<Navigate to="/Dashboard" replace />} />`.

### D2. Last-route restoration not implemented

- **Delta.** Bible writes `user_info.preferences.lastViewedPage` on every
  non-public page (`Layout.jsx:443-479`) with a 500ms debounced writer,
  then on initial authenticated landing redirects to `lastViewedPage`
  guarded by `initialRedirectDoneRef` (`Layout.jsx:407-419`). Port has
  no equivalent — no `lastViewedPage` reference anywhere in
  `src/features/auth/` or `src/app/`.
- **Root cause.** Behaviour was assumed to come from base44 — bible
  owns it explicitly.
- **Corrective action.** New `src/app/last-route-tracker.tsx` mounted
  inside `<AuthGate>`; reuses `useCurrentUser` + a new
  `userInfoStore.patchPreferences(patch)` action. Same `skipPages` list.
  Initial-load redirect collocated in `LandingPage` (single source).

### D3. Dashboard is structurally faithful but data-empty (3 of 6 KPIs are stubs, all charts missing)

- **Delta.** `dashboard-page.tsx:107-160` renders `StubCard` for Revenue
  YTD, Outstanding, and Revenue/Trial YTD. Bible pulls invoices,
  timeEntries, subcontractAssignments, trialServices via
  `runPacedQueriesClient` (`Dashboard.jsx:76-105`) and computes revenue
  trend (monthly + weekly, cumulative toggle, trend line, goal line,
  projected vs actual stacked bars), per-consultant weekly/monthly
  hours/revenue, per-trial hours/revenue, recent invoices, recent wins.
  Port has none of the charts.
- **Root cause.** Invoice + TimeEntry + TrialService entities aren't
  wired into the entity graph yet. Deferred to v0.2; user moved it up.
- **Corrective action.** Three sub-actions:
  1. Register `Invoice` + `TimeEntry` + `TrialService` +
     `SubcontractAssignment` + `SubcontractRequest` entities (mirror
     `registerClientEntities` / `registerTrialsFeatureEntities` at
     `app-router.tsx:30-31`).
  2. New `useDashboardAggregates(companyId)` hook that mirrors the
     bible's math against the local PGlite mirror.
  3. Replace each `StubCard` with the bible's actual Card JSX (copy
     `Dashboard.jsx:763-883` for the 6 KPI tiles, `:890-1083` for
     pipeline/quickstats/activity row). Recharts trend chart can defer
     to a follow-up — user accepted empty states.

### D4. App-shell vs. bible — missing SidebarUserFooter, wrong logo, missing NotificationsMenu/TrialBanner/Toaster

- **Delta.** Bible `Layout.jsx:591` renders `<SidebarUserFooter>` (the
  sign-out menu); port shell omits it. Bible mobile header
  (`:596-617`) renders `<NotificationsMenu />`; port omits. Bible mounts
  `<TrialBanner>` (`:619`) and `<Toaster position="top-center" />`
  (`:550`); port omits. Logo sources are inconsistent:
  `app-shell.tsx:128` uses `/logo.svg`, auth pages use
  `/brand/chameleon-logo.png`, bible uses a base44 CDN URL.
- **Root cause.** App-shell was structural-only by design ("no data
  loading, no auth gates"). Bible's shell is data-rich.
- **Corrective action.** Unify logo to `/brand/chameleon-logo.png`
  (already mirrored in `public/brand/`). Port in order of user value:
  (a) `SidebarUserFooter` — needed to sign out cleanly,
  (b) root `<Toaster>` — every form already calls toast(),
  (c) `<TrialBanner>` — cheap; renders only when `company.trial_status`,
  (d) `NotificationsMenu` + `CompanyMigration` — defer, not on the
  screenshot critical path.

### D5. PGlite is single-instance, not per-user — cross-user data-leak risk

- **Delta.** `src/shared/db/pglite-client.ts` is the canonical PGlite
  singleton. User locked in: "ONE PGlite per user identity (full
  isolation)." Today it's almost certainly keyed by app load, not by
  `auth.user.id`.
- **Root cause.** Bootstrapped before auth was wired; per-user
  requirement is new.
- **Corrective action.** Key IndexedDB / OPFS path on `auth.user.id`
  (e.g. `idb://hotseaters/${userId}/db`). On `signOut`, close + discard
  the instance; on sign-in, re-bootstrap. Reset all entity-graph
  Zustand stores between user switches. Playwright test verifying
  user-A's data is invisible to user-B after sign-out/sign-in.

### D6. Common-startup migration vs. user-specific tables — boundary not declared

- **Delta.** `local-schema.sql` exists but conflates system-wide
  reference data with per-user tenanted rows. User explicitly asked:
  "handling the initial common startup migration… AND handling the user
  specific tables in pglite that should be stored based on the user's
  identity and rights."
- **Root cause.** Single schema file conflates both layers.
- **Corrective action.** Split:
  - `local-schema-common.sql` — system reference tables (metadata_type
    catalogs, country/state lookups, settings_type registry) — applied
    once per user-PGlite (not per app load).
  - `local-schema-user.sql` — per-user tenanted tables (clients,
    trials, invoices, subcontract_assignment, time_entry, …) with
    `company_id`-filtered shapes at Electric/Realtime boundary.
  Bootstrap order: open PGlite → apply common (idempotent) → apply
  user → start sync subscriptions.

### D7. Electric vs Supabase Realtime — no per-domain split documented

- **Delta.** User: "analyze electricsql vs. supabase realtime for
  updating using one or both where architecturally sound and
  appropriate." Today `electric-sync.ts` exists; no Realtime channel
  subscriptions exist in the port.
- **Root cause.** Electric does shape-based bulk sync; Realtime does
  per-row push. Overlap, but different failure modes and latencies.
- **Corrective action.** Adopt this split (codified in
  `docs/architecture/sync-policy.md`):

  | Domain | Transport | Why |
  |---|---|---|
  | Clients, Trials, TrialService, TrialContact, TrialSegment | Electric shapes | Large historical sets, offline replay |
  | Invoice, BillPayment, TimeEntry, Expense | Electric shapes | Read-heavy historical data |
  | UserInfo (current), Company (current) | Realtime | Single row, latency-sensitive (theme, status) |
  | Notifications, SubcontractRequest open feed | Realtime | Push-driven, ephemeral |
  | Reference data (metadata_type, settings_type, pipeline_stage) | Electric, common-schema | Rarely changes |
  | Auth session | Supabase JS built-in | Already wired |

  Keep `electric-sync.ts` as the bulk loader; add
  `realtime-channels.ts` that opens one channel per latency-sensitive
  table and writes into the same PGlite instance. Last-write-wins by
  `updated_at` for v1.

### D8. prometheus-entity-management lookup-data wiring incomplete

- **Delta.** Feature stores use `@prometheus-ags/prometheus-entity-management`
  for clients + trials, but pipeline_stage, service_category, service,
  metadata_type are NOT registered as entities. Bible
  `Dashboard.jsx:48-51` reads `pipelineStages`, `services`,
  `serviceCategories`, `clients` directly off Tier-1 as lookups.
- **Root cause.** Lookups deferred along with Invoice/TimeEntry to v0.2.
- **Corrective action.** New `src/features/lookups/entities.ts`
  registering `PipelineStage`, `Service`, `ServiceCategory`,
  `MetadataType`, `SettingsType`. Boot at app start via the same
  module-side-effect pattern. Expose `usePipelineStages()`,
  `useServices()`, `useServiceCategories()` hooks. Consumers read via
  the entity-graph selector — the prometheus-entity-management idiom.

### D9. Token storage already works — verify, don't re-fix

- **Delta.** Auth-surfaces phase (`48f4817`) shipped the
  `isAuthenticated = !!session` split + PKCE race-catch. localStorage
  `sb-<project>-auth-token` should persist. User's item #1 was likely
  residual concern.
- **Root cause.** Already met.
- **Corrective action.** Playwright smoke: sign in → reload → assert
  `localStorage.getItem('sb-…-auth-token')` non-null AND `pathname ===
  '/Dashboard'`. If fail, debug; otherwise close.

## Approach — 4 ordered changes

### Change A (foundation, blocks B/C/D) — Routing + redirect + last-route

- `src/features/landing/pages/landing-page.tsx` — auth-aware redirect
  per bible `App.jsx:97-100` + branching from `Layout.jsx:364-419`.
- `src/app/app-router.tsx` — `/dashboard` lowercase alias; mount
  `<LastRouteTracker />` inside `<AuthGate>`.
- `src/app/last-route-tracker.tsx` (NEW) — debounced writer for
  `user_info.preferences.lastViewedPage`.
- `src/features/auth/stores/user-info-store.ts` — `patchPreferences`.

**Verify:** Google sign-in → `/Dashboard`. Sidebar click → URL changes.
Reload mid-route → stays. Sign-out / sign-in → lands on last-viewed.
`/dashboard` → `/Dashboard`.

### Change B (visual parity) — App-shell + dashboard widgets to bible parity

- `src/app/app-shell.tsx` — port SidebarUserFooter, mount Toaster,
  mount TrialBanner, unify logo to `/brand/chameleon-logo.png`.
- `src/features/auth/components/sidebar-user-footer.tsx` (NEW).
- `src/features/dashboard/pages/dashboard-page.tsx` — replace 3
  StubCards with real Cards.
- `src/features/dashboard/hooks/use-dashboard-aggregates.ts` (NEW).
- `src/features/dashboard/components/revenue-trend-card.tsx` (NEW,
  recharts; deferrable to B.b if diff bloats).

**Verify:** pixel diff at 1440×900 against user screenshot. 6 tiles
populated. Sidebar shows footer with working sign-out. Chameleon
everywhere.

### Change C (data architecture) — Per-user PGlite, schema split, sync policy

- `src/shared/db/pglite-client.ts` — refactor: per-user key,
  `closeForUser()` + `openForUser(id)`.
- `src/shared/db/local-schema-common.sql` (NEW from current schema).
- `src/shared/db/local-schema-user.sql` (NEW).
- `src/shared/db/realtime-channels.ts` (NEW) — user_info + company +
  notifications channels.
- `src/shared/db/electric-sync.ts` — register shapes per D7.
- `src/features/auth/stores/auth-store.ts` — wire close/open on
  signOut/signIn.
- `docs/architecture/sync-policy.md` (NEW).

**Verify:** sign in as A, create client; sign out; sign in as B; B does
not see A's data. Sign out + back in: client list rehydrates. Theme
change in Studio reflects in app within 2s.

### Change D (lookups + dashboard wiring) — Register lookup entities

- `src/features/lookups/entities.ts` (NEW) — register PipelineStage,
  Service, ServiceCategory, MetadataType, SettingsType.
- `src/features/lookups/hooks/` (NEW) — use-pipeline-stages,
  use-services, use-service-categories.
- `src/features/dashboard/hooks/use-dashboard-aggregates.ts` —
  consume pipeline stages from lookup hook for weighted pipeline.
- `src/app/app-router.tsx` — call `registerLookupEntities()` at module
  load alongside the existing two.

**Verify:** Sales Pipeline card shows real `pipeline_stage` rows.
Weighted pipeline value uses each stage's `revenue_probability`.

## Out of scope

- Replacing recharts (bible uses it; port will too).
- Full mobile bottom-tab parity (BottomTabBar already exists).
- The 80+ Doc* routes from bible `App.jsx:177-258` — deprecated by
  RULE 7.
- Microsoft OAuth wiring (button stays disabled with tooltip).

## Definition of done

After A + B + C + D deploy to
`https://hotseaters-ultimate.prometheusags.ai`:

1. Google sign-in lands on `/Dashboard` (new user) or last-viewed
   (returning).
2. `/dashboard` (lowercase) redirects to `/Dashboard`.
3. Dashboard renders all 6 KPI tiles with real numbers (or 0/empty —
   not "Lands in v0.2").
4. Sidebar group order matches bible: Overview → Sales → Operations →
   HotSeatHub → Billing → Company → Help. SidebarUserFooter present;
   sign-out works.
5. Chameleon logo on login, sidebar header, mobile header.
6. PGlite keyed by `auth.user.id`; account switch in one browser does
   not leak.
7. Reference data reads from entity graph via `useLookups()` hooks.
8. Realtime channel for `user_info` propagates theme changes within 2s.
9. Playwright smoke: token persists across reload, last-route restores
   across sign-out/sign-in, cross-user isolation holds.

## Verification strategy

Per-change: `pnpm typecheck && pnpm check:filenames` green. Playwright
under `tests/e2e/`:
- `auth-and-dashboard-reach.spec.ts` — DoD #1, #2, #9.
- `app-shell-parity.spec.ts` — visual diff against screenshot.
- `pglite-isolation.spec.ts` — DoD #6.

Production smoke after deploy: private window, Google sign-in flow,
confirm all 9 DoD items.
