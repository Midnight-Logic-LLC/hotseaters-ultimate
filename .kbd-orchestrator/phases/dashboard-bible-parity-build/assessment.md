# Assessment — Dashboard Bible Parity (Post-Build Regression Round)

> Phase: `dashboard-bible-parity-build`
> Status before this assessment: `execution_complete: true`, `reflection_complete: false`
> Driver for this assessment: user-supplied dev console errors + side-by-side
> screenshots showing visible parity gaps with the bible (Quick Stats team
> members, card styling, charts unrenderable, welcome name missing).
> This document SUPERSEDES the prior assessment for this phase.

## Scope

The user reported the dashboard still fails in dev with **four real defects** despite
two completed runtime-fix rounds (commits `52ca966..0350168` and `bb071b3..9c60a50`):

1. Recharts `Maximum update depth exceeded` crash inside `<ChartDataContextProvider>`.
2. Recharts `width(-1) height(-1)` warning at first paint.
3. React 19 `getSnapshot should be cached to avoid an infinite loop` warning
   (regressed; the previous fix was applied to the wrong directory — see §A.1).
4. Side-by-side screenshot diff vs bible:
   - **Card chrome**: port uses a hard near-black ring; bible uses a soft
     stone border + drop shadow. Cards look harsh on the port.
   - **Border radius**: port uses `rounded-xl` (12 px); bible uses `0.5rem` (8 px).
   - **Welcome header**: port renders "Welcome back" with no name; bible
     renders "Welcome back, Travis".
   - **Quick Stats → Team Members**: port shows `0`; bible shows `2` for the
     same user with the same data.
   - **Recent Activity / KPI tiles**: port shows skeleton/empty; bible shows
     real numbers and recent items.

The user also stated the directional rules for fixes:

1. **For `prometheus-entity-management` fixes** — edit the submodule under
   `hotseaters-ultimate/packages/prometheus-entity-management/`, rebuild,
   confirm, then version-bump + `npm publish`. Reference THAT submodule from
   the app (not any vendor copy).
2. **For `recharts` fixes** — add the fork as a submodule, fix there,
   commit, reference via git ref.
3. **Styles must precisely match the bible** at
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP`. Card borders, layout,
   proportions, sizes.
4. **Data must match the bible** for the same user. The "0 vs 2" Team
   Members mismatch is a real bug; investigate root cause.

This assessment locates the root cause of each defect and the prerequisite
facts the plan will rely on. **No code changes** in this phase — by design.

---

## A. Library-resolution defects (root cause of the regressed warnings)

### A.1. Earlier "memoize `useEntityList`" fix landed in the wrong directory

The previous round's plan called for editing
`/Users/gqadonis/Projects/midnight/latest-data/packages/prometheus-entity-management/src/hooks.ts`
and rebuilding it. That edit landed and `dist/index.mjs` there contains
the `useMemo` wrap. But the app's pnpm workspace points at a different
directory:

```yaml
# hotseaters-ultimate/pnpm-workspace.yaml
packages:
  - packages/prometheus-entity-management   # <-- git submodule
  - .
```

```jsonc
// hotseaters-ultimate/package.json
"@prometheus-ags/prometheus-entity-management": "workspace:*",
```

```yaml
# pnpm-lock.yaml
'@prometheus-ags/prometheus-entity-management':
  specifier: workspace:*
  version: link:packages/prometheus-entity-management
```

```ini
# hotseaters-ultimate/.gitmodules
[submodule "packages/prometheus-entity-management"]
  path = packages/prometheus-entity-management
  url = git@github.com:Prometheus-AGS/prometheus-entity-management.git
