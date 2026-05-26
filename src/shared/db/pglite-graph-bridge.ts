/**
 * pglite-graph-bridge.ts — closes the Electric→entity-graph gap.
 *
 * # The Problem
 * ElectricSQL writes server rows into `*_synced` PGlite tables. The entity
 * graph (useGraphStore / prometheus-entity-management) is a separate Zustand
 * store. Without this bridge, data only enters the graph when a hook's
 * stale-while-revalidate timer fires — which triggers a full REST round-trip
 * on every dashboard revisit.
 *
 * # The Fix
 * For each Tier-A entity in SYNC_CONFIG, this module opens a PGlite
 * `live.query` on its `*_synced` table. When Electric writes a new row,
 * PGlite fires the live-query callback → we batch-upsert ALL rows for the
 * tenant into the entity graph AND update every matching list-state slot so
 * `lastFetched` is fresh. The hook's SWR check then skips the REST request.
 *
 * # Result
 * - First mount: REST fetch populates the graph (staleTime hasn't passed yet).
 * - Electric arrives: live query fires → graph updated directly, no REST.
 * - User navigates away and returns: staleTime hasn't passed → cached rows
 *   served instantly, no network pause.
 * - Offline: graph already has data → instant render, no spinner.
 *
 * # Layer compliance (RULE 3)
 * Only `shared/db` may import PGlite, useGraphStore, or the entity-management
 * engine. This file lives in `shared/db` and is wired by `sync-gate.tsx`.
 * Components and feature hooks never import this directly.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

import { openForUser } from './pglite-client';
import { SYNC_CONFIG, type SyncEntityConfig } from './sync-config';

// ---------------------------------------------------------------------------
// Table-name → graph EntityType mapping.
//
// SYNC_CONFIG uses snake_case table names. The transport registry (and entity
// graph) uses PascalCase type names. This map is the single source of truth
// for the translation so we never have to grep across files.
// ---------------------------------------------------------------------------
const TABLE_TO_ENTITY_TYPE: Record<string, string> = {
  company: 'Company',
  user_info: 'UserInfo',
  metadata_type: 'MetadataType',
  entity_metadata: 'EntityMetadata',
  entity_setting: 'EntitySetting',
  client: 'Client',
  client_address: 'ClientAddress',
  trial: 'Trial',
  trial_service: 'TrialService',
  trial_contact: 'TrialContact',
  trial_segment: 'TrialSegment',
  trial_service_assignment: 'TrialServiceAssignment',
};

/**
 * The prefix strings that identify list-state slots in the graph for each
 * entity type. `useEntities` keys start with `["TypeName",`; legacy
 * `useEntityList` hooks may use all-lowercase table names like `["trials",`.
 * Both are matched here so the bridge keeps legacy and 2.0 consumers fresh.
 */
const ENTITY_TYPE_TO_KEY_PREFIXES: Record<string, string[]> = {
  Company: ['["Company",', '["company",'],
  UserInfo: ['["UserInfo",', '["user_info",', '["userInfo",'],
  MetadataType: ['["MetadataType",', '["metadata_type",', '["metadataType",'],
  EntityMetadata: ['["EntityMetadata",', '["entity_metadata",'],
  EntitySetting: ['["EntitySetting",', '["entity_setting",'],
  Client: ['["Client",', '["client",', '["clients",'],
  ClientAddress: ['["ClientAddress",', '["client_address",'],
  Trial: ['["Trial",', '["trial",', '["trials",'],
  TrialService: ['["TrialService",', '["trial_service",'],
  TrialContact: ['["TrialContact",', '["trial_contact",'],
  TrialSegment: ['["TrialSegment",', '["trial_segment",'],
  TrialServiceAssignment: ['["TrialServiceAssignment",', '["trial_service_assignment",'],
};

interface LiveQueryHandle {
  unsubscribe: () => Promise<void>;
}

export interface GraphBridgeHandle {
  /** Stop all live queries and release PGlite callbacks. */
  stop: () => Promise<void>;
}

/**
 * Start the Electric→graph bridge for a specific tenant.
 *
 * Call ONCE after `startTenantSync` has attached all shapes. The bridge
 * opens one PGlite live-query per Tier-A entity and keeps the entity graph
 * updated whenever Electric writes into `*_synced` tables.
 *
 * @param userId  The signed-in user's auth UUID (selects the right PGlite instance).
 * @param companyId  The tenant's company UUID (used as the WHERE predicate).
 */
