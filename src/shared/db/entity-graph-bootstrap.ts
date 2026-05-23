import {
  createPGlitePersistenceAdapter,
  startLocalFirstGraph,
  type LocalFirstGraphRuntime,
} from '@prometheus-ags/prometheus-entity-management';

import type { LocalDB } from './pglite-client';

/**
 * entity-graph-bootstrap.ts — wires the prometheus-entity-management
 * local-first runtime to PGlite, scoped per-tenant.
 *
 * **This is the SINGLE place the entity graph is bootstrapped** (plan §0.2
 * invariant 4 / RULE 3 invariant 4). Anything else calling
 * `startLocalFirstGraph` is a bug.
 *
 * Inputs:
 *   - The shared PGlite handle (`getLocalDB()` result)
 *   - The signed-in tenant's `companyId` — used as the persistence key so a
 *     tenant switch produces an independent snapshot stream.
 *   - `isFirstLogin` — diagnostic flag, surfaced to the sync gate.
 *
 * Persistence:
 *   The v1.3 `createPGlitePersistenceAdapter` lands the graph snapshot in a
 *   `_graph_snapshot` PGlite table — one storage surface to back up, clear,
 *   and reason about (rather than mixing in localStorage / IndexedDB).
 *
 * Retry policy:
 *   `startLocalFirstGraph` is configured with bounded exponential backoff
 *   for offline action replay (Change 13.6). After 5 attempts an action is
 *   considered poisoned and is logged via `poisonHandler`.
 *
 * Online source:
 *   Standard `navigator.onLine` + the `online` / `offline` window events. The
 *   runtime persists offline writes and replays on reconnect.
 */

export interface BootstrapEntityGraphOptions {
  pglite: LocalDB;
  companyId: string;
  isFirstLogin: boolean;
}

export interface EntityGraphHandle {
  runtime: LocalFirstGraphRuntime;
  /** Storage key under which the graph snapshot is persisted. */
  storageKey: string;
  /** Tear down the runtime and discard persisted state. */
  dispose: () => void;
}

export async function bootstrapEntityGraph(
  opts: BootstrapEntityGraphOptions,
): Promise<EntityGraphHandle> {
  const { pglite, companyId } = opts;
  const storageKey = `tenant:${companyId}`;

  const storage = await createPGlitePersistenceAdapter(pglite);

  const runtime = startLocalFirstGraph({
    storage,
    key: storageKey,
    replayPendingActions: true,
    onlineSource: {
      getIsOnline: () =>
        typeof navigator === 'undefined' ? true : navigator.onLine,
      subscribe: (listener) => {
        const on = () => listener(true);
        const off = () => listener(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
          window.removeEventListener('online', on);
          window.removeEventListener('offline', off);
        };
      },
    },
    retryPolicy: {
      maxAttempts: 5,
      initialDelayMs: 500,
      maxDelayMs: 30_000,
      backoffFactor: 2,
      jitter: 'equal',
      poisonHandler: (action, err) => {
        // Surface poison events at app level. Stores can also wire UI toasts
        // by subscribing to `useGraphSyncStatus`.
        // eslint-disable-next-line no-console
        console.error('[entity-graph] poisoned action:', action, err);
      },
    },
  });

  return {
    runtime,
    storageKey,
    dispose: () => {
      runtime.dispose();
    },
  };
}