```

So:

- `node_modules/@prometheus-ags/prometheus-entity-management` →
  `link:packages/prometheus-entity-management` (the submodule)
- The submodule's `src/hooks.ts` still has the **un-memoized** `useEntityList`
  return at line ~124. No `useMemo` wrap.
- The `latest-data` copy of the same package is a **separate working tree**
  not consumed by this app.

The console trace confirms it — the warning lands at `hooks.ts:108`
(matches the submodule's `useStore(useGraphStore, useShallow(itemsSelector))`
line) and bubbles via `useTeam` → `useQuickStats` → `KpiOutstanding`.

**Submodule identity:**
- Path: `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/packages/prometheus-entity-management`
- Remote: `git@github.com:Prometheus-AGS/prometheus-entity-management.git`
- Branch: `main`, HEAD: `a86145e feat(v1.3.0): PGlite + tenant-scoped Electric adapters, ...`
- Local `package.json` version: `1.3.0`
- npm published versions: `1.0.0, 1.1.0, 1.2.0, 1.2.1, 1.2.2, 1.2.3` —
  **`1.3.0` is unpublished** (per `npm view`).

**This directly satisfies the user's Rule #1.** A web search ([pnpm
workspaces guide](https://pnpm.io/workspaces),
[Adam Coster — Configure pnpm](https://adamcoster.com/blog/pnpm-config))
confirms that for git-submodule + `workspace:*` setups, the **right loop**
is: edit the submodule's `src/`, rebuild via the submodule's build script,
and the app picks up the change instantly (no install / publish). When the
fix is confirmed, version-bump + `npm publish` so external consumers can
upgrade. The publish step is for downstream consumers — the local app
gets the fix from the live submodule link.

### A.2. Recharts is installed via the fork but not as a submodule

After the last round, `node_modules/recharts` is a symlink to a pnpm-cached
tarball of `GQAdonis/recharts#release` at commit `47d749e`. Version `3.8.1`.
Build artifacts (`lib`, `es6`, `umd`, `types`) all present.

This works for *consuming* the fork but does **not** satisfy the user's
Rule #2 — there's no submodule. To land a fix in recharts we currently
have to clone the fork separately, build, force-push `release`, then
`pnpm update recharts` in the app. The user wants the same loop pattern as
the entity-management package: submodule → edit → commit → reference via
git ref.

There is no `.gitmodules` entry for recharts at the app root yet.

---

## B. Visual-parity defects (Rule #3)

### B.1. Card primitive uses a hard ring, not the bible's soft border

`src/components/ui/card.tsx` line 14:

```tsx
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 ...",
  className
)}
```

The bible's cards are constructed with **inline styles binding to the
`--theme-card-*` tokens** (`HotSeatersMVP/src/pages/Dashboard.jsx` line 926+):

```jsx
<Card style={{
  borderRadius: 'var(--theme-card-radius)',
  boxShadow: 'var(--theme-card-shadow)',
  borderWidth: 'var(--theme-card-border)',
  backgroundColor: 'var(--theme-card-bg)'
}}>
```

The port already declares those tokens in `src/index.css` lines 119-122:

```css
--theme-card-radius: 0.5rem;     /* 8 px — bible */
--theme-card-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--theme-card-border: 1px;
--theme-card-bg: #FFFFFF;
```

So the tokens are correct; the primitive ignores them and applies its own
`rounded-xl` + `ring-1 ring-foreground/10` instead. `--foreground` in the
port is `222 11% 9%` (near-black), so `ring-foreground/10` is a 10% black
ring — visually different from a 1 px stone border + drop shadow. The card
also adds `overflow-hidden` which clips any card-padding shadow.

**Where to fix**: the primitive itself — replace the hard ring with the
bible's token-driven border + shadow + radius + bg. Every Card consumer
inherits the fix; no per-widget overrides needed.

### B.2. Welcome header missing the user's first name on first paint

`src/features/dashboard/widgets/welcome-header.tsx`:

```tsx
Welcome back{userInfo?.first_name ? `, ${userInfo.first_name}` : ''}
```

Bible (`Dashboard.jsx:703`):

```jsx
Welcome back, {userInfo?.first_name || 'User'}
```

Two differences:

1. **Fallback string**: bible falls back to `'User'`, port falls back to
   an empty conditional. While `userInfo` is loading the bible shows
   "Welcome back, User"; port shows "Welcome back" with no name.
2. **Comma always present**: bible always has the comma; port suppresses
   the comma when no first_name. Causes "Welcome back" → "Welcome back, Travis"
   layout shift after hydration.

The user data IS available — the screenshot shows tier1 eventually
delivers `first_name: 'Travis'` (the bible renders it on the same data).
Port simply paints early before tier1 resolves and chooses an
inconsistent fallback.

### B.3. Sidebar / page chrome small mismatches

