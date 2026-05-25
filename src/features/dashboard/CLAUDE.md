# Dashboard feature — CLAUDE.md

The `/Dashboard` route is the **reference implementation** every other
feature page in the app should follow. Rebuilt under the
`dashboard-bible-parity-build` KBD phase (change-405..409). Bible:
`HotSeatersMVP/src/pages/Dashboard.jsx` (1440 LOC).

## Hard Constraints

- **RULE 1** — Self-hosted Supabase only. Local `http://localhost:8000`
  or hosted `https://hotbase.prometheusags.ai`. Never `*.supabase.co`.
- **RULE 2** — HotSeatersMVP is the bible. Copy, icons, role gating,
  color tokens, layout all come from the bible.
- **RULE 3 / RULE B / RULE F** — strict layering:
  - `pages/dashboard-page.tsx` is a thin composition shell. It reads
    the registry + the empty-state selector. **No business logic.**
  - `widgets/<name>.tsx` import only their data hook + UI primitives.
    **No `useGraphStore`, no PGlite, no supabase client, no role
    string literals.**
  - `hooks/<name>.ts` compose other hooks (e.g. `useTrialsList`,
    `useEntityView`) + pure rules from `business-rules/`. **No
    `fetch`, no PGlite reach-in.**
  - `business-rules/<name>.ts` are pure functions. Take all inputs +
    `now`; return values. **No I/O, no React.**
- **RULE K** — Multi-step work emits progress signals at every
  phase + change boundary.

## Architecture

```
pages/dashboard-page.tsx           ← thin shell; reads registry + empty selector
       │
       ▼
hooks/use-dashboard-widgets.ts     ← role-aware WidgetSpec[] registry
       │
       ▼
widgets/<name>.tsx                 ← bible-correct rendered UI
       │
       ▼
hooks/use-*.ts                     ← data hooks (Tier-A graph OR hybrid REST)
       │
       ▼
business-rules/*.ts                ← pure functions, unit-tested per bible
```

Cross-cutting:
- `useTier1()` (`src/app/tier1-provider.tsx`) → current user, company,
  role, plus 4 lookup arrays (pipelineStages, serviceCategories,
  consultantTiers, clientTypes) projected via change-405's selectors.
- `useDashboardEmpty()` → `isEmpty` predicate over Tier-A entity counts.
- `useDashboardPreferences()` → read/write `user_info.preferences`
  (RevenueTrend toggles persist).

## Folder layout

```
src/features/dashboard/
├── pages/
│   └── dashboard-page.tsx          ← thin shell (~130 LOC)
├── widgets/                        ← 17 widgets, one file each
│   ├── welcome-header.tsx
│   ├── needs-attention-banner.tsx
│   ├── kpi-tile.tsx                ← shared primitive
│   ├── kpi-revenue-ytd.tsx
│   ├── kpi-pipeline-value.tsx
│   ├── kpi-outstanding.tsx
│   ├── kpi-active-trials.tsx
│   ├── kpi-trials-ytd.tsx
│   ├── kpi-revenue-per-trial-ytd.tsx
│   ├── sales-pipeline-chart.tsx
│   ├── quick-stats-card.tsx
│   ├── recent-activity-card.tsx
│   ├── weekly-team-performance.tsx
│   ├── monthly-team-performance.tsx
│   ├── active-trial-performance.tsx
│   ├── upcoming-trials-card.tsx
│   ├── revenue-trend-card.tsx
│   ├── quick-actions-bar.tsx
│   ├── _styles.ts                  ← internal: card / header / kpi padding
│   ├── _horizontal-bar.tsx         ← internal: shared recharts wrapper
│   └── __tests__/                  ← 13 spec files
├── hooks/
│   ├── use-dashboard-widgets.ts    ← registry + role filter
│   ├── use-dashboard-empty.ts      ← isEmpty selector
│   ├── use-dashboard-preferences.ts
│   ├── use-pipeline-stages.ts      ← thin wrapper over Tier1
│   ├── use-pipeline-summary.ts
│   ├── use-upcoming-trials.ts
│   ├── use-recent-activity.ts      ← hybrid REST (invoice)
│   ├── use-active-trial-stats.ts   ← hybrid REST (time_entry)
│   ├── use-team-week.ts            ← hybrid REST
│   ├── use-team-month.ts           ← hybrid REST
│   ├── use-quick-stats.ts          ← hybrid REST (5 sources)
│   ├── use-needs-attention.ts      ← hybrid REST (lead-radar)
│   ├── use-revenue-trend.ts        ← hybrid REST + trial-projections
│   ├── use-trial-projections.ts    ← Tier-A (TrialService)
│   ├── use-quick-actions.ts
│   └── __tests__/                  ← spec per hook
├── business-rules/                 ← Phase A — landed in commit 28808a7
│   ├── revenue-aggregation.ts
│   ├── pipeline-aggregation.ts
│   ├── trial-projections.ts
│   ├── revenue-trend.ts
│   ├── team-performance.ts
│   ├── stale-leads.ts
│   ├── quick-action-policy.ts
│   └── __tests__/                  ← 70 tests covering bible parity
├── components/
│   ├── empty-dashboard.tsx         ← KEEP — onboarding splash
│   └── stub-card.tsx               ← KEEP — placeholder for future "Coming in vN"
└── CLAUDE.md                       ← this file
```