export async function startGraphBridge(
  userId: string,
  companyId: string,
): Promise<GraphBridgeHandle> {
  const { db } = await openForUser(userId);
  const store = useGraphStore.getState();

  const handles: LiveQueryHandle[] = [];

  for (const config of SYNC_CONFIG) {
    const entityType = TABLE_TO_ENTITY_TYPE[config.name];
    if (!entityType) {
      // Unmapped table — skip without throwing. Add to TABLE_TO_ENTITY_TYPE if needed.
      continue;
    }

    const handle = await attachLiveQuery(db, store, config, entityType, companyId);
    handles.push(handle);
  }

  return {
    stop: async () => {
      for (const h of handles) {
        await h.unsubscribe();
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Open a `live.query` on `{config.name}_synced` for the given tenant.
 * The callback fires on initial mount and on every subsequent Electric write.
 */
async function attachLiveQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any, // LocalDB — typed as any to avoid importing PGlite-specific generics here
  store: ReturnType<typeof useGraphStore.getState>,
  config: SyncEntityConfig,
  entityType: string,
  companyId: string,
): Promise<LiveQueryHandle> {
  const syncedTable = `${config.name}_synced`;

  // Build the WHERE clause for the live query.
  // For `company` (tenantColumn = null), scope by `id = $1`.
  // For all others, scope by `{tenantColumn} = $1`.
  const whereColumn = config.tenantColumn ?? 'id';
  // metadata_type and entity_metadata also include IS NULL rows:
  const hasNullRows =
    config.name === 'metadata_type' || config.name === 'entity_metadata';

  const sql = hasNullRows
    ? `SELECT * FROM ${syncedTable} WHERE ${whereColumn} = $1 OR ${whereColumn} IS NULL`
    : `SELECT * FROM ${syncedTable} WHERE ${whereColumn} = $1`;

  const onRows = (rows: Array<Record<string, unknown>>) => {
    if (rows.length === 0) return;

    // 1. Upsert each row into the entity graph.
    const entries = rows
      .filter((r) => typeof r['id'] === 'string' && r['id'])
      .map((r) => ({ id: r['id'] as string, data: r }));

    if (entries.length > 0) {
      store.upsertEntities(entityType, entries);
    }

    // 2. Refresh all matching list-state slots so stale timers don't fire.
    refreshListStates(store, entityType, entries.map((e) => e.id), rows.length);
  };

  // PGlite's live.query fires immediately with initial rows, then on every change.
  const liveQuery = await db.live.query(
    sql,
    [companyId],
    (results: { rows: Array<Record<string, unknown>> }) => {
      onRows(results.rows);
    },
  );

  // Process initial results synchronously after mount.
  onRows(liveQuery.initialResults.rows as Array<Record<string, unknown>>);

  // The live.query API: unsubscribe takes an optional callback argument;
  // without one it tears down the whole subscription.
  const unsubscribeFn = () => liveQuery.unsubscribe();

  return { unsubscribe: unsubscribeFn };
}

/**
 * Update every list-state slot in the graph that references `entityType`,
 * stamping `lastFetched = now()` and `stale = false` so hooks skip REST.
 *
 * We iterate `store.lists` and match keys by prefix (both 2.0 and 1.x
 * patterns). The id array is the FULL set of rows we just loaded — so any
 * list that was showing the complete collection stays consistent. Lists that
 * apply server-side filters (e.g. `status=active` via `makeRestTransport`)
 * are left alone — those will still benefit from the graph entity upserts
 * (they resolve IDs → entities from the graph), but their id ordering/count
 * reflects what the REST endpoint returned.
 */
function refreshListStates(
  store: ReturnType<typeof useGraphStore.getState>,
  entityType: string,
  ids: string[],
  total: number,
): void {
  const prefixes = ENTITY_TYPE_TO_KEY_PREFIXES[entityType];
  if (!prefixes) return;

  const now = Date.now();
  const listKeys = Object.keys(store.lists);

  for (const key of listKeys) {
    const matches = prefixes.some((p) => key.startsWith(p));
    if (!matches) continue;

    const existing = store.lists[key];
    if (!existing) continue;

    // Only refresh "full collection" list slots — ones with no filter or
    // with the same total. Lists with partial result sets (pagination, filter)
    // should keep their server-returned ids intact.
    // Heuristic: if the existing list has the same or fewer IDs than our
    // full-table load, it's safe to update. Server-filtered lists that return
    // FEWER rows will have been populated via REST with the right subset;
    // we don't overwrite those.
    const existingCount = existing.ids.length;
    if (existing.total !== null && existing.total < total) {
      // This slot has a server-side filter applied — don't overwrite ids.
      // But do stamp lastFetched so the entity data is considered fresh.
      store.setListResult(key, existing.ids, {
        total: existing.total,
        lastFetched: now,
      });
      continue;
    }

    if (existingCount === 0 || existingCount <= total) {
      // Full collection or first hydration — overwrite with the complete id set.
      store.setListResult(key, ids, { total, lastFetched: now });
    } else {
      // Existing list has MORE ids than our live query returned — probably a
      // pagination window. Stamp freshness without changing the id set.
      store.setListResult(key, existing.ids, {
        total: existing.total ?? total,
        lastFetched: now,
      });
    }
  }
}
