/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { vector } from '@electric-sql/pglite/vector';
import { electricSync } from '@electric-sql/pglite-sync';
import { worker } from '@electric-sql/pglite/worker';
import type { PGliteWorkerOptions } from '@electric-sql/pglite/worker';

/**
 * PGlite Web Worker entry for hotseaters-ultimate.
 *
 * Runs the WASM Postgres engine, the `live` query extension, and the
 * ElectricSQL read-path sync OFF the main thread. `@electric-sql/pglite/worker`
 * elects ONE leader tab to own this worker; other tabs proxy queries to the
 * leader, so every tab shares a single consistent database and only one
 * Electric subscription set runs per browser.
 *
 * The main thread never imports this file directly — it spins it up as a
 * module Worker (see `pglite-client.ts`) and talks to it through `PGliteWorker`.
 *
 * Per-user IDB path: `pglite-client.ts` passes `dataDir` via `PGliteWorker.create`
 * options so each user gets a fully isolated IndexedDB database
 * (`idb://hotseaters/${userId}`). The worker's `init` function receives those
 * options and forwards them to `PGlite.create`.
 *
 * NOTE (change-403): `local-schema.sql` is DEPRECATED. Schema is now applied
 * idempotently by `pglite-client.ts` AFTER the worker boots:
 *   - `local-schema-common.sql` — reference / system tables
 *   - `local-schema-user.sql`   — tenanted tables per user
 */
worker({
  async init(options: Omit<PGliteWorkerOptions, 'extensions'>) {
    const db = await PGlite.create({
      ...options,
      // Fall back to a shared name if no dataDir is provided (dev / tests).
      dataDir: options.dataDir ?? 'idb://hotseaters-ultimate',
      extensions: { live, vector, electric: electricSync() },
    });
    return db;
  },
});