## The widget registry

`use-dashboard-widgets.ts` is the **single source of truth** for:
- Which widgets render (per role + company flag).
- Which grid slot they go into (`header | banner | kpi | main-1 |
  main-2 | main-3 | wide | footer`).
- Render order.

Adding a widget = three things:
1. New widget file in `widgets/`.
2. New data hook in `hooks/` (or reuse).
3. One row in `REGISTRY` in `use-dashboard-widgets.ts`.

**No edits to `dashboard-page.tsx`** — the shell is closed.

CI grep gate: `git grep -nE "role === '|company_role === '" src/features/dashboard/widgets/`
must return zero matches. Role gating happens in the registry's
`enabledFor` callback, not in widget JSX.

## Data tiers

| Entity | Tier | How widgets read it |
|---|---|---|
| Trial | A (synced) | `useTrialsList` → graph |
| TrialService | A (synced) | `useEntityList<TrialService>` company-scoped |
| Client, ClientAddress | A (synced) | `useClientsList` |
| MetadataType | A (synced) | `useTier1().pipelineStages` etc. (selectors) |
| user_info | A (synced) | `useCurrentUser` + `useTeam` |
| Invoice | NOT synced | Hybrid `useEntityView` → `invoices-store` REST |
| TimeEntry | NOT synced | Hybrid → `time-entries-store` REST |
| SubcontractAssignment, SubcontractRequest | NOT synced | Hybrid → `subcontracts-store` REST |
| Lead, SalesActivity, Attorney | NOT synced | Hybrid → `lead-radar-store` REST |

**When the offline-first phase later wires these into `SYNC_CONFIG`**
(via change-415's per-feature `entities.ts`), widget hooks auto-flip
from `mode: 'hybrid'` REST to local-only completeness. Zero widget
code change required. This is the principal architectural payoff of
the registry + hybrid pattern.

## Routes

- `/` → redirect to `/Dashboard`
- `/Dashboard` → `<DashboardPage />`
- `/dashboard` (lowercase) → 301 to `/Dashboard`

All roles can read; the registry decides what each role sees. Bible
role matrix:

| Widget | Owner | Admin | Sales | Trial Consultant |
|---|---|---|---|---|
| Welcome header | ✓ | ✓ | ✓ | ✓ |
| Needs Attention banner | ✓ | — | ✓ | — |
| Revenue YTD / Pipeline / Outstanding / Rev-per-Trial | ✓ | ✓ | ✓ | — |
| Active Trials / Trials YTD | ✓ | ✓ | ✓ | ✓ |
| Sales Pipeline chart | ✓ | ✓ | ✓ | — |
| Quick Stats | ✓ | ✓ | ✓ | — |
| Recent Activity | ✓ | ✓ | ✓ | ✓ |
| Weekly / Monthly Team Performance | ✓ | ✓ | ✓ | — |
| Active Trial Performance / Upcoming Trials | ✓ | ✓ | ✓ | ✓ |
| Revenue Trend | ✓ | ✓ | ✓ | — |
| Quick Actions | ✓ (5–6) | ✓ (5–6) | ✓ (5–6) | ✓ (4) |

## Mobile

`< md`: card stack, vertical scroll. KPI row collapses to 2-col.
Charts shrink with responsive containers (recharts
`ResponsiveContainer`). Touch targets ≥ 44pt on every interactive
card. The QuickActionsBar adapts: trial-consultant gets a fixed
4-col grid; everyone else gets `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.

## Acceptance gates (Definition of Done)

1. **Visual parity** — pixel-overlap ≤5% drift at 1440×900 and
   375×667 vs the bible (asserted by change-409 Playwright harness).
2. **Composition discipline** — adding a widget never touches
   `dashboard-page.tsx`. Verified by code review.
3. **No role literals in widgets** — CI grep gate clean.
4. **Hooks compose, never re-implement** — every numeric output
   flows through a `business-rules/*` function. Phase A guarantees
   bible-parity at the arithmetic layer; widgets just shape the
   rendering.
5. **Realtime** — entity update anywhere → widget re-renders within
   ~50ms (Realtime Manager 16ms coalescing + graph selector tick).
6. **Offline graceful degrade** — hybrid widgets render skeleton +
   "loading" instead of an error when REST fails.
7. **`pnpm typecheck && pnpm lint && pnpm test`** green.

## See also

- `.claude/plans/foamy-marinating-hollerith.md` — full architectural
  rationale + sequencing.
- `.kbd-orchestrator/phases/dashboard-bible-parity-build/` — phase
  ledger + plan + execution.
- `openspec/changes/change-405..409` — per-change proposals + tasks +
  spec deltas.
- `business-rules/__tests__/` — 70 tests that lock bible parity at
  the calculation layer.

Self-hosted Supabase only. HotSeatersMVP is the bible.
