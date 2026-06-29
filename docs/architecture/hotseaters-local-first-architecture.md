# Hotseaters — Local-First Architecture Fix

**Project:** `hotseaters-ultimate`
**Stack:** PGlite · ElectricSQL · Supabase Realtime · `@prometheus-ags/prometheus-entity-management` · Zustand
**Audience:** the person wiring the data layer

---

## 0. The governing principle

Hotseaters is the *clean* case: every entity lives in Supabase Postgres, scoped by `company_id`. There is no protocol bridge to build. That means the entire app can run on a **single tenant-scoped Electric adapter** plus Supabase realtime, feeding one graph that every screen reads from.

The dashboard is your pain point, and it is a textbook symptom of the core fault: a dashboard with a dozen widgets, each calling `useEntityList({ fetch })` on mount, fires a dozen parallel server requests every time you land on it — and again on every return visit. The fix is to load **all** dashboard entities once, at boot, into the graph, and make every widget a pure local reader that updates reactively when a realtime delta lands.

```
Supabase (company-scoped tables) ──Electric shapes──► PGlite ──tenant adapter──► entity graph ──hooks──► dashboard widgets
Supabase Realtime (deltas) ───────────────────────────────────────────────────► entity graph ──┘
```

The graph is the single source of truth. Ingress writes **up** into it from a layer that runs **once**. Widgets read **down**, never fetch.

---

## 1. Base strategy — what loads no matter what

### 1.1 The non-negotiable boot payload

Everything the dashboard's controls can possibly read must be synced once at boot. Because it is all one tenant's data, "load everything" is realistic — it is bounded by `company_id`.

| Entity type | Tenant column | Feeds |
|-------------|---------------|-------|
| `Company` | `id` (tenant root) | header, settings, plan limits |
| `User` / `Staff` | `company_id` | assignment owners, filters |
| `Hotseater` | `company_id` | the core people roster |
| `Schedule` / `Session` | `company_id` | calendar, timeline widgets |
| `Slot` | `company_id` | availability grid |
| `Assignment` | `company_id` | the assignment board + KPI counts |
| `Client` / `Customer` | `company_id` | client-facing widgets |
| `Location` / `Resource` | `company_id` | room/resource utilization |
| `StatusLookup` | `company_id` | every status pill and dropdown |

If a control on the dashboard reads it, it belongs in this table. The whole point is that after boot, **nothing on the dashboard touches the network**.

### 1.2 Singletons (the first fix)

Create these once at module scope. If PGlite or the RealtimeManager is recreated per route, you re-sync the world on every navigation — which is exactly the duplicate-load symptom.

```ts
// src/data/runtime.ts — imported once, lives for the app's lifetime
import { PGlite } from "@electric-sql/pglite";
import {
  configureEngine,
  getRealtimeManager,
} from "@prometheus-ags/prometheus-entity-management";

export const pglitePromise = PGlite.create("idb://hotseaters");

configureEngine({
  defaultStaleTime: 300_000,   // domain data is slow-changing; long stale time = no refetch churn
  gcInterval: 0,               // dashboard reads everything; do NOT evict the working set
});

export const realtime = getRealtimeManager();
```

> Set `gcInterval: 0` (or a long retention) here on purpose. The garbage collector evicts *unsubscribed* stale entities. On a dashboard that mounts and unmounts widgets, you do not want GC quietly dropping an entity a hidden widget will need a moment later, forcing a refetch. Keep the tenant's working set resident.

### 1.3 Register schema and relations once

Generate schemas from your SQL migrations and register relations so a changed `Assignment` cascades to the `Hotseater`, `Slot`, and `Schedule` it touches.

```ts
import {
  registerEntityFromSql,
  registerSchema,
} from "@prometheus-ags/prometheus-entity-management";

registerEntityFromSql({ entityType: "Hotseater",  createTableSql: HOTSEATER_DDL });
registerEntityFromSql({ entityType: "Assignment", createTableSql: ASSIGNMENT_DDL });
registerEntityFromSql({ entityType: "Slot",       createTableSql: SLOT_DDL });
registerEntityFromSql({ entityType: "Schedule",   createTableSql: SCHEDULE_DDL });
// ...the rest of §1.1

registerSchema({
  Assignment: {
    hotseater: { type: "Hotseater", cardinality: "one", foreignKey: "hotseaterId" },
    slot:      { type: "Slot",      cardinality: "one", foreignKey: "slotId" },
    schedule:  { type: "Schedule",  cardinality: "one", foreignKey: "scheduleId" },
  },
  Schedule: {
    slots:       { type: "Slot",       cardinality: "many", foreignKey: "scheduleId" },
    assignments: { type: "Assignment", cardinality: "many", foreignKey: "scheduleId" },
  },
});
```

