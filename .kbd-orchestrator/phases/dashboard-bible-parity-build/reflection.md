# Reflection — dashboard-bible-parity-build

> Phase: `dashboard-bible-parity-build`
> Reflected: 2026-05-26
> Round A (changes 405–409): completed 2026-05-25
> Round B (changes 420–424): completed 2026-05-26
> Total changes: 10

---

## Goal Achievement

| Goal | Status | Evidence |
|---|---|---|
| Bible `/Dashboard` reproduces at ≥95% pixel parity at 1440×900 | **PARTIAL** | Card chrome, welcome header, recharts fix all landed. VR baseline capture deferred (requires bible app running locally). Side-by-side manual spot-check pending. |
| Every widget owns its own data hook + loading skeleton | **MET** | 17 widgets × dedicated hook. Registry is the single source of truth. |
| No widget calls PGlite/stores directly | **MET** | ESLint boundaries enforced; all widget → hook → store layering intact. |
| Adding a widget = registry row + widget file + hook. Zero edits to `dashboard-page.tsx` | **MET** | Shell is closed. CLAUDE.md CI grep gate documents the invariant. |
| Role gating in registry only, no `role ===` in JSX | **MET** | CI grep gate clean: `git grep -nE "role === '|company_role === '" src/features/dashboard/widgets/` returns zero matches. |
| Bible business rules preserved (Phase A) | **MET** | Commit `28808a7` (prologue). 70 pure-function tests in `business-rules/__tests__/`. All 299 tests green. |
| `pnpm typecheck && pnpm test` green | **MET** | 299/299 green at close; typecheck clean. |
| E2E (Cypress/Playwright) role-permutation + offline + realtime specs | **PARTIAL** | Playwright E2E spec scaffolded (`tests/e2e/specs/dashboard-widget-registry.spec.ts`). Full Cypress role-permutation suite deferred (browser infra not available during this session). |
| Lighthouse a11y on `/Dashboard` ≥ 95 | **NOT MEASURED** | Requires running browser. Deferred. |
| Bundle size unchanged or smaller | **NOT MEASURED** | Deferred. |
| DevTools Console clean (getSnapshot, Maximum update depth, width(-1)) | **MET** (static) | change-420: memoized `useEntityList` in submodule (commit `4b46b53`). change-423: static analysis confirmed `minWidth={1}` on all `ResponsiveContainer` usages + patched fork `47d749e` suppresses the warn. No browser verification performed by agent — user must confirm once. |
| Card chrome matches bible ≤2% per-card drift | **PARTIAL** | change-421 bound Card primitive to `--theme-card-*` tokens. Per-card VR baseline capture deferred. |
| Welcome header reads `Welcome back, <FirstName>` | **MET** | change-422 commit `29cf8a0`. Spec asserts null → "User" fallback, non-empty → first name. |
| Quick Stats Team Members === bible value | **PARTIAL** | Latent `account_status` bug fixed (commit `f00d76e`). Runtime count verification requires browser (T11/T12). |
| `@prometheus-ags/prometheus-entity-management` published to npm | **PARTIAL** | 1.3.1 (commit `4b46b53` in submodule) + 2.0.0 (transport-registry redesign). npm publish deferred — user must run `pnpm publish` with npm credentials. |
| RUNBOOKS documents entity-mgmt + recharts fix loops | **MET** | `docs/RUNBOOKS.md` sections R-11, R-12, R-13 added. |

**Overall: PARTIAL — all blocking blockers resolved; 4 deferred items require a browser session or npm credentials.**

---

## Changes Delivered

### Round A (2026-05-25)

| Change | What it did | Key commits |
|---|---|---|
| change-405 | Lookup selectors + Tier1 extension — 4 new arrays (pipelineStages, serviceCategories, consultantTiers, clientTypes) projected via selectors into useTier1() | `9485621` |
| change-406 | 14 dashboard widget data hooks — Tier-A graph hooks + 8 hybrid REST hooks via useEntityView; `use-quick-stats` (5-source), `use-needs-attention` (lead-radar gated) | `228d9b8 + f4f53ca + 03f9770` |
| change-407 | 17 dashboard widget components — bible-correct rendered UI for every widget | `e3dc1f1` |
| change-408 | Dashboard page shell + widget registry — thin composition shell; `use-dashboard-widgets` registry; role gating via `enabledFor` | `f8af764` |
| change-409 | Verification — Playwright E2E spec, VR baseline scaffold, lint fixes | `b9e2b5e` |

### Round B (2026-05-25–26)

