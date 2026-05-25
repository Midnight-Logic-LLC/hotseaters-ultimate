/**
 * system-shapes.ts — registers reference data Electric shapes that do NOT
 * require tenant scoping (company_id IS NULL rows only).
 *
 * Reference / system tables such as `metadata_type` have a dual character:
 *   - System-wide rows (`company_id IS NULL`) — global reference data shared
 *     across all tenants. These are synced here without a tenant predicate.
 *   - Tenant-scoped rows (`company_id = <uuid>`) — synced by the tenant shape
 *     in `electric-sync.ts`.
 *
 * Keeping system shapes separate means they can be loaded once per browser
 * session independent of which user is signed in, reducing redundant Electric
 * subscriptions.
 *
 * Self-hosted Supabase only (`localhost:8000` or `hotbase.prometheusags.ai`).
 * Refuses to start against `*.supabase.co` (RULE 1).
 */

import { openForUser, type LocalDB } from './pglite-client';

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL;
const LOCAL_BROWSER_ORIGIN =
  typeof window !== 'undefined' &&
  import.meta.env.DEV &&
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(window.location.origin)
    ? window.location.origin
    : null;

if (!ELECTRIC_URL) {
  throw new Error(
    'Missing VITE_ELECTRIC_URL — set it to the local docker-compose Electric ' +
      '(http://localhost:3133) or the self-hosted endpoint ' +
      'https://electricsql.prometheusags.ai (RULE 1).',
  );
}

if (/\.supabase\.co(\/|$)/i.test(ELECTRIC_URL)) {
  throw new Error(
    `Refusing VITE_ELECTRIC_URL "${ELECTRIC_URL}". Self-hosted only (RULE 1).`,
  );
}

export interface SystemShapesHandle {
  unsubscribe: () => Promise<void>;
}

/**
 * Subscribe to system-wide (unscoped) reference data shapes.
 *
 * Currently registers:
 *   - `metadata_type` WHERE `company_id IS NULL`   — global tiers / categories
 *   - `entity_metadata` WHERE `company_id IS NULL` — global metadata instances
 *
 * @param userId used to obtain the per-user PGlite instance (change-403).
 */
export async function startSystemShapes(userId: string): Promise<SystemShapesHandle> {
  if (!userId) {
    throw new Error('startSystemShapes requires a userId (change-403: per-user PGlite isolation).');
  }

  const { db } = await openForUser(userId);

  const unsubs: Array<() => Promise<void> | void> = [];

  unsubs.push(await attachSystemShape(db, 'metadata_type', 'company_id IS NULL'));
  unsubs.push(await attachSystemShape(db, 'entity_metadata', 'company_id IS NULL'));

  return {
    unsubscribe: async () => {
      for (const unsub of unsubs) {
        await unsub();
      }
    },
  };
}

async function attachSystemShape(
  db: LocalDB,
  tableName: string,
  where: string,
): Promise<() => Promise<void> | void> {
  const sub = await db.electric.syncShapeToTable({
    shape: {
      url: `${LOCAL_BROWSER_ORIGIN ?? ELECTRIC_URL}/v1/shape`,
      params: {
        table: tableName,
        where,
      },
    },
    table: `${tableName}_synced`,
    primaryKey: ['id'],
    shapeKey: `system:${tableName}`,
  });

  return () => sub.unsubscribe();
}
