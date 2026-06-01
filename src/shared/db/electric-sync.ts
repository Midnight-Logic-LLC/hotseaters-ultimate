import type { ShapeToTableOptions } from '@electric-sql/pglite-sync';
import {
  createTenantScopedElectricAdapter,
  type TenantScopedTableConfig,
} from '@prometheus-ags/prometheus-entity-management';

import { openForUser } from './pglite-client';
import { SYNC_CONFIG } from './sync-config';

/**
 * electric-sync.ts — ElectricSQL read-path sync.
 *
 * Syncs ALL Tier-A entities in `SYNC_CONFIG` through a SINGLE transactional
 * `pglite.electric.syncShapesToTables(...)` subscription (change-S01). Every
 * shape's `WHERE` predicate is still validated through the v1.3 tenant-scoped
 * adapter (`createTenantScopedElectricAdapter`), which enforces:
 *
 *   - `companyId` is a UUID;
 *   - every shape declares `tenantColumn` (string or explicit `null`);
 *   - unscoped shapes are REFUSED at build time (RULE 5: PGlite has no RLS).
 *
 * Why one multi-table call instead of a per-entity `syncShapeToTable` loop:
 *   - **Transactional consistency** — a server transaction that touches
 *     several tables lands atomically in PGlite (`syncShapesToTables` wraps the
 *     apply in one PGlite transaction). The old loop could land a half-applied
 *     cross-table update mid-render.
 *   - **One initial-sync signal** — the whole set fires a single
 *     `onInitialSync`, so the boot gate flips "synced" once instead of racing N
 *     independent per-shape promises (the source of the historic
 *     hydration-race the gate had to defend against).
 *
 * Rows land into each entity's local `<entity>_synced` table; stores read from
 * the unified view via `useLiveQuery` (Pattern 4 — "through the database").
 *
 * Self-hosted Supabase only. The module refuses to load against any URL
 * matching `*.supabase.co` (RULE 1).
 *
 * Routing + auth: the browser hits `${VITE_ELECTRIC_URL}/v1/shape` which is
 * the Envoy gateway (same host:port as `VITE_SUPABASE_URL`). Envoy forwards
 * to the Electric upstream. Auth is a shared API key in the query string —
 * `?secret=$VITE_ELECTRIC_SECRET` — that Electric validates on every shape
 * request. Tenant scope is enforced separately by Postgres RLS, independent
 * of the secret. See docs/RUNBOOKS.md "Electric routing in dev + prod".
 *
 * Load-once-on-login: the first login for a tenant runs full hydration —
 * `startTenantSync` awaits the single `onInitialSync` before resolving and the
 * caller stamps `_sync_meta.hydrated_at`. Subsequent logins resume
 * incrementally from Electric's persisted offsets (keyed by `SYNC_KEY`).
 */

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL;
const ELECTRIC_SECRET = import.meta.env.VITE_ELECTRIC_SECRET;

/**
 * Resumable subscription key for the single multi-table sync. Electric
 * persists per-shape offsets under this key so a returning login resumes
 * incrementally instead of re-bulk-loading. Scoped per tenant so a different
 * company on a shared device never resumes another tenant's offsets.
 */
const syncKeyForTenant = (companyId: string): string => `tenant:${companyId}`;

/**
 * Overall wall-clock budget for `startTenantSync`'s blocking tail
 * (`waitForSubs` + `waitForInitialSync`).
 *
 * Root cause of the post-login "Preparing your data…" infinite splash:
 * `attachShape` does `await db.electric.syncShapeToTable(...)`, whose promise
 * resolves ONLY when the shape reaches its first up-to-date message. When a
 * shape never reaches up-to-date — a gateway 400 (e.g. an Electric secret
 * mismatch), a slow/large shape, or a transient upstream error that drops
 * Electric into its background-retry loop — that `await` NEVER settles. The
 * per-shape `subPromise` then never settles, so neither its `.then` (push to
 * `subs`) nor its `.catch` (resolve the initial-sync promise) runs; `subs`
 * never fills; `waitForSubs` spins; `waitForInitialSync` is never reached.
 * `sync-gate.tsx` is left awaiting `startTenantSync` forever → the gate never
 * reaches `ready` → the splash never clears (Dashboard, Clients, and Trials
 * all stay on "Preparing your data…").
 *
 * Bounding the whole tail on the MAIN thread (where `setTimeout` fires
 * reliably even while the worker-bound shape promises are pending) guarantees
 * the gate advances within the budget. Shapes that recover later still land
 * their rows via Electric's background retry and `useLiveQuery` picks them up
 * with no extra wiring (Pattern 4 — "through the database").
 */
