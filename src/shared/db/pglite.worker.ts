/// <reference lib="webworker" />
import { PGlite } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { electricSync } from '@electric-sql/pglite-sync';
import { worker } from '@electric-sql/pglite/worker';
import localSchema from './local-schema.sql?raw';

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
 * `init` is invoked only in the leader tab. The schema (Change 16 generated
 * `local-schema.sql`) is applied here so a freshly-created IndexedDB database
 * is immediately usable; the SQL is idempotent (`IF NOT EXISTS` / `CREATE OR
 * REPLACE`). Schema-version drift handling lives in `pglite-client.ts`.
 */
worker({
  async init() {
    const db = await PGlite.create('idb://hotseaters-ultimate', {
      extensions: { live, electric: electricSync() },
    });
    await db.exec(localSchema);
    return db;
  },
});
