/**
 * database-admin-store.ts — thin store wrapper around the shared/db seam for
 * the Database settings tab. Hooks call into this store (RULE C/D); the
 * store is the only place permitted to import from `@/shared/db`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import {
  BUNDLED_PGLITE_SCHEMA_VERSION,
  clearLocalTenantData,
  getSyncMeta,
  type SyncMeta,
} from '@/shared/db/pglite-client';

export interface DatabaseStatusSnapshot {
  pgliteActive: boolean;
  schemaVersion: string;
  tenantId: string | null;
  hydratedAt: string | null;
}

export async function readDatabaseStatus(
  userId: string,
): Promise<DatabaseStatusSnapshot> {
  const meta: SyncMeta = await getSyncMeta(userId);
  return {
    pgliteActive: true,
    schemaVersion: BUNDLED_PGLITE_SCHEMA_VERSION,
    tenantId: meta.tenantId,
    hydratedAt: meta.hydratedAt,
  };
}

export async function clearLocalDatabase(userId: string): Promise<void> {
  await clearLocalTenantData(userId);
}