const TENANT_SYNC_BUDGET_MS = 12_000;

if (!ELECTRIC_URL) {
  throw new Error(
    'Missing VITE_ELECTRIC_URL — set it to the local docker-compose Envoy ' +
      '(http://localhost:8000) or the self-hosted endpoint ' +
      'https://hotbase.prometheusags.ai (RULE 1).',
  );
}

if (!ELECTRIC_SECRET) {
  throw new Error(
    'Missing VITE_ELECTRIC_SECRET — must match ELECTRIC_SECRET in ' +
      'latest-data/.env. The browser sends it as ?secret=… on every ' +
      'shape request; Postgres RLS still enforces per-tenant scope.',
  );
}

// RULE 1 — never Supabase Cloud (Electric should never be that URL either).
if (/\.supabase\.co(\/|$)/i.test(ELECTRIC_URL)) {
  throw new Error(
    `Refusing VITE_ELECTRIC_URL "${ELECTRIC_URL}". Self-hosted only (RULE 1).`,
  );
}

export interface ShapeSyncHandle {
  /** Stop all shape subscriptions. */
  unsubscribe: () => Promise<void>;
}

/**
 * Matches a canonical (lower- or upper-case) UUID — the shape of `company_id`.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pure predicate: is `companyId` a non-empty UUID, safe to interpolate into a
 * tenant-scoped Electric shape `where` clause?
 *
 * Rejects `undefined`, `null`, the empty string, and the literal `"undefined"`
 * that a coerced JS `undefined` produces — the exact value behind the
 * production `company_id = 'undefined'` 400 that hung the SyncGate splash.
 */
export function isValidCompanyId(
  companyId: string | null | undefined,
): companyId is string {
  return typeof companyId === 'string' && UUID_RE.test(companyId);
}

/**
 * Guard tenant-scoped shape construction: `companyId` MUST be a non-empty UUID
 * before it is interpolated into any Electric shape `where` clause.
 *
 * Without this, a JS `undefined` companyId produced the malformed predicate
 * `company_id = 'undefined'`, which Electric rejects with HTTP 400. That
 * shape's `onInitialSync` never fired, so `waitForInitialSync()`'s
 * `Promise.all(...)` never resolved and SyncGate hung forever on "Preparing
 * your data…". Throwing here surfaces the real cause loudly instead of
 * emitting a poisoned shape (RULE 5: shapes must be tenant-scoped).
 */
function assertValidCompanyId(companyId: string): void {
  if (!isValidCompanyId(companyId)) {
    throw new Error(
      'startTenantSync: refusing to build tenant-scoped Electric shapes — ' +
        `companyId is not a valid UUID (received ${JSON.stringify(companyId)}). ` +
        'This usually means the Supabase JWT lacks app_metadata.company_id.',
    );
  }
}

export interface TenantSyncResult extends ShapeSyncHandle {
  /**
   * True when this run performed a full first-time hydration (the multi-table
   * sync fired its single `onInitialSync`). False when the sync resumed from
   * persisted offsets. The caller uses this to decide whether to stamp
   * `_sync_meta.hydrated_at`.
   */
  didInitialHydration: boolean;
}

/**
 * Start syncing all Tier-A shapes for one tenant via a single transactional
 * multi-table subscription.
 *
 * @param userId   the signed-in user's auth UUID — used to obtain the per-user
 *   PGlite instance (change-403: no global singleton).
 * @param companyId tenant scope from the signed-in user's JWT claims. Refused
 *   if empty/non-UUID — shapes must be tenant-scoped (RULE 5).
 * @param awaitInitialSync when true (first login), await the multi-table sync's
 *   single full bulk-load before resolving so the caller can show "preparing
 *   your data" and then stamp `_sync_meta`.
 * @param onHydrated called EXACTLY ONCE when the genuine initial hydration
 *   completes (every Tier-A shape reached up-to-date). This fires even when it
 *   happens AFTER `TENANT_SYNC_BUDGET_MS` — i.e. after the budget already
 *   unblocked the UI by resolving the return value with `didInitialHydration:
 *   false`. The caller wires this to `markHydrated` so a slow-but-successful
 *   first login (observed 12–20s) still stamps `_sync_meta.hydrated_at` and the
 *   NEXT login resumes incrementally instead of re-hydrating everything. Only
 *   invoked on a first-login run (`awaitInitialSync === true`); never on a
 *   resume run.
 */