| Change | What it did | Key commits |
|---|---|---|
| change-420 | Memoized `useEntityList` return in entity-mgmt submodule — killed the `getSnapshot should be cached` React 19 infinite loop; bumped to 1.3.1; SHA bumped in superproject | `4b46b53` (submodule) + `e38d64f + 1b696f2` (superproject) |
| change-421 | Card primitive bound to bible `--theme-card-*` tokens — soft stone border + drop shadow replacing harsh near-black ring | `93c6621` |
| change-422 | Welcome header bible parity — `, {userInfo?.first_name \|\| 'User'}` fallback chain | `29cf8a0` |
| change-423 | Recharts no-op — static analysis confirmed fix already in place; all 3 chart widgets have `minWidth={1}` on ResponsiveContainer + patched fork | `68d0b43` (documentation) |
| change-424 | Team Members latent fix — `account_status` propagated to `ConsultantLike.status` (was hardcoded `'active'`); T8/T9/T10 done; T11/T12 browser-gated | `f00d76e` |

### Out-of-band during Round B execution (2.0 transport-registry redesign)

During Round B execution the user authorized a full 2.0 redesign of
`@prometheus-ags/prometheus-entity-management`:

| Step | What it did | Key commits |
|---|---|---|
| 2.0 Library | TerminalError/TransientError; EntityTransport contract; registerEntityTransport/getEntityTransport; makeRestTransport; useEntities (5-field thin hook); 1.3.2 patch (setListError fix) | submodule commits |
| App transport registration | `src/shared/db/entity-transports.ts` — 13 entity types registered at boot | `2650d91` |
| Dashboard hook migration | All 8 hybrid REST dashboard hooks migrated from inline `remoteFetch` closures to `useEntities` (transport-registry-backed) | `777b4f3` |
| EmptyDashboard killed | `empty-dashboard.tsx` + `use-dashboard-empty.ts` deleted; dashboard page always renders real grid | `cf5501b` |
| Test spec update | All 8 hook specs updated to mock `useEntities` instead of store functions; 9th (dashboard-page) spec cleaned of EmptyDashboard references | `26dfdc3` |
| SHA bump | Submodule bumped to 2.0.0; RUNBOOKS R-13 added | `1d85e97 + bc63a4c` |

---

## Artifact Quality Summary

*No artifact-refiner logs exist (`.refiner/artifacts/` directory absent). QA performed via:*

| Metric | Value |
|---|---|
| Test pass rate at close | 299/299 (100%) |
| TypeScript errors at close | 0 |
| ESLint errors at close | 0 (sync-config-rls-coherence pre-existing; not introduced by this phase) |
| Changes with formal QA gate | 0/10 (artifact-refiner not wired for this project) |

### Constraint-level quality notes

