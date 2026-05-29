/**
 * lookups-selectors.ts — pure projections over the `MetadataType` slice of
 * the entity-graph store.
 *
 * V2 models reference data (pipeline stages, service categories,
 * consultant tiers, client types) as `MetadataType` rows distinguished by
 * the `scope` column. Per-row extras (e.g. `type='sales'` /
 * `revenue_probability`) live on `extra_schema` (JSONB on the type row
 * itself). These selectors:
 *
 *   • scope-filter the `MetadataType` entity slice;
 *   • tenant-filter (system rows + active company only);
 *   • lift well-known `extra_schema` fields to top-level fields so widgets
 *     don't reach into raw JSON;
 *   • sort.
 *
 * Pure: takes the entity-slice map + `companyId`, returns a typed array.
 * No I/O, no React. Hooks wrap these via `useGraphStore` + `useShallow`
 * (see `src/app/tier1-provider.tsx`).
 *
 * Bible: `HotSeatersMVP/src/lib/Tier1DataContext.jsx` — exposes the same
 * Tier-1 lookup set; this file is the V2-shape port.
 */

// ---------------------------------------------------------------------------
// Public projection types
// ---------------------------------------------------------------------------

/** Pipeline stage with `type` + `revenue_probability` lifted from `extra_schema`. */
export interface PipelineStage {
  id: string;
  name: string;
  /** 'sales' | 'operations' | '' when absent. */
  type: 'sales' | 'operations' | '';
  /** 0..1; defaults to 1 when missing/invalid. */
  revenue_probability: number;
  is_active: boolean;
  order: number;
  company_id: string | null;
  /** Stage color lifted from `extra_schema.color` when present (else undefined). */
  color?: string;
}

/** Generic typed lookup row for service_category / consultant_tier / client_type. */
export interface LookupRow {
  id: string;
  name: string;
  is_active: boolean;
  order: number;
  company_id: string | null;
  /** Untyped passthrough of `extra_schema` for callers that need it. */
  extra_schema: Record<string, unknown> | null;
  /** Lifted from `extra_schema.multiplier` when present and numeric. */
  multiplier?: number;
}

// ---------------------------------------------------------------------------
// Internal shape — what a MetadataType row looks like in the graph
// ---------------------------------------------------------------------------

interface MetadataTypeRow {
  id?: string | null;
  company_id?: string | null;
  scope?: string | null;
  name?: string | null;
  is_active?: string | null;
  order?: number | null;
  extra_schema?: Record<string, unknown> | null;
}

/**
 * What we receive from `useGraphStore.getState().entities.MetadataType`.
 *
 * The graph store types each entity slot as `unknown` (canonical opaque
 * payload). Selectors narrow per-row via the internal `MetadataTypeRow`
 * shape — safe because the registration step generated the JSON Schema
 * from the same `CREATE TABLE` (see `src/features/lookups/entities.ts`).
 */
export type EntitiesSlice = Record<string, unknown> | undefined;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActive(row: MetadataTypeRow): boolean {
  // The synced column is TEXT; treat any value other than literal 'false' as active.
  return row.is_active !== 'false';
}

function isTenantVisible(row: MetadataTypeRow, companyId: string | null): boolean {
  if (!row.company_id) return true; // system-wide row
  if (companyId && row.company_id === companyId) return true;
  return false;
}

function compareByOrderThenName(
  a: { order: number; name: string },
  b: { order: number; name: string },
): number {
  const diff = a.order - b.order;
  if (diff !== 0) return diff;
  return a.name.localeCompare(b.name);
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
}

function readPipelineType(value: unknown): 'sales' | 'operations' | '' {
  return value === 'sales' || value === 'operations' ? value : '';
}