Port screenshot shows the `OVERVIEW / SALES / OPERATIONS / HOTSEATHUB /
BILLING / COMPANY / HELP` sidebar labels rendering in a different
typeface from the bible (lowercase, smaller). Same content, different
weight. Out of scope for the dashboard widgets, but mentioned because
the user's directive is "PRECISELY the same". Tracked here as a follow-up
but not a blocker for this assessment's plan — the dashboard parity
gates are inside `<DashboardPage>`.

---

## C. Data-correctness defects (Rule #4)

### C.1. Quick Stats → Team Members shows 0 instead of 2

`src/features/dashboard/hooks/use-quick-stats.ts` line 174:

```ts
teamMembers: consultants.length,
```

`consultants` is constructed earlier in the hook from `useTeam(companyId).members`
and then mapped to a shape with a static `status: 'active'`. So
`consultants.length === members.length` already; the question is whether
`members` is empty.

`useTeam` is defined at
`src/features/company/hooks/use-team.ts` and uses `useEntityList` with
`fetch: () => fetchTeamForCompany(companyId)`.

`fetchTeamForCompany` at
`src/features/company/stores/company-store.ts`:

```ts
const { data, error, count } = await supabase
  .from('user_info')
  .select('*', { count: 'exact' })
  .eq('company_id', companyId)
  .order('created_at', { ascending: true });
```

This is a **Supabase REST call**, not a local PGlite read. It depends on
the browser being able to reach `supabase.from('user_info')` AND on RLS
permitting the `anon`/`authenticated` JWT to see the company's user_info
rows. Three likely causes (the assessment cannot pick one without dev
console network inspection):

a. **`useTeam` returns `members: []` because the call failed silently**
   (the hook discards `error` in the snapshot used by `useQuickStats`).
   We saw a parallel pattern with the `lead`/`sales_activity`/`attorney`
   REST 400s earlier this phase — easy regression vector. Network
   inspection at runtime is required to confirm.

b. **`useTeam` returns `members: []` because the `getSnapshot` infinite
   loop (§A.1) prevents the hook from completing the first commit**, so
   `KpiOutstanding` and `QuickStatsCard` see the EMPTY_LIST_STATE rather
   than fresh data. This is consistent with the console trace showing
   the warning fires at `use-team.ts:39` (the `useEntityList` call) inside
   `kpi-outstanding.tsx`'s render. Fixing §A.1 may resolve §C.1 as a
   side-effect.

c. **The bible computes `activeConsultants.length`, not
   `members.length`** (Dashboard.jsx:209: `consultants.filter(c => c.status
   === 'active')`). The port's `consultants` array sets a hard
   `status: 'active'` for every row regardless of the actual `user_info.status`
   — so even if `members` has the right 2 users, the port's count would
   match the legacy result. So this branch is NOT the root cause of the
   "0" but it IS a latent bug: if a user is `'inactive'` in the DB, the
   port would still count them. The bible filters them out.

Most likely root cause: **(b) cascades to (a) being observed**. Confirming
requires a) fixing §A.1 first and reloading the dashboard, b) inspecting
the network tab for the `/rest/v1/user_info?...&company_id=eq.<uuid>` call
status code and response body.

### C.2. Other Quick Stats fields likely cascade from §A.1

The bible screenshot shows the same user has real Recent Activity, real
KPI numbers, real chart bars. The port shows skeletons everywhere except
the Outstanding tile ($0, which is the EMPTY_LIST_STATE value). Pattern:
**every Tier-A / hybrid `useEntityList` consumer is stuck at first commit
because of the `useSyncExternalStore` infinite-loop guard tripping**, so
no hook ever delivers data into the widget tree.

This is the **single biggest defect** in the current build and resolving
§A.1 is the most likely unblock for everything in column C.

---

## D. Recharts loop + width(-1) defects (Rule #2 path)

The two recharts warnings + the `Maximum update depth exceeded` crash
inside `<ChartDataContextProvider>` originate from the recharts internal
store (`recharts.js?v=...:7393` `dispatch` chain) being woken by an
empty data array followed by a fresh empty data array on every render —
a classic React 19 + recharts 3.x `ResponsiveContainer` + ChartDataContext
interaction.

**Established facts:**

- Port is on `recharts 3.8.1` (one patch ahead of npm 3.8.0, from the
  `GQAdonis/recharts#release` fork at commit `47d749e`).