- **No role literals in widgets**: MET — CI grep gate clean throughout.
- **No business logic in dashboard-page.tsx**: MET — shell never touched after 408.
- **No I/O in business-rules/**: MET — all 70 tests pure function inputs/outputs.
- **RULE 1 (self-hosted Supabase)**: MET — no `*.supabase.co` references introduced.
- **RULE 3 (layering)**: MET — ESLint boundaries enforced; no component-to-store imports.

---

## Technical Debt Introduced

| Item | Description | Owner | Priority |
|---|---|---|---|
| npm publish pending | `@prometheus-ags/prometheus-entity-management@2.0.0` (and 1.3.1/1.3.2 series) built locally; npm registry auth was not available during this session | User | High (blocks other consumers from updating) |
| VR baselines | Per-card visual regression baselines at 1440×900 not captured (requires bible app running locally to get reference screenshots) | User | Medium |
| Browser smoke still needed | change-424 T11/T12 (Quick Stats Team Members runtime count + side-by-side) must be confirmed in a browser once `pnpm dev` is running | User | Medium |
| `makePGliteTransport` not built | Tier-A entities (Trial, Client, TeamMember, etc.) still use `useEntityList` with PGlite store calls. The 2.0 transport registry covers Tier-C (REST-only) entities. Full Tier-A migration awaits `makePGliteTransport` | Deferred to offline-first phase | Low (architecture is correct; gap is documented) |
| `useEntityQuery` thin hook | Rich hook for list-pages (Clients, Trials, DealTracker, Invoices, Approvals) with toolbar support was planned in 2.0 plan.md B.3 but deferred — these pages still use earlier patterns | Deferred to list-page migration phase | Low |
| E2E Cypress role-permutation suite | Scaffolded in change-409 but not executed against a live browser. Full role × widget × data coverage pending | Deferred | Medium |
| LEAD_RADAR_AVAILABLE | `use-needs-attention.ts` still gates on `LEAD_RADAR_AVAILABLE = false` — the flag was supposed to be removed in 2.0 (plan §B.5) but `Lead/SalesActivity/Attorney` are Tier-C REST hooks not yet wired to transports (those stores don't exist as REST endpoints yet) | Deferred to Lead Radar feature phase | Low |

---

## Lessons Captured

### L1 — Wrong-directory fix is worse than no fix

The Round A `useEntityList` memoize fix was applied to
`/Users/gqadonis/Projects/midnight/latest-data/packages/prometheus-entity-management/`
instead of the workspace submodule at
`/Users/gqadonis/Projects/midnight/hotseaters-ultimate/packages/prometheus-entity-management/`.
The app's `pnpm-workspace.yaml` pointed at the latter. The fix appeared to
land but had zero effect. Root cause: always verify which package directory
the app's `node_modules/` symlink resolves to before editing library source.

**Rule added**: Before editing a workspace package, run
`node -e "console.log(require.resolve('@your-scope/your-pkg'))"` from the
app root to confirm you're editing the right copy.

### L2 — Transport contract belongs in the library, not at call sites

14 dashboard hooks each carried their own `remoteFetch` closure, normalizer,
query key, `enabled` gate, and error strategy. The Quick Stats trap (widget
stuck on skeleton when V2 tables 404) couldn't be fixed cleanly because each
consumer reinvented the retry loop differently. The 2.0 transport registry
moves the transport contract into the library: `registerEntityTransport` once
at boot, `useEntities(type)` at every call site. A 404 now always routes to
`TerminalError` (no retry) without any consumer doing anything special.

### L3 — Static analysis can resolve runtime-gated changes

change-423 was gated on browser DevTools observation. A static read of
`ResponsiveContainer` usages (all three chart widgets already have `minWidth={1}`)
and the fork's `warn()` condition logic proved the error cannot fire. Gate
resolved without a browser. Document gates with their falsifying conditions,
not just the observation protocol.

### L4 — `ConsultantLike.status` hardcode was a latent bible-parity bug

`use-quick-stats.ts` line 144 had `status: 'active'` hardcoded in the
`ConsultantLike` map even though the upstream filter `m.account_status === 'active'`
already selected only active members. The hardcode was harmless while
`avgHoursPerActiveConsultant` only consulted the filter result, but it broke
the bible contract (`Dashboard.jsx:209` passes the `status` field through to
downstream calculations). Always propagate source fields; never substitute a
constant for a field you have.

### L5 — EmptyDashboard splash was never biblically correct

The `empty-dashboard.tsx` component was built speculatively but the bible
`Dashboard.jsx` never renders an onboarding splash — it always renders the
real grid. Per user: *"What the fuck is this view? We never want this view."*
When porting, read the bible's conditional branches end-to-end before adding
any new conditional render.

### L6 — 2.0 breaking changes are safe when you own all consumers

The user authorized the 2.0 breaking API change explicitly:
*"I own all the existing clients and this library is new and not used currently by anyone else."*
When a library has exactly one owner and zero external consumers, a clean
breaking change + immediate migration is always cheaper than a compatibility
shim that carries the old bug class forward. Document ownership clearly in
CLAUDE.md so future agents don't hesitate to break the API when the owner
authorizes it.

---

## Deferred Work (carry to next phases)

1. **`npm publish @prometheus-ags/prometheus-entity-management@2.0.0`** — user
   runs when npm credentials are available.
2. **VR baseline capture** — user runs bible app + port side-by-side at 1440×900
   and 375×667; captures reference PNGs into `tests/visual-parity/baselines/`.
3. **Browser smoke: change-424 T11/T12** — user opens `/Dashboard` and confirms
   Quick Stats Team Members count.
4. **`makePGliteTransport`** — deferred to `pglite-schema-strategy-offline-first` phase.
5. **`useEntityQuery` for list-pages** — deferred to list-page migration phase.
6. **Lead Radar restore** — remove `LEAD_RADAR_AVAILABLE = false` gate once Lead/SalesActivity/Attorney tables exist in V2.

---

## Next Phase Recommendation

**`hotseaters-page-parity-port`** (Wave W1 → public surface)

The dashboard is the reference implementation. Every other page in the app
must match the bible at the same fidelity level. The page-parity port phase
runs page by page through `HotSeatersMVP/src/pages/*`, applying the same
discipline: bible read → visual + functional audit → port → screenshot diff.

Wave W1 scope: `/` → `/Landing` → `/PrivacyPolicy` → `/TermsOfService` →
`/Pricing` → `/ReferralLanding`.

The surreal-memory task stream `hotseaters-page-parity-port` (id
`aa6fd900-f793-4ff8-aa11-abb8720bbf24`) is already initialized and waiting.
