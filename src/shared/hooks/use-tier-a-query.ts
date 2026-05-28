/**
 * use-tier-a-query.ts — Pattern 4 "Through-the-Database" read hook for
 * Tier-A entities.
 *
 * All Tier-A entities (client, trial, user_info, company, metadata_type, etc.)
 * live in PGlite IndexedDB via Electric SQL sync. This hook wraps
 * `useLiveQuery` from `@electric-sql/pglite-react` so components read
 * directly from the local unified view instead of firing REST fetches.
 *
 * On browser refresh:
 *   1. PGlite opens from IDB — ~50ms
 *   2. useLiveQuery returns IDB rows immediately
 *   3. Zero REST fetches fire for already-synced data
 *
 * When Electric delivers new rows after mount, useLiveQuery re-runs the
 * query automatically — components update with zero extra wiring.
 *
 * Architecture (Electric's recommended Pattern 4):
 *   Electric → *_synced tables
 *   Optimistic writes → *_local tables (via INSTEAD-OF triggers on the view)
 *   Unified view merges both: SELECT * FROM <entity>
 *
 * RULE 3: this hook lives in shared/hooks and may only be consumed by
 * feature hooks — never directly by components.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useLiveQuery } from '@electric-sql/pglite-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseTierAQueryResult<T = any> {
  /** Rows from the unified PGlite view. Empty array while loading. */
  rows: T[];
  /** True only on the very first render before PGlite returns any result. */
  loading: boolean;
}

/**
 * Query a Tier-A entity's unified PGlite view, scoped to the current tenant.
 *
 * @param table       The view / table name (e.g. 'client', 'trial', 'user_info')
 * @param companyId   Current tenant's company id. Query is disabled when falsy.
 * @param select      SQL column projection (default: '*')
 * @param extraWhere  Additional SQL WHERE conditions joined with AND (do NOT
 *                    include the tenant filter — it is added automatically).
 *                    Example: `"status = 'active'"`.
 *                    For entities where the tenant column is 'id' instead of
 *                    'company_id' (e.g. the company row itself), pass
 *                    `undefined` for extraWhere and use `useCompanyRow` instead.
 * @param enabled     Set to false to suppress the query (default: true).
 */
export function useTierAQuery<T extends object>(
  table: string,
  companyId: string | null | undefined,
  select = '*',
  extraWhere?: string,
  enabled = true,
): UseTierAQueryResult<T> {
  const shouldQuery = enabled && !!companyId;

  // Build WHERE clause: always scope to tenant, optionally add extra filters.
  const where = extraWhere
    ? `company_id = $1 AND (${extraWhere})`
    : 'company_id = $1';

  // useLiveQuery signature: (query, params?, options?)
  // When shouldQuery is false we pass a no-op query that returns zero rows.
  const result = useLiveQuery<T>(
    shouldQuery
      ? `SELECT ${select} FROM ${table} WHERE ${where} ORDER BY id`
      : 'SELECT 1 WHERE false',
    shouldQuery ? [companyId] : [],
  );

  return {
    rows: (result?.rows ?? []) as T[],
    // useLiveQuery returns undefined on the first render before PGlite
    // processes the query. After that it always returns a result object.
    loading: result === undefined,
  };
}

/**
 * Specialised variant for the `company` row where the tenant column is `id`.
 *
 * @param companyId  The tenant's company id. Query disabled when falsy.
 */
export function useCompanyRow<T extends object>(
  companyId: string | null | undefined,
): UseTierAQueryResult<T> {
  const shouldQuery = !!companyId;

  const result = useLiveQuery<T>(
    shouldQuery
      ? `SELECT * FROM company WHERE id = $1 LIMIT 1`
      : 'SELECT 1 WHERE false',
    shouldQuery ? [companyId] : [],
  );

  return {
    rows: (result?.rows ?? []) as T[],
    loading: result === undefined,
  };
}

/**
 * Fetch a single Tier-A entity row by its `id` column.
 *
 * @param table  The view / table name.
 * @param id     The row's primary key. Query disabled when falsy.
 */
export function useTierAById<T extends object>(
  table: string,
  id: string | null | undefined,
): { row: T | null; loading: boolean } {
  const shouldQuery = !!id;

  const result = useLiveQuery<T>(
    shouldQuery
      ? `SELECT * FROM ${table} WHERE id = $1 LIMIT 1`
      : 'SELECT 1 WHERE false',
    shouldQuery ? [id] : [],
  );

  return {
    row: (result?.rows?.[0] ?? null) as T | null,
    loading: result === undefined,
  };
}

/**
 * Query `metadata_type` including system-wide rows (company_id IS NULL) plus
 * tenant-scoped rows. This is a special case because the synced shape includes
 * both system and tenant rows (see sync-config.ts shapeWhere for metadata_type).
 *
 * @param companyId  Current tenant's company id. Query disabled when falsy.
 */
export function useMetadataTypeRows<T extends object>(
  companyId: string | null | undefined,
): UseTierAQueryResult<T> {
  const shouldQuery = !!companyId;

  const result = useLiveQuery<T>(
    shouldQuery
      ? `SELECT * FROM metadata_type WHERE (company_id = $1 OR company_id IS NULL) ORDER BY "order" ASC, name ASC`
      : 'SELECT 1 WHERE false',
    shouldQuery ? [companyId] : [],
  );

  return {
    rows: (result?.rows ?? []) as T[],
    loading: result === undefined,
  };
}