### 1.4 The single boot function — one tenant adapter, all tables

The tenant-scoped Electric adapter is the right tool here: it refuses to attach a shape that lacks a `tenantColumn`, so a shape predicate can never widen past your row-level security. One adapter declares **every** table.

```ts
// src/data/boot.ts
import {
  startLocalFirstGraph,
  createPGlitePersistenceAdapter,
  createTenantScopedElectricAdapter,
  createSupabaseRealtimeAdapter,
} from "@prometheus-ags/prometheus-entity-management";
import { pglitePromise, realtime } from "./runtime";

let bootPromise: Promise<void> | null = null;
const TOTAL_TABLES = 9;
let syncedTables = 0;

export function boot(companyId: string) {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const pglite = await pglitePromise;

    // 1. Hydrate last session's graph → dashboard paints immediately on warm start.
    const storage = await createPGlitePersistenceAdapter(pglite);
    startLocalFirstGraph({ storage, key: `tenant:${companyId}:graph` });

    // 2. ONE tenant-scoped adapter, ALL tables. This is the "load everything once" core.
    createTenantScopedElectricAdapter({
      pglite,
      tenantClaim: { companyId },
      tables: [
        { type: "Company",     table: "company",     tenantColumn: null,         shapeStreamFactory: companyShape },
        { type: "User",        table: "app_user",    tenantColumn: "company_id",  shapeStreamFactory: userShape },
        { type: "Hotseater",   table: "hotseater",   tenantColumn: "company_id",  shapeStreamFactory: hotseaterShape },
        { type: "Schedule",    table: "schedule",    tenantColumn: "company_id",  shapeStreamFactory: scheduleShape },
        { type: "Slot",        table: "slot",        tenantColumn: "company_id",  shapeStreamFactory: slotShape },
        { type: "Assignment",  table: "assignment",  tenantColumn: "company_id",  shapeStreamFactory: assignmentShape },
        { type: "Client",      table: "client",      tenantColumn: "company_id",  shapeStreamFactory: clientShape },
        { type: "Location",    table: "location",    tenantColumn: "company_id",  shapeStreamFactory: locationShape },
        { type: "StatusLookup",table: "status_lookup",tenantColumn: "company_id", shapeStreamFactory: statusShape },
      ],
      onSynced: () => { syncedTables++; emitProgress(syncedTables, TOTAL_TABLES); },
    });

    // 3. Supabase realtime: low-latency deltas into the same graph nodes.
    realtime.register(createSupabaseRealtimeAdapter({ /* channel: tenant-scoped */ }));
  })();
  return bootPromise;
}
```

Call `boot(companyId)` once, right after auth resolves, above the router.

---

## 2. Special strategy — the dashboard fan-in

This is the screen that has been killing you. The cure is three rules.

### 2.1 Rule one — widgets read the graph, never the server

Every widget calls `useEntityList` / `useEntityView` / `useEntity` **without a `fetch`**. The data is already resident from boot. Landing on the dashboard becomes a series of in-memory reads — zero network, regardless of how many widgets there are.

```tsx
function AssignmentBoard() {
  const { items } = useEntityList<Assignment>({
    type: "Assignment",
    filter: useMemo(() => ({ status: { in: ["open", "in_progress"] } }), []),
    sort:   useMemo(() => ({ dueAt: "asc" }), []),
    // NO fetch — local read.
  });
  return <Board assignments={items} />;
}
```

### 2.2 Rule two — KPIs and aggregates compute locally, not from endpoints

Counts, utilization percentages, and roll-ups are the widgets that tempt you into per-widget endpoints. Don't. Compute them from the already-synced graph with `queryOnce` / `selectGraph`, or a local-completeness `useEntityView`. No new requests, and they recompute reactively when the underlying entities change.

```tsx
function UtilizationKpi() {
  // Reactive local aggregate over synced Slot entities — no network.
  const slots = useEntityList<Slot>({ type: "Slot" }).items;
  const filled = useMemo(() => slots.filter((s) => s.assignmentId != null).length, [slots]);
  const pct = slots.length ? Math.round((filled / slots.length) * 100) : 0;
  return <Kpi label="Utilization" value={`${pct}%`} />;
}
```

For heavier derivations across several entity types, use a one-shot graph query with nested includes rather than a server round-trip:

```ts
import { queryOnce } from "@prometheus-ags/prometheus-entity-management";

const schedulesWithLoad = queryOnce({
  type: "Schedule",
  include: { assignments: { type: "Assignment" }, slots: { type: "Slot" } },
});
```

### 2.3 Rule three — one update changes one node, and only its readers re-render

