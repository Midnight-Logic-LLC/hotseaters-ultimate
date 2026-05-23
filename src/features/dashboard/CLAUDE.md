# Dashboard feature — CLAUDE.md

Change 8 of the `hotseaters-pglite-port` phase. Read-only aggregate surface
that lives on top of the Tier-A entity graph populated by the clients/trials
features (Changes 5–7).

## Hard Constraints (links to `latest-data/.kbd-orchestrator/constraints.md`)

- **RULE 1 — Self-hosted Supabase only.** No `*.supabase.co` URLs. Local dev
  goes through the docker-compose stack at `http://localhost:8000`; hosted is
  `https://hotbase.prometheusags.ai`.
- **RULE 2 — HotSeatersMVP is the BIBLE.** Card order, copy, icons, and roles
  follow `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Dashboard.jsx`.
  When MVP and the Next.js port disagree, **MVP wins**.
- **RULE 3 — Architectural invariants.**
  1. Components in `pages/` and `components/` import only `hooks/*` (and
     UI primitives from `@/components/ui/*`).
  2. Hooks read from the entity-graph store (`useGraphStore` from
     `@prometheus-ags/prometheus-entity-management`) and from the Tier1
     context. No `fetch`, no Supabase, no PGlite.
  3. No CRUD. Mutations happen in the destination feature pages.

## Architecture

```
pages/DashboardPage.tsx
   ↓ uses
hooks/use-dashboard-stats.ts        — composite (active trials, clients...)
hooks/use-recent-trials.ts          — recent 5
hooks/use-recent-clients.ts         — recent 5
hooks/use-dashboard-card-data.ts    — per-card derived selectors
   ↓ read from
useGraphStore (read-only) + useTier1() (current company/role)
```

The entity-graph is fed by the clients/trials stores (Changes 5–7). The
dashboard is **purely a consumer** — when an entity changes anywhere in the
app, the graph fires and the dashboard re-renders. No fetch logic here.

## v0.1 portability scope

The legacy `Dashboard.jsx` displays cards backed by entities not yet synced
in v0.1 (`SYNC_CONFIG` in `src/shared/db/sync-config.ts`):

| MVP card | Backing entity | v0.1 status |
|---|---|---|
| Revenue YTD | `invoice` | Tier C — **stub: "Coming in v0.2"** |
| Pipeline Value | `trial` + `metadata_type[pipeline]` | ✅ ported |
| Outstanding Invoices | `invoice` | Tier C — **stub** |
| Active Trials | `trial` | ✅ ported |
| Trials YTD | `trial.won_date` | ✅ ported |
| Revenue/Trial YTD | `invoice` | Tier C — **stub** |
| Active Clients | `client` | ✅ ported |
| Team Members | `user_info` | ✅ ported |
| Recent Wins | `trial.won_date` | ✅ ported |
| Recent Invoices | `invoice` | Tier C — **stub** |
| Team Performance (weekly/monthly hours) | `time_entry` | Tier C — **stub** |
| HSH Posts / Gigs | `subcontract_*` | Tier C — **stub** |
| Sales Pipeline chart | `trial` + `metadata_type` | ✅ ported |
| Time by Category | `time_entry` + `metadata_type` | Tier C — **stub** |

The "stub" cards render the MVP layout with a "Coming in v0.2" footnote so
that visual parity is recognisable. When the missing entities sync (Tier-B
expansion or a v0.2 Tier-A addition) the cards activate without layout drift.

## Files

```
hooks/
  use-dashboard-stats.ts          composite stats; render-stable
  use-recent-trials.ts            top-5 trials by updated_at desc
  use-recent-clients.ts           top-5 clients by updated_at desc
  use-dashboard-card-data.ts      per-card derived selectors
pages/
  DashboardPage.tsx               route entry; ports MVP layout
components/
  StatCard.tsx                    icon + value + delta tile
  RecentTrialsCard.tsx
  RecentClientsCard.tsx
  QuickActionsCard.tsx            CTAs → /Clients, /Trials
  EmptyDashboard.tsx              empty state for freshly-onboarded company
  PipelineCard.tsx                Sales Pipeline by stage
  RecentActivityCard.tsx          Recent Wins + (stubbed) Recent Invoices
  QuickStatsCard.tsx              compact list of secondary stats
  StubCard.tsx                    "Coming in v0.2" placeholder
```

## Mobile

`< md`: card stack, vertical scroll. Charts (PipelineCard) hide on small
viewports — replaced with the same data rendered as compact list rows.
Touch targets ≥ 44pt on every interactive card.

## Routes

- `/` → redirect to `/Dashboard`
- `/Dashboard` → `<DashboardPage />`

All roles (`owner`, `admin`, `sales`, `trial_consultant`) can read. The
internal cards respect role gating from the MVP (trial_consultant sees a
narrower subset). Role logic lives in the hooks, not in components.

## Acceptance gates

1. Empty company → `EmptyDashboard` renders with "create your first client / trial" CTAs.
2. Populated graph → cards reflect entity counts; updating a client elsewhere
   updates the Active Clients count without a manual refresh.
3. Mobile viewport: card stack, no horizontal scroll, all CTAs ≥ 44pt.
4. No imports outside the allowed boundary (eslint-plugin-boundaries).

Self-hosted Supabase only. HotSeatersMVP is the bible.
