import type { PGliteInterfaceExtensions } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { electricSync } from '@electric-sql/pglite-sync';
import { PGliteWorker } from '@electric-sql/pglite/worker';

import { EMIT_ORDER } from './sync-config';

/**
 * pglite-client.ts — main-thread handle to the in-browser WASM Postgres.
 *
 * The database engine itself runs in a Web Worker (`pglite.worker.ts`): WASM
 * + SQL stay off the UI thread, and the worker library elects one leader tab
 * so every tab shares a single database. This module exposes that worker as a
 * `PGliteWorker`, which implements the full PGlite query interface.
 *
 * Part of the `shared/db` layer: the only place (alongside feature stores)
 * permitted to import PGlite / Electric (RULE 3). Components and hooks reach
 * data through stores; ESLint `boundaries/external` enforces this.
 *
 * Boot-time schema migration:
 *   On first call to `getLocalDB()`, the bundled version constant
 *   `BUNDLED_PGLITE_SCHEMA_VERSION` is compared against the row in
 *   `_pglite_schema_version`. If newer (or absent), the synced/local tables
 *   for every Tier-A entity are dropped and the schema is re-applied — the
 *   server is canonical, so a full re-hydrate is the safe action. The sync
 *   gate consumes `didMigrate` to surface "Updating local cache…".
 *
 * The instance is created lazily and memoized so every store shares one DB.
 */

const EXTENSIONS = { live, electric: electricSync() };

export type LocalDB = PGliteWorker &
  PGliteInterfaceExtensions<typeof EXTENSIONS>;

/**
 * Bundled PGlite schema version. MUST stay in sync with the value baked into
 * `local-schema.sql` by `scripts/gen-pglite-schema.mjs`. The generator stamps
 * the latest supabase migration's timestamp prefix; whenever you regenerate
 * the SQL you also bump this constant.
 */
export const BUNDLED_PGLITE_SCHEMA_VERSION = '20260523000018';

export interface LocalDBBootResult {
  db: LocalDB;
  didMigrate: boolean;
  previousVersion: string | null;
  bundledVersion: string;
}

let bootPromise: Promise<LocalDBBootResult> | null = null;

/** Get (creating on first call) the shared local database. */
export function getLocalDB(): Promise<LocalDB> {
  return bootLocalDB().then((r) => r.db);
}

/** Boot the local DB and return the full result (used by the sync gate). */
export function bootLocalDB(): Promise<LocalDBBootResult> {
  if (!bootPromise) {
    bootPromise = createLocalDB();
  }
  return bootPromise;
}

async function createLocalDB(): Promise<LocalDBBootResult> {
  // Vite bundles this worker; `{ type: 'module' }` matches `worker.format:'es'`
  // in vite.config.ts. The schema is applied inside the worker's init.
  const pgWorker = new Worker(
    new URL('./pglite.worker.ts', import.meta.url),
    { type: 'module', name: 'pglite' },
  );

  const db = (await PGliteWorker.create(pgWorker, {
    extensions: EXTENSIONS,
  })) as LocalDB;

  // ── Boot-time migration check ────────────────────────────────────────────
  const { rows } = await db.query<{ version: string | null }>(
    `SELECT version FROM _pglite_schema_version WHERE id = 1`,
  );
  const previousVersion = rows[0]?.version ?? null;
  let didMigrate = false;

  if (previousVersion !== null && previousVersion !== BUNDLED_PGLITE_SCHEMA_VERSION) {
    await dropTierATables(db);
    // Re-apply the bundled schema by closing-and-reopening would require
    // recreating the worker; instead, stamp the version row. The worker
    // already applied the bundled SQL with `IF NOT EXISTS`, so the table
    // definitions are current — the dropped data simply re-hydrates from
    // Electric.
    await db.query(
      `UPDATE _pglite_schema_version SET version = $1 WHERE id = 1`,
      [BUNDLED_PGLITE_SCHEMA_VERSION],
    );
    // Reset the sync gate so the next bootstrap performs a fresh hydration.
    await db.exec(
      `UPDATE _sync_meta SET tenant_id = NULL, hydrated_at = NULL WHERE id = 1`,
    );
    didMigrate = true;
  }

  return {
    db,
    didMigrate,
    previousVersion,
    bundledVersion: BUNDLED_PGLITE_SCHEMA_VERSION,
  };
}

/** Drop synced + local rows for every Tier-A entity. */
async function dropTierATables(db: LocalDB): Promise<void> {
  // TRUNCATE the trio rows; the table definitions are kept (idempotent
  // `CREATE TABLE IF NOT EXISTS` will no-op next boot).
  const syncedTables = EMIT_ORDER.map((e) => `${e}_synced`);
  const localTables = EMIT_ORDER.map((e) => `${e}_local`);
  const all = [...syncedTables, ...localTables, 'local_writes'].join(', ');
  await db.exec(`TRUNCATE ${all} RESTART IDENTITY;`);
}

/**
 * Drop all tenant data from the local database and reset the sync gate.
 * Called on sign-out and on tenant switch so a different user's session never
 * sees the previous tenant's rows and re-hydrates from scratch.
 */
export async function clearLocalTenantData(): Promise<void> {
  const db = await getLocalDB();
  const syncedTables = EMIT_ORDER.map((e) => `${e}_synced`);
  const localTables = EMIT_ORDER.map((e) => `${e}_local`);
  const all = [...syncedTables, ...localTables, 'local_writes'].join(', ');
  await db.exec(`
    TRUNCATE ${all} RESTART IDENTITY;
    UPDATE _sync_meta SET tenant_id = NULL, hydrated_at = NULL WHERE id = 1;
  `);
}

/** Current state of the load-once sync gate. */
export interface SyncMeta {
  tenantId: string | null;
  hydratedAt: string | null;
}

/** Read the single `_sync_meta` row. */
export async function getSyncMeta(): Promise<SyncMeta> {
  const db = await getLocalDB();
  const { rows } = await db.query<{
    tenant_id: string | null;
    hydrated_at: string | null;
  }>(`SELECT tenant_id, hydrated_at FROM _sync_meta WHERE id = 1`);
  const row = rows[0];
  return {
    tenantId: row?.tenant_id ?? null,
    hydratedAt: row?.hydrated_at ?? null,
  };
}

/**
 * Stamp `_sync_meta` after a successful first-time hydration: records the
 * tenant and sets `hydrated_at` so future logins resume incrementally.
 */
export async function markHydrated(tenantId: string): Promise<void> {
  const db = await getLocalDB();
  await db.query(
    `UPDATE _sync_meta SET tenant_id = $1, hydrated_at = now() WHERE id = 1`,
    [tenantId],
  );
}

/** Reset the memoized client. Test-only — never call this in production. */
export function __resetLocalDBForTests(): void {
  bootPromise = null;
}