When a Supabase realtime delta lands on `Assignment:42`, the manager coalesces it (16ms window) and patches the single graph node. Every widget reading that assignment — the board card, the KPI count, the hotseater's row, the schedule cell — re-renders together and consistently, because they all resolve through `entities.Assignment["42"]`. You wrote zero invalidation code to make that happen. That is the whole value of the normalized graph over query-key caches, where you'd be threading `setQueryData` through a dozen widgets by hand.

For optimistic edits from the dashboard (drag an assignment to a new slot), use a graph action so the UI updates instantly and rolls back cleanly if the write fails:

```ts
import { createGraphAction } from "@prometheus-ags/prometheus-entity-management";

const reassign = createGraphAction(async ({ patch }, { assignmentId, slotId }) => {
  patch("Assignment", assignmentId, { slotId });          // optimistic, instant
  await supabase.from("assignment").update({ slot_id: slotId }).eq("id", assignmentId);
});
```

The realtime delta that follows confirms the same node; `$synced`/`$origin` metadata flips from `optimistic` to `server` without a visible flicker.

---

## 3. Stable query keys (the silent duplicate-load bug)

The dashboard is the worst offender for this. If a widget passes an **inline** filter/sort object to `useEntityList`, `serializeKey` mints a new list key on every render and every dashboard visit, defeating the cache and refetching. Every spec in §2 is wrapped in `useMemo` for this reason. Make it a lint rule for the team: no inline objects into data hooks.

---

## 4. Desktop notifications (new assignments, schedule changes)

Drive notifications off graph entry, so the toast and the in-app badge always agree.

```ts
import { createGraphEffect } from "@prometheus-ags/prometheus-entity-management";

export function startDesktopNotifications(currentUserId: string) {
  if (Notification.permission === "default") Notification.requestPermission();

  createGraphEffect(
    { type: "Assignment", filter: { assigneeId: { eq: currentUserId } } },
    {
      onEnter: (a) => {                       // a new assignment for me arrived
        if (document.visibilityState === "visible") return;
        if (Notification.permission !== "granted") return;
        new Notification("New assignment", { body: a.title, tag: a.id });
      },
      onUpdate: (a, prev) => {                // my assignment got rescheduled
        if (a.slotId !== prev.slotId && document.visibilityState !== "visible") {
          new Notification("Schedule changed", { body: a.title, tag: a.id });
        }
      },
    }
  );
}
```

Because `onEnter`/`onUpdate` fire off graph transitions (deduped by `(type,id)`), a reconnect re-sync does not re-toast assignments the user already saw.

---

## 5. Initial-load UX with progress

You have a fixed table count, so you can show a real determinate progress bar driven by the per-table `onSynced` callbacks from §1.4.

```tsx
function BootGate({ children }) {
  const status = useGraphSyncStatus();        // hydrating | syncing | ready | offline | error
  const { synced, total } = useSyncProgress(); // fed by emitProgress()

  if (status === "ready" || hasSnapshotData) return children;  // warm start skips the gate

  return (
    <Splash>
      <Step done={status !== "hydrating"}>Restoring your workspace…</Step>
      <ProgressBar value={synced} max={total} label={`Loading data (${synced}/${total})`} />
      {status === "offline" && <Note>Offline — showing your last synced data.</Note>}
    </Splash>
  );
}
```

The warm-start short-circuit matters most here: once the PGlite snapshot exists, the dashboard renders instantly from it and the Electric shapes reconcile in the background. The progress gate is only the first-ever launch.

---

## 6. The removal list (do these or the above won't help)

1. **Delete every `fetch` from dashboard widgets and all view-level hooks.** Widgets are readers. All ingress is in `boot()`.
2. **Move PGlite and the RealtimeManager to module scope.** Nothing data-related is created inside a route or remounting provider.
3. **Collapse all per-widget endpoints into the one tenant adapter.** If a widget has its own data endpoint, that data belongs in the boot tables instead.
4. **Compute KPIs from the graph** (`queryOnce` / local `useEntityView`), not from aggregate endpoints.
5. **Memoize every filter/sort spec.**
6. **Disable or lengthen GC** so the dashboard's working set stays resident and never silently refetches.

---

## 7. End-to-end data flow, after the fix

```
auth resolves → boot(companyId) [runs once]
  ├─ hydrate graph from PGlite snapshot ............ dashboard paints immediately
  ├─ one tenant Electric adapter, 9 tables → graph . everything loads ONCE
  └─ Supabase realtime → graph ..................... low-latency deltas

dashboard mount → widgets read graph via hooks (zero network)
KPI widgets → local aggregates over synced entities (zero network)
realtime delta on Assignment:42 → one node patched (16ms coalesced)
  → board card + KPI + hotseater row + schedule cell all re-render consistently
new assignment for me enters graph → badge updates + backgrounded tab gets a desktop toast
```

One boot. One tenant adapter. Everything resident. Many readers. Zero per-widget fetches.
