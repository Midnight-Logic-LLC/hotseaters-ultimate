/**
 * use-semantic-search.ts — local pgvector similarity search over synced
 * entities (S06, method D1).
 *
 * Embeddings are GENERATED ON THE SERVER and synced into PGlite as an ordinary
 * `embedding vector(N)` column (see sync-config.ts `embedding` + the generated
 * `<entity>_synced` tables). This hook runs the nearest-neighbour query
 * LOCALLY against the unified view via `useLiveQuery` — zero network per query.
 *
 * The caller supplies a query embedding (same dimensionality + model as the
 * server used). Producing the query embedding is out of scope here: pass it in
 * from wherever the search box obtains it (a local embedder, or a one-shot
 * server/Edge call for the *query string only* — never per result row).
 *
 * Distance operator: `<=>` is pgvector cosine distance (smaller = closer). We
 * order ascending and cap with LIMIT. No ANN index — at per-tenant row counts a
 * sequential scan is fast (decided in S06); add HNSW/IVFFlat later if needed.
 *
 * RULE 3: shared hook; feature hooks consume it. Self-hosted only.
 */

import { useLiveQuery } from '@electric-sql/pglite-react';

export interface SemanticHit<T> {
  row: T;
  /** Cosine distance (0 = identical direction, 2 = opposite). Lower is closer. */
  distance: number;
}

export interface UseSemanticSearchResult<T> {
  hits: SemanticHit<T>[];
  loading: boolean;
}

/**
 * Serialise a JS number[] into a pgvector literal: `[1,2,3]`. Guards against
 * non-finite values that would produce an invalid literal.
 */
function toVectorLiteral(embedding: readonly number[]): string {
  return `[${embedding.map((n) => (Number.isFinite(n) ? n : 0)).join(',')}]`;
}

/**
 * Search a synced entity by vector similarity, scoped to the current tenant.
 *
 * @param table       view/table name carrying an `embedding` column (e.g.
 *                    'client', 'trial', 'lead', 'attorney').
 * @param companyId   tenant scope. Query disabled when falsy.
 * @param queryEmbedding  the query vector (same dim as the column). Query
 *                    disabled when null/empty.
 * @param limit       max hits (default 10).
 */
export function useSemanticSearch<T extends object>(
  table: string,
  companyId: string | null | undefined,
  queryEmbedding: readonly number[] | null | undefined,
  limit = 10,
): UseSemanticSearchResult<T> {
  const enabled =
    !!companyId && !!queryEmbedding && queryEmbedding.length > 0;

  // pgvector cannot bind a vector through a normal parameter, so the literal is
  // interpolated. It is built from finite numbers only (toVectorLiteral), never
  // from user text, so there is no injection surface. companyId is bound.
  const sql = enabled
    ? `SELECT *, (embedding <=> '${toVectorLiteral(queryEmbedding!)}') AS _distance
       FROM ${table}
       WHERE company_id = $1 AND embedding IS NOT NULL
       ORDER BY _distance ASC
       LIMIT ${Math.max(1, Math.floor(limit))}`
    : 'SELECT 1 WHERE false';

  const result = useLiveQuery<T & { _distance: number }>(
    sql,
    enabled ? [companyId] : [],
  );

  return {
    hits: (result?.rows ?? []).map((r) => {
      const { _distance, ...row } = r;
      return { row: row as unknown as T, distance: _distance };
    }),
    loading: result === undefined,
  };
}
