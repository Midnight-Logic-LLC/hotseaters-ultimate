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
 * Load-once-on-login: the first login for a tenant runs full hydration —
 * `startTenantSync` awaits every shape's `onInitialSync` before resolving and
 * the caller stamps `_sync_meta.hydrated_at`. Subsequent logins resume
 * incrementally from Electric's persisted offsets.
 */

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL;

if (!ELECTRIC_URL) {
  throw new Error(
    'Missing VITE_ELECTRIC_URL — set it to the local docker-compose Electric ' +
      '(http://localhost:3133) or the self-hosted endpoint ' +
      'https://electricsql.prometheusags.ai (RULE 1).',
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
 */
export async function startTenantSync(
  userId: string,
  companyId: string,
  awaitInitialSync: boolean,
): Promise<TenantSyncResult> {
  if (!userId) {
    throw new Error(
      'startTenantSync requires a userId (change-403: per-user PGlite isolation).',
    );
  }
  if (!companyId) {
    throw new Error(
      'startTenantSync requires a companyId — shapes must be tenant-scoped (RULE 5).',
    );
  }

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
        void subPromise.then((s) => subs.push(s));

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
  await waitForSubs(subs, SYNC_CONFIG.length);

  let didInitialHydration = false;
  if (awaitInitialSync) {
    await Promise.all(initialSyncPromises);
    didInitialHydration = true;
  }

  return {
    didInitialHydration,
    unsubscribe: async () => {
      for (const s of subs) {
        await s.unsubscribe();
      }
    },
  };
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

/** Poll until `subs` has reached `expected` length. */
async function waitForSubs(
  subs: ShapeSubscription[],
  expected: number,
): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (subs.length < expected) {
    if (Date.now() > deadline) {
      throw new Error(
        `electric-sync: only ${subs.length}/${expected} shapes attached within 30s`,
      );
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}
