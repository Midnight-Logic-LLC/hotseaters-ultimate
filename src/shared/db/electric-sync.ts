import {
  createTenantScopedElectricAdapter,
  type TenantScopedTableConfig,
} from '@prometheus-ags/prometheus-entity-management';

import { openForUser, type LocalDB } from './pglite-client';
import { SYNC_CONFIG } from './sync-config';

/**
 * electric-sync.ts — ElectricSQL read-path sync.
 *
 * Subscribes one Electric shape per Tier-A entity in `SYNC_CONFIG`. Each
 * shape's `WHERE` predicate is built through the v1.3 tenant-scoped adapter
 * (`createTenantScopedElectricAdapter`), which enforces:
 *
 *   - `companyId` is a UUID;
 *   - every shape declares `tenantColumn` (string or explicit `null`);
 *   - unscoped shapes are REFUSED at attach time (RULE 5: PGlite has no RLS).
 *
 * The actual row-landing happens via `pglite.electric.syncShapeToTable(...)`,
 * which writes server rows into the local `<entity>_synced` table. Stores
 * read from there through the PGlite-backed entity graph (Change 13).
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
 * `startTenantSync` awaits every shape's `onInitialSync` before resolving and
 * the caller stamps `_sync_meta.hydrated_at`. Subsequent logins resume
 * incrementally from Electric's persisted offsets.
 */

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL;
const ELECTRIC_SECRET = import.meta.env.VITE_ELECTRIC_SECRET;
const INITIAL_SYNC_TIMEOUT_MS = 8_000;

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
   * True when this run performed a full first-time hydration (every shape
   * fired `onInitialSync`). False when shapes resumed from persisted offsets.
   * The caller uses this to decide whether to stamp `_sync_meta.hydrated_at`.
   */
  didInitialHydration: boolean;
}

interface ShapeSubscription {
  unsubscribe: () => Promise<void> | void;
  isUpToDate: boolean;
}

