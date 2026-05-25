# change-406 — Dashboard widget data hooks

## Why
Phase A delivered the **calculations**; Phase B (change-405) delivers
the **lookup data**. This change wires them together as **per-widget
hooks** — each widget owns its own subscription, instead of the
monolithic `useDashboardAggregates` that runs raw SQL across 12 tables
on every graph-version change.

Per-widget hooks unlock four properties:
1. Realtime — `useEntityList` / `useEntityView` re-render on coalesced
   graph writes (Realtime Manager 16ms window).
2. Per-widget loading state — each hook reports its own `isLoading`,
   `isShowingLocalPending`, so the dashboard never blocks on its
   slowest widget.
3. Offline-first compatibility — hybrid mode of `useEntityView`
   transparently falls back to REST for entities not yet synced, then
   auto-promotes when offline-first phase adds them to `SYNC_CONFIG`.
4. Composability — each hook is independently testable with a seeded
   graph fixture.

## What changes
14 new hooks in `src/features/dashboard/hooks/`, each composing the
Phase A business rules via `useEntityList` or `useEntityView`:

| Hook | Composes | Reads (entity types) |
|---|---|---|
| `use-pipeline-stages.ts` | (passthrough to Tier1) | `EntityMetadata`+`MetadataType` |
| `use-pipeline-summary.ts` | `dealsByStage`, `computePipelineValue` | `Trial` + `pipelineStages` |
| `use-upcoming-trials.ts` | `upcomingTrialsFrom` | `Trial` (op-stage filter) + `Client` |
| `use-recent-activity.ts` | (recent wins + recent invoices select) | `Trial` (won) + `Invoice` |
| `use-active-trial-stats.ts` | `computeActiveTrialStats` | `Trial` + `TimeEntry` + `Client` |
| `use-team-week.ts` | `filterTimeEntriesInWindow`, `aggregateTeamStats` | `TimeEntry` + `UserInfo` + `SubcontractAssignment` |
| `use-team-month.ts` | same, monthly window | same |
| `use-quick-stats.ts` | (7 secondary counters per bible 926–989) | many — uses graph counts only |
| `use-revenue-trend.ts` | `monthlyTrend`/`weeklyTrend`/`toCumulative`/`attachTrend`/`revenueGoalForPeriod` | `Invoice` + `TrialService` + `Company` |
| `use-trial-projections.ts` | `enrichTasksWithDailyRevenue`, `buildProjectedInvoiceMap` | `TrialService` + `Trial` + `pipelineStages` + `services` |
| `use-needs-attention.ts` | `computeStaleLeadCounts` | `Lead` + `SalesActivity` + `Attorney` + `Client` |
| `use-dashboard-preferences.ts` | (read + `useEntityMutation` patch) | `UserInfo` |
| `use-quick-actions.ts` | `quickActionsFor` + route resolver | `(tier1 only)` |
| `use-dashboard-widgets.ts` | (role-aware widget registry filter) | `(tier1 only)` — added in change-408 |

Entities not yet in `SYNC_CONFIG` (Invoice, TimeEntry,
SubcontractAssignment, SubcontractRequest, Lead, SalesActivity,
Attorney) use `useEntityView` with `mode: 'hybrid'` + a Supabase REST
`remoteFetch`. When the offline-first phase later adds these to sync,
no code in these hooks changes.

Each hook ships with a `__tests__/<name>.spec.ts` that seeds a fixture
graph store + injects a deterministic `now`, asserts the hook output
for a known role + fixture set.

## Out of scope
- Wiring entities into `SYNC_CONFIG` (offline-first change-415).
- Pending-Sync chip integration (offline-first change-414).
- The widget components themselves (change-407).
- `use-dashboard-widgets.ts` registry (lives in change-408 alongside
  the page rewrite).

## Tasks → see `tasks.md`.