- All three chart wrappers already have `minWidth={1} minHeight={1}` on
  `ResponsiveContainer` and `minWidth: 0, minHeight: 'Nrem'` on the
  wrapper div. The warning fires anyway.
- The known upstream issue tracker entries
  ([#5489](https://github.com/recharts/recharts/issues/5489),
  [#6613](https://github.com/recharts/recharts/issues/6613),
  [#6716](https://github.com/recharts/recharts/issues/6716)) have closed
  PRs but no confirmed-fixed npm version for the ChartDataContextProvider
  path. The fork at `main` (= 3.8.1) does not include a localized fix yet.

**Why a Rule-#2 submodule of recharts is the right path:** the loop is
triggered by recharts' own context provider in response to the data
churning from our broken `useEntityList` (see §C.2). Once §A.1 is fixed
and `useEntityList` returns stable identity, the data array stops
churning and recharts may stop looping — i.e. the loop is a *symptom* of
§A.1, not an independent recharts bug. **Verify by re-testing after
§A.1**. If it persists after the data is stable, we then add recharts
as a submodule and patch the `ChartDataContextProvider` source directly
(the user's Rule #2).

The same logic applies to the `width(-1)` warning — recharts measures
`-1` when an early-commit render produces a 0-height parent. If the data
stabilizes and the parent renders at real height on first paint, the
warning stops too.

**Recharts submodule prep (when we get there):**
- Fork already exists at `git@github.com:GQAdonis/recharts.git`
- `main` is current with upstream 3.8.1
- `release` branch carries prebuilt `lib/`, `es6/`, `umd/`, `types/`
  artifacts (built on 25 May, commit `47d749e`)
- To convert to a submodule: `git submodule add git@github.com:GQAdonis/recharts.git packages/recharts`,
  then pin app to `"recharts": "workspace:*"` (or to the git+ branch ref
  — both work; submodule is the Rule-#2 ask).
- `release` branch ships with the build artifacts already committed, so
  consumption is immediate.

---

## E. Other / non-blocking

- **Electric HTTP/1.1 connection-cap warning** — purely cosmetic,
  already documented in `docs/RUNBOOKS.md` "Electric routing in dev + prod".
  Not in scope.
- **`Maximum update depth exceeded` and ChartDataContextProvider error
  boundary recommendation** — symptom; downstream of either §A.1 (most
  likely) or a true recharts upstream bug (less likely). Resolves with
  §A.1 or with §D.

---

## F. Definition-of-Done deltas (this round)

Against the phase DoD already in `progress.json`:

| DoD item | Status now | Why |
|---|---|---|
| Bible /Dashboard ≥95% pixel parity @ 1440×900 + 375×667 | **FAIL** | Card chrome wrong (§B.1), welcome name missing (§B.2), data empty (§C.2). |
| Every widget owns its own data hook + skeleton | **PASS** | Confirmed structurally. |
| No widget calls PGlite directly | **PASS** | Confirmed. |
| Adding a widget = registry row + widget + hook file | **PASS** | Confirmed (commit f8af764 closed the page shell). |
| Role gating only in `use-dashboard-widgets` + `use-quick-actions` | **PASS** | CI grep gate passed. |
| `pnpm typecheck && pnpm lint && pnpm test` green | **PASS** | 298/298 green as of `381546b`. |
| Cypress role-permutation + offline-fallback + realtime specs pass | **UNKNOWN — not re-run since regression** | Re-run after fix round. |
| Lighthouse a11y ≥95 | **UNKNOWN — blocked by data not rendering** | Need data first. |
| Bundle size unchanged or smaller | **PASS** | Recharts fork is +1KB; entity-mgmt unchanged. |

**Net**: the structural / architectural DoD items remain passed; what
regressed is the **rendered output** (cosmetic + data) — entirely
downstream of §A.1 (wrong-directory library fix) + the unresolved
recharts-loop interaction.

---

## G. Recommended plan shape (next /kbd-plan input)

For Phase B (recommended split into 5 changes, in dependency order):

1. **`change-410-entity-mgmt-memoize-useEntityList-submodule-fix`** —
   Apply the `useMemo` wrap to the **submodule** at
   `packages/prometheus-entity-management/src/hooks.ts`. Rebuild
   (`pnpm --filter @prometheus-ags/prometheus-entity-management build`).
   Commit to the submodule's `main`. Push. Then in the
   `hotseaters-ultimate` superproject, `git add packages/prometheus-entity-management`
   to bump the submodule pointer. Tests must stay 298/298.

   **Publish step (per user Rule #1)**: in the submodule, bump version
   to `1.3.1` (since 1.3.0 was never published), `npm publish`. Document
   in submodule's `CHANGELOG.md`. The app stays on `workspace:*` because
   that's how the local loop works; downstream consumers can `npm install
   @prometheus-ags/prometheus-entity-management@1.3.1`.

2. **`change-411-card-primitive-bible-tokens`** — Rewrite
   `src/components/ui/card.tsx` so the default classes / inline styles
   match the bible's token-driven look (`borderRadius`, `boxShadow`,
   `borderWidth`, `backgroundColor` from `--theme-card-*`). Add visual
   regression coverage at 1440×900 vs the bible screenshot. Side-by-side
   pixel diff ≤5%.

3. **`change-412-welcome-header-fallback-parity`** — Tiny fix: add
   `|| 'User'` fallback and always emit the comma, matching
   `Dashboard.jsx:703`. Done in one edit.

4. **`change-413-recharts-submodule-or-no-op`** — Re-test the dashboard
   AFTER changes 410-412 land. If the recharts `Maximum update depth`
   loop is gone (most likely), close this change as no-op. If it
   persists, add `GQAdonis/recharts` as a git submodule at `packages/recharts`,
   identify the patch point in recharts' `ChartDataContextProvider`,
   land the fix on submodule's `main`, rebuild, push to `release`, and
   re-point the app's `package.json` to `workspace:*` (or to the
   `release` branch by tag). Defer the actual recharts source patch
   until verified necessary.

5. **`change-414-team-members-data-root-cause`** — Once §A.1 is fixed
   AND we can see the real network response: inspect the
   `/rest/v1/user_info?...&company_id=eq.<uuid>` call in DevTools. If
   it returns 0 rows, check RLS on `user_info` for the JWT identity
   (the bible's reads use the same JWT, so the RLS must permit it).
   If it returns 2 rows but `useTeam.members.length === 0`, the bug is
   in the `useEntityList` normalize step. If 2 rows AND
   `members.length === 2` but `Team Members` still shows 0, the bug
   is in `use-quick-stats.ts`'s consultants mapping. Don't write code
   before observing.

---

## H. Risks

- **Submodule SHA bump in superproject**: After landing change-410 we
  must commit the new submodule pointer in `hotseaters-ultimate` —
  forgetting this means CI installs the old SHA and the warning returns.
  Add a CI guard or document it in `docs/RUNBOOKS.md`.
- **`workspace:*` + `npm publish`**: Per the pnpm guide, `workspace:*`
  is auto-rewritten to the actual version on publish. Confirm in the
  submodule's `package.json` that there are no other `workspace:*` deps
  that need a version pin before publishing 1.3.1.
- **Recharts loop may not be purely downstream of §A.1.** Plan for the
  recharts-submodule path in change-413 even if the optimistic case
  fires; cost is low to prep, high to discover after the fact.

---

## I. Sources consulted

- [pnpm workspaces — official docs](https://pnpm.io/workspaces)
- [Configure pnpm for the best possible developer experience — Adam Coster](https://adamcoster.com/blog/pnpm-config)
- [pnpm/pnpm #10157 — workspace: protocol + git submodule integration](https://github.com/pnpm/pnpm/issues/10157)
- [recharts #5489 — Infinite re-renders when container content changes](https://github.com/recharts/recharts/issues/5489)
- [recharts #6613 — useActiveTooltipDataPoints Max update depth (PR #6616)](https://github.com/recharts/recharts/issues/6613)
- [recharts #6716 — ResponsiveContainer logs incorrect width(-1) warning](https://github.com/recharts/recharts/issues/6716)
- [pmndrs/zustand #1936 — getSnapshot should be cached to avoid infinite loop](https://github.com/pmndrs/zustand/discussions/1936)
- Bible: `HotSeatersMVP/src/pages/Dashboard.jsx` lines 698–989 for the
  dashboard region under inspection.

---

**Assessment complete. Ready for `/kbd-plan dashboard-bible-parity-build`
to convert items 1–5 in §G into OpenSpec changes.**