function rowsByScope(
  entities: EntitiesSlice,
  scope: string,
  companyId: string | null,
): MetadataTypeRow[] {
  if (!entities) return [];
  const out: MetadataTypeRow[] = [];
  for (const raw of Object.values(entities)) {
    const row = raw as MetadataTypeRow;
    if (row.scope !== scope) continue;
    if (!isTenantVisible(row, companyId)) continue;
    out.push(row);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Public selectors
// ---------------------------------------------------------------------------

/**
 * Pipeline stages: `MetadataType` rows with `scope = 'pipeline_stage'`,
 * tenant-scoped, with `type` + `revenue_probability` lifted from
 * `extra_schema`. Sorted by `(order ASC, name ASC)`.
 *
 * Active stages only. Callers needing inactive stages can compose a
 * raw `useGraphStore` selector.
 */
export function selectPipelineStages(
  entities: EntitiesSlice,
  companyId: string | null,
): PipelineStage[] {
  const projected: PipelineStage[] = [];
  for (const row of rowsByScope(entities, 'pipeline_stage', companyId)) {
    if (!row.id || !isActive(row)) continue;
    const extra = row.extra_schema ?? {};
    const probability = readNumber(extra.revenue_probability);
    const color = readString(extra.color);
    projected.push({
      id: row.id,
      name: row.name ?? '',
      type: readPipelineType(extra.type),
      revenue_probability: probability ?? 1,
      is_active: true,
      order: row.order ?? 0,
      company_id: row.company_id ?? null,
      ...(color ? { color } : {}),
    });
  }
  projected.sort(compareByOrderThenName);
  return projected;
}

/** Service categories sorted by `(order ASC, name ASC)`. */
export function selectServiceCategories(
  entities: EntitiesSlice,
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookup(entities, 'service_category', companyId);
}

/** Consultant tiers — includes `multiplier` when present. */
export function selectConsultantTiers(
  entities: EntitiesSlice,
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookup(entities, 'consultant_tier', companyId);
}

/** Client types — includes `multiplier` when present. */
export function selectClientTypes(
  entities: EntitiesSlice,
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookup(entities, 'client_type', companyId);
}

function selectGenericLookup(
  entities: EntitiesSlice,
  scope: string,
  companyId: string | null,
): LookupRow[] {
  const out: LookupRow[] = [];
  for (const row of rowsByScope(entities, scope, companyId)) {
    if (!row.id || !isActive(row)) continue;
    const extra = row.extra_schema ?? null;
    const multiplier = readNumber(extra?.multiplier);
    out.push({
      id: row.id,
      name: row.name ?? '',
      is_active: true,
      order: row.order ?? 0,
      company_id: row.company_id ?? null,
      extra_schema: extra,
      ...(multiplier !== undefined ? { multiplier } : {}),
    });
  }
  out.sort(compareByOrderThenName);
  return out;
}

// ---------------------------------------------------------------------------
// Pattern 4 variants — operate on flat arrays from useLiveQuery / PGlite
// ---------------------------------------------------------------------------
// These are used by tier1-provider.tsx when MetadataType rows come directly
// from PGlite (useTierAQuery) rather than the Zustand entity graph.

function rowsByScopeFromArray(
  rows: MetadataTypeRow[],
  scope: string,
  companyId: string | null,
): MetadataTypeRow[] {
  return rows.filter(
    (row) => row.scope === scope && isTenantVisible(row, companyId),
  );
}

/**
 * Pipeline stages from a flat PGlite result array.
 * Replaces `selectPipelineStages(entitiesSlice, companyId)` for Pattern 4 reads.
 */
export function selectPipelineStagesFromRows(
  rows: MetadataTypeRow[],
  companyId: string | null,
): PipelineStage[] {
  const projected: PipelineStage[] = [];
  for (const row of rowsByScopeFromArray(rows, 'pipeline_stage', companyId)) {
    if (!row.id || !isActive(row)) continue;
    const extra = row.extra_schema ?? {};
    const probability = readNumber(extra.revenue_probability);
    const color = readString(extra.color);
    projected.push({
      id: row.id,
      name: row.name ?? '',
      type: readPipelineType(extra.type),
      revenue_probability: probability ?? 1,
      is_active: true,
      order: row.order ?? 0,
      company_id: row.company_id ?? null,
      ...(color ? { color } : {}),
    });
  }
  projected.sort(compareByOrderThenName);
  return projected;
}

/** Service categories from a flat PGlite result array. */
export function selectServiceCategoriesFromRows(
  rows: MetadataTypeRow[],
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookupFromRows(rows, 'service_category', companyId);
}

/** Consultant tiers from a flat PGlite result array. */
export function selectConsultantTiersFromRows(
  rows: MetadataTypeRow[],
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookupFromRows(rows, 'consultant_tier', companyId);
}

/** Client types from a flat PGlite result array. */
export function selectClientTypesFromRows(
  rows: MetadataTypeRow[],
  companyId: string | null,
): LookupRow[] {
  return selectGenericLookupFromRows(rows, 'client_type', companyId);
}

function selectGenericLookupFromRows(
  rows: MetadataTypeRow[],
  scope: string,
  companyId: string | null,
): LookupRow[] {
  const out: LookupRow[] = [];
  for (const row of rowsByScopeFromArray(rows, scope, companyId)) {
    if (!row.id || !isActive(row)) continue;
    const extra = row.extra_schema ?? null;
    const multiplier = readNumber(extra?.multiplier);
    out.push({
      id: row.id,
      name: row.name ?? '',
      is_active: true,
      order: row.order ?? 0,
      company_id: row.company_id ?? null,
      extra_schema: extra,
      ...(multiplier !== undefined ? { multiplier } : {}),
    });
  }
  out.sort(compareByOrderThenName);
  return out;
}