export async function startTenantSync(
  userId: string,
  companyId: string,
  awaitInitialSync: boolean,
  onHydrated?: () => void | Promise<void>,
): Promise<TenantSyncResult> {
  if (!userId) {
    throw new Error(
      'startTenantSync requires a userId (change-403: per-user PGlite isolation).',
    );
  }
  // Validate the tenant scope BEFORE any shape is built. Rejects null/empty
  // AND non-UUID values (e.g. the coerced literal "undefined") so the
  // where-builder below can never emit `company_id = 'undefined'` (RULE 5).
  assertValidCompanyId(companyId);

  const { db } = await openForUser(userId);

  // ── Validate every shape predicate via the tenant-scoped adapter ────────
  // The adapter does not drive the sync (the single `syncShapesToTables` call
  // below does). Its construction is the safety gate (RULE 5): it throws if any
  // shape lacks a `tenantColumn` or if `companyId` isn't a UUID, and it returns
  // the validated tenant `where` predicate per table. The `shapeStreamFactory`
  // is invoked purely to surface each table's validated `where` to us; it
  // returns an inert stub (no rows ever flow through this path).
  const tenantWhereByTable = new Map<string, string>();

  const tables: TenantScopedTableConfig[] = SYNC_CONFIG.map((config) => ({
    type: config.name,
    table: config.name,
    tenantColumn: config.tenantColumn,
    primaryKey: config.primaryKey ?? ['id'],
    shapeStreamFactory: ({ table, where }) => {
      // Per-entity custom predicate trumps the tenant-scoped default; both go
      // through the adapter's validation first, the custom predicate is
      // honoured for the actual shape `where` (e.g. metadata_type's
      // "(company_id = … OR company_id IS NULL)").
      const finalWhere = config.shapeWhere
        ? config.shapeWhere(`'${companyId}'`)
        : where;
      tenantWhereByTable.set(table, finalWhere);
      return {
        subscribe: () => () => {},
        isUpToDate: false,
        lastOffset: '',
      };
    },
  }));

  createTenantScopedElectricAdapter({
    pglite: db,
    tenantClaim: { companyId },
    tables,
    onSynced: () => {
      /* graph-level callback unused; sync is driven by syncShapesToTables */
    },
  });

  // ── Single transactional multi-table sync ───────────────────────────────
  // One subscription lands ALL Tier-A shapes with cross-table transactional
  // consistency and fires ONE `onInitialSync` when the whole set is up to date.
  const shapes: Record<string, ShapeToTableOptions> = {};
  for (const config of SYNC_CONFIG) {
    const where = tenantWhereByTable.get(config.name);
    if (where === undefined) {
      // The adapter rejected/skipped this table — fail loud rather than sync an
      // unscoped shape (RULE 5).
      throw new Error(
        `[electric-sync] no validated tenant predicate for "${config.name}". ` +
          'The tenant-scoped adapter did not produce a where clause — refusing ' +
          'to sync an unscoped shape (RULE 5: PGlite has no RLS).',
      );
    }
    shapes[config.name] = {
      shape: {
        url: `${ELECTRIC_URL}/v1/shape`,
        params: {
          table: config.name,
          where,
          // Shared API key — Electric validates this on every shape request.
          // See file-header comment for the auth model.
          secret: ELECTRIC_SECRET,
        },
      },
      table: `${config.name}_synced`,
      primaryKey: config.primaryKey ?? ['id'],
    };
  }

  let resolveInitial: () => void = () => {};
  const initialSyncPromise = new Promise<void>((r) => {
    resolveInitial = r;
  });

  // `syncShapesToTables` resolves once the subscription is established; the
  // bulk load completes when `onInitialSync` fires (or `isUpToDate` is already
  // true on a warm resume). If establishment REJECTS (e.g. Electric rejects a
  // shape predicate with HTTP 400), degrade gracefully: log, resolve the
  // initial-sync promise, and hand back a no-op unsubscribe. The boot gate then
  // proceeds (no infinite splash) and renders from whatever PGlite already
  // holds (Pattern 4) — mirroring the old per-shape `.catch` behaviour, now at
  // the single-subscription granularity.
  let unsubscribe: () => void = () => {};
  try {
    const sync = await db.electric.syncShapesToTables({
      key: syncKeyForTenant(companyId),
      shapes,
      onInitialSync: () => resolveInitial(),
    });
    unsubscribe = () => sync.unsubscribe();
    if (sync.isUpToDate) resolveInitial();
  } catch (err) {
    console.error('[electric-sync] multi-table sync failed to establish', err);
    resolveInitial();
  }

  // Bound the blocking tail on a wall-clock budget so a sync that never reaches
  // up-to-date (HTTP 400, slow/large shapes, transient gateway error → Electric
  // background-retry loop) can't trap the boot gate on the splash forever. On a
  // healthy first login the tail resolves on `onInitialSync`; on an unhealthy
  // one the race resolves at the budget and the app renders from whatever has
  // landed so far in PGlite (Pattern 4). The timer runs on the main thread,
  // where it fires reliably even while the worker-bound sync promise is pending.
  const hydrationTail = (async (): Promise<boolean> => {
    if (!awaitInitialSync) return false;
    await initialSyncPromise;
    return true;
  })();

  const didInitialHydration = await raceHydrationAgainstBudget({
    hydrationTail,
    budgetMs: TENANT_SYNC_BUDGET_MS,
    onHydrated,
    onBudgetExpired: () => {
      console.warn(
        `[electric-sync] tenant sync did not reach up-to-date within ` +
          `${TENANT_SYNC_BUDGET_MS}ms; continuing so the app does not hang on ` +
          `the splash. Rows will appear as the sync reaches up-to-date in the ` +
          `background (check VITE_ELECTRIC_SECRET / gateway if they do not).`,
      );
    },
  });

  return {
    didInitialHydration,
    unsubscribe: async () => {
      unsubscribe();
    },
  };
}