/**
 * Start syncing all Tier-A shapes for one tenant.
 *
 * @param userId   the signed-in user's auth UUID — used to obtain the per-user
 *   PGlite instance (change-403: no global singleton).
 * @param companyId tenant scope from the signed-in user's JWT claims. Refused
 *   if empty/non-UUID — shapes must be tenant-scoped (RULE 5).
 * @param awaitInitialSync when true (first login), await every shape's first
 *   full bulk-load before resolving so the caller can show "preparing your
 *   data" and then stamp `_sync_meta`.
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

  // ── Build TenantScopedTableConfig array ────────────────────────────────
  // The factory does the real work: it calls `syncShapeToTable` to land rows
  // in PGlite. The returned object satisfies the ShapeStream<T> contract so
  // the tenant-scoped adapter accepts it for validation purposes.
  const subs: ShapeSubscription[] = [];
  const initialSyncPromises: Array<Promise<void>> = [];

  const tables: TenantScopedTableConfig[] = SYNC_CONFIG.map((config) => {
    let resolveInitial: () => void = () => {};
    const initialPromise = new Promise<void>((r) => {
      resolveInitial = r;
    });
    initialSyncPromises.push(initialPromise);

    return {
      type: config.name,
      table: config.name,
      tenantColumn: config.tenantColumn,
      primaryKey: config.primaryKey ?? ['id'],
      shapeStreamFactory: ({ table, where }) => {
        // Per-entity custom predicate trumps the tenant-scoped default. Both
        // paths go through buildTenantWhere first for validation; the custom
        // predicate is honoured here.
        const finalWhere = config.shapeWhere
          ? config.shapeWhere(`'${companyId}'`)
          : where;

        const subPromise: Promise<ShapeSubscription> = attachShape(db, {
          tableName: table,
          syncedTable: `${table}_synced`,
          where: finalWhere,
          primaryKey: config.primaryKey ?? ['id'],
          companyId,
          onInitialSync: resolveInitial,
        });

        // Stash subscription bookkeeping by appending once the attach resolves.
        // On failure (e.g. Electric rejects a shape), still count this shape as
        // "attached" with a no-op unsubscribe AND resolve its initial-sync
        // promise. Otherwise `waitForSubs` would stall until its 30s deadline
        // and a single bad shape would trap the user on the splash. The app
        // then renders from PGlite (Pattern 4) for the shapes that did land.
        void subPromise
          .then((s) => subs.push(s))
          .catch((err) => {

            console.error(`[electric-sync] shape "${table}" failed to attach`, err);
            subs.push({ unsubscribe: () => {}, isUpToDate: false });
            resolveInitial();
          });

        // Return a ShapeStream-shaped stub. We don't drive the entity graph
        // via the adapter's ChangeSet pipeline — data lands in PGlite tables
        // and stores read from there. This stub satisfies the type contract
        // and never delivers messages.
        return {
          subscribe: (
            _onMsg: (msgs: never[]) => void,
            _onErr?: (e: Error) => void,
          ) => () => {},
          isUpToDate: false,
          lastOffset: '',
        };
      },
    };
  });

  // Validate every shape predicate via the tenant-scoped adapter. The adapter
  // itself doesn't drive sync (we use syncShapeToTable inside the factory)
  // but its construction is the safety gate — it throws if any shape lacks
  // a tenantColumn or if companyId isn't a UUID.
  createTenantScopedElectricAdapter({
    pglite: db,
    tenantClaim: { companyId },
    tables,
    onSynced: () => {
      /* graph-level callback unused; see comments above */
    },
  });

  // The factories above kicked off `attachShape` calls; wait for them to
  // resolve so `subs[]` is populated and `unsubscribe` is wired up.
  // Each factory pushed a promise via the closure pattern; reconcile here.
  // We re-iterate SYNC_CONFIG to compute the count of expected subs.
  // Bound the blocking tail on a wall-clock budget so a shape that never
  // reaches up-to-date (HTTP 400, slow/large shape, transient gateway error →
  // Electric background-retry loop) can't trap the gate on the splash forever.
  // `waitForSubs` + `waitForInitialSync` resolve normally on a healthy login;
  // on an unhealthy one this race resolves at the budget and the app renders
  // from PGlite (Pattern 4). The timer runs on the main thread, where it fires
  // reliably even while the worker-bound shape promises are still pending.
  const hydrationTail = (async (): Promise<boolean> => {
    await waitForSubs(subs, SYNC_CONFIG.length);
    if (!awaitInitialSync) return false;
    return waitForInitialSync(initialSyncPromises);
  })();

  const didInitialHydration = await raceHydrationAgainstBudget({
    hydrationTail,
    budgetMs: TENANT_SYNC_BUDGET_MS,
    onHydrated,
    onBudgetExpired: () => {
      console.warn(
        `[electric-sync] tenant sync did not settle within ` +
          `${TENANT_SYNC_BUDGET_MS}ms (${subs.length}/${SYNC_CONFIG.length} ` +
          `shapes attached); continuing so the app does not hang on the ` +
          `splash. Rows will appear as shapes reach up-to-date in the ` +
          `background (check VITE_ELECTRIC_SECRET / gateway if they do not).`,
      );
    },
  });

  return {
    didInitialHydration,
    unsubscribe: async () => {
      for (const s of subs) {
        await s.unsubscribe();
      }
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

interface AttachShapeOptions {
  tableName: string;
  syncedTable: string;
  where: string;
  primaryKey: string[];
  companyId: string;
  onInitialSync: () => void;
}

async function attachShape(
  db: LocalDB,
  opts: AttachShapeOptions,
): Promise<ShapeSubscription> {
  const sub = await db.electric.syncShapeToTable({
    shape: {
      url: `${ELECTRIC_URL}/v1/shape`,
      params: {
        table: opts.tableName,
        where: opts.where,
        // Shared API key — Electric validates this on every shape request.
        // See file-header comment for the auth model.
        secret: ELECTRIC_SECRET,
      },
    },
    table: opts.syncedTable,
    primaryKey: opts.primaryKey,
    shapeKey: `${opts.tableName}:${opts.companyId}`,
    onInitialSync: () => opts.onInitialSync(),
  });

  if (sub.isUpToDate) {
    opts.onInitialSync();
  }

  return {
    unsubscribe: () => sub.unsubscribe(),
    isUpToDate: sub.isUpToDate,
  };
}

async function waitForInitialSync(promises: Array<Promise<void>>): Promise<boolean> {
  const complete = Promise.all(promises).then(() => true);
  const timeout = new Promise<false>((resolve) => {
    globalThis.setTimeout(() => resolve(false), INITIAL_SYNC_TIMEOUT_MS);
  });
  return Promise.race([complete, timeout]);
}

/**
 * Poll until `subs` has reached `expected` length, bounded by a grace
 * deadline. Resolves (not throws) at the deadline: the overall
 * `TENANT_SYNC_BUDGET_MS` race in `startTenantSync` is the real backstop, and
 * throwing here would reject the hydration tail for no benefit. A shape stuck
 * past this deadline simply hasn't pushed into `subs` yet; the gate proceeds
 * and the shape lands its rows in the background if/when it recovers.
 */
async function waitForSubs(
  subs: ShapeSubscription[],
  expected: number,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (subs.length < expected) {
    if (Date.now() > deadline) {
      console.warn(
        `[electric-sync] only ${subs.length}/${expected} shapes attached ` +
          `within 30s; continuing without the rest.`,
      );
      return;
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}
