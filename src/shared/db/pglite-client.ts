import type { PGliteInterfaceExtensions } from '@electric-sql/pglite';
import { live } from '@electric-sql/pglite/live';
import { electricSync } from '@electric-sql/pglite-sync';
import { PGliteWorker } from '@electric-sql/pglite/worker';

import { EMIT_ORDER } from './sync-config';
import schemaCommonSql from './local-schema-common.sql?raw';
import schemaUserSql from './local-schema-user.sql?raw';
import { stopRealtimeChannels } from './realtime-channels';

/**
 * pglite-client.ts — per-user handles to the in-browser WASM Postgres.
 *
 * Each signed-in user gets their own PGlite instance stored in a separate
 * IDB database (`idb://hotseaters-<userId>`). This module maintains a
 * `Map<userId, Promise<LocalDBBootResult>>` so concurrent callers for the
 * same user always receive the same boot promise (no double-init) while
 * different users are fully isolated at the IndexedDB layer.
 *
 * Boot sequence for `openForUser(userId)`:
 *   1. Spin up a per-user Web Worker (worker name includes userId for DevTools).
 *   2. Apply `local-schema-common.sql` (reference / system tables — idempotent).
 *   3. Apply `local-schema-user.sql` (tenanted tables — idempotent).
 *   4. Run schema-version migration check; drop+restamp if version drifted.
 *   5. Return `{ db, didMigrate, previousVersion, bundledVersion }`.
 *
 * `closeForUser(userId)` closes the PGlite instance and removes it from the
 * cache so sign-out + sign-in as a different user is fully isolated.
 *
 * Part of the `shared/db` layer: the only place (alongside feature stores)
 * permitted to import PGlite / Electric (RULE 3). Components and hooks reach
 * data through stores; ESLint `boundaries/external` enforces this.
 *
 * Self-hosted Supabase only (`localhost:8000` or `hotbase.prometheusags.ai`).
 */

const EXTENSIONS = { live, electric: electricSync() };

export type LocalDB = PGliteWorker &
  PGliteInterfaceExtensions<typeof EXTENSIONS>;

/**
 * Bundled PGlite schema version. MUST stay in sync with the value baked into
 * `local-schema-user.sql` by `scripts/gen-pglite-schema.mjs`. The generator
 * stamps the latest supabase migration's timestamp prefix; whenever you
 * regenerate the SQL you also bump this constant.
 */
export const BUNDLED_PGLITE_SCHEMA_VERSION = '20260523000018';

export interface LocalDBBootResult {
  db: LocalDB;
  didMigrate: boolean;
  previousVersion: string | null;
  bundledVersion: string;
}

/**
 * Per-user cache. Key = userId, value = boot promise (ensures a single boot
 * per user even when multiple callers race at startup).
 */
const dbCache = new Map<string, Promise<LocalDBBootResult>>();

/**
 * Open (or return cached) PGlite for `userId`.
 *
 * IDB store: `idb://hotseaters-<userId>` — each user has a fully isolated
 * browser database. Schemas are applied idempotently on every open.
 */
export function openForUser(userId: string): Promise<LocalDBBootResult> {
  let cached = dbCache.get(userId);
  if (!cached) {
    cached = createLocalDBForUser(userId);
    dbCache.set(userId, cached);
  }
  return cached;
}

/**
 * Close and evict the PGlite instance for `userId`.
 *
 * Called on sign-out so the next sign-in (potentially a different user)
 * boots a fresh, isolated database.
 */
export async function closeForUser(userId: string): Promise<void> {
  const cached = dbCache.get(userId);
  if (!cached) return;
  dbCache.delete(userId);
  // Stop Realtime channels before closing the DB (T12).
  await stopRealtimeChannels();
  try {
    const { db } = await cached;
    // PGliteWorker exposes `.close()` in some versions; guard with cast.
    const dbAny = db as unknown as { close?: () => Promise<void> };
    if (typeof dbAny.close === 'function') {
      await dbAny.close();
    }
  } catch {
    // Ignore errors during close — the cache entry is already removed.
  }
}

async function createLocalDBForUser(userId: string): Promise<LocalDBBootResult> {
  // Vite bundles this worker; `{ type: 'module' }` matches `worker.format:'es'`
  // in vite.config.ts. We pass a per-user name so DevTools can distinguish tabs.
  const pgWorker = new Worker(
    new URL('./pglite.worker.ts', import.meta.url),
    { type: 'module', name: `pglite:${userId}` },
  );

  const db = (await PGliteWorker.create(pgWorker, {
    extensions: EXTENSIONS,
    // Per-user IDB database name: each user has fully isolated storage.
    dataDir: `idb://hotseaters-${userId}`,
  })) as LocalDB;

  // ── Apply schemas (idempotent IF NOT EXISTS) ─────────────────────────────
  await db.exec(schemaCommonSql);
  await db.exec(schemaUserSql);

  // ── Boot-time migration check ────────────────────────────────────────────
  const { rows } = await db.query<{ version: string | null }>(
    `SELECT version FROM _pglite_schema_version WHERE id = 1`,
  );
  const previousVersion = rows[0]?.version ?? null;
  let didMigrate = false;

  if (previousVersion !== null && previousVersion !== BUNDLED_PGLITE_SCHEMA_VERSION) {
    await dropTierATables(db);
    // Stamp the new version. Table definitions are already current because
    // exec(schemaUserSql) above ran all `IF NOT EXISTS` clauses; the dropped
    // data simply re-hydrates from Electric.
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
  const syncedTables = EMIT_ORDER.map((e) => `${e}_synced`);
  const localTables = EMIT_ORDER.map((e) => `${e}_local`);
  const all = [...syncedTables, ...localTables, 'local_writes'].join(', ');
  await db.exec(`TRUNCATE ${all} RESTART IDENTITY;`);
}

// ─── Backwards-compat alias ──────────────────────────────────────────────────

/**
 * Get (creating on first call) the local database for `userId`.
 *
 * Delegates to `openForUser(userId)` and returns the `LocalDB` handle.
 *
 * @deprecated Prefer `openForUser(userId)` when you also need `didMigrate`.
 *   Calling without a `userId` throws — no global singleton is allowed.
 */
export function getLocalDB(userId?: string): Promise<LocalDB> {
  if (!userId) {
    throw new Error(
      'getLocalDB() requires a userId (change-403: no global singleton). ' +
        'Call openForUser(userId) instead, or pass the userId explicitly.',
    );
  }
  return openForUser(userId).then((r) => r.db);
}

/**
 * Drop all tenant data from the local database and reset the sync gate.
 * Called on sign-out so a different user's session never sees the previous
 * tenant's rows and re-hydrates from scratch.
 */
export async function clearLocalTenantData(userId: string): Promise<void> {
  const { db } = await openForUser(userId);
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

/** Read the single `_sync_meta` row for `userId`. */
export async function getSyncMeta(userId: string): Promise<SyncMeta> {
  const { db } = await openForUser(userId);
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
export async function markHydrated(userId: string, tenantId: string): Promise<void> {
  const { db } = await openForUser(userId);
  await db.query(
    `UPDATE _sync_meta SET tenant_id = $1, hydrated_at = now() WHERE id = 1`,
    [tenantId],
  );
}

/** Reset the memoized client cache. Test-only — never call this in production. */
export function __resetLocalDBForTests(userId?: string): void {
  if (userId) {
    dbCache.delete(userId);
  } else {
    dbCache.clear();
  }
}