/**
 * Race a hydration tail against a wall-clock budget, decoupling "unblock the
 * UI" from "record that hydration finished".
 *
 * This is the fix for the re-hydrate-on-every-login regression. The returned
 * promise resolves as soon as EITHER the tail settles OR the budget expires —
 * whichever is first — so the caller (sync-gate) can clear the splash within
 * the budget even when first-login hydration of all Tier-A shapes takes longer
 * than `budgetMs` (observed 12–20s). The return value is the tail's boolean if
 * it won, or `false` if the budget won.
 *
 * Critically, `onHydrated` is wired to the tail INDEPENDENTLY of the race: it
 * fires exactly once if and when the tail resolves `true`, EVEN IF that happens
 * after the budget already resolved the returned promise `false`. That late
 * call is what lets a slow-but-successful first login still stamp
 * `_sync_meta.hydrated_at`, so the NEXT login resumes incrementally instead of
 * re-hydrating everything. A resume run's tail resolves `false`, so
 * `onHydrated` does not fire then.
 *
 * Pure + dependency-injected (timer/callbacks) so it is unit-testable with fake
 * timers and without PGlite or Electric.
 */
export function raceHydrationAgainstBudget(opts: {
  hydrationTail: Promise<boolean>;
  budgetMs: number;
  // Explicit `| undefined` (not just `?`) for exactOptionalPropertyTypes: the
  // caller forwards `startTenantSync`'s optional `onHydrated`, which is
  // `(() => …) | undefined`, into this field.
  onHydrated?: (() => void | Promise<void>) | undefined;
  onBudgetExpired?: (() => void) | undefined;
}): Promise<boolean> {
  const { hydrationTail, budgetMs, onHydrated, onBudgetExpired } = opts;

  // Fire onHydrated when the GENUINE tail resolves true — independent of the
  // race below, so it still runs after a budget timeout. Swallow late
  // rejections (tail or onHydrated) so they don't surface as unhandled once we
  // stop awaiting the tail directly.
  void hydrationTail
    .then((done) => (done ? onHydrated?.() : undefined))
    .catch(() => {});

  const budget = new Promise<boolean>((resolve) => {
    globalThis.setTimeout(() => {
      onBudgetExpired?.();
      resolve(false);
    }, budgetMs);
  });

  return Promise.race([hydrationTail, budget]);
}
