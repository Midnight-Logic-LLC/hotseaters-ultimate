/**
 * sync-config.ts — declarative registry of which server tables sync into PGlite
 * and at what tier.
 *
 * This module is the **single source of truth** for both:
 *   1. The PGlite local-schema generator (`scripts/gen-pglite-schema.mjs`),
 *      which reads this config and emits `local-schema.sql` from the
 *      matching `CREATE TABLE` statements in `latest-data/supabase/migrations/`.
 *   2. The Electric shape registry (`src/shared/db/electric-sync.ts`,
 *      delivered in Change 4), which subscribes to one shape per Tier-A/B
 *      entity, using `shapeWhere(companyId)` for the tenant predicate.
 *
 * Tiering model (plan §0.12):
 *
 *   Tier A — synced + writeable offline
 *     - Local `*_synced` table (server canonical)
 *     - Local `*_local` shadow table (optimistic writes + tombstones)
 *     - Local `<name>` view merging the two
 *     - INSTEAD-OF triggers that append to `local_writes` and `pg_notify`
 *     - Write-sync drain pushes pending writes to Supabase REST
 *
 *   Tier B — synced read-only
 *     - Local `*_synced` table only; the view is just the synced table aliased.
 *     - No `*_local`, no triggers.
 *
 *   Tier C — server-only
 *     - Not synced. Fetched via Supabase REST inside stores when needed.
 *     - **Not represented in this config.**
 *
 * Hard rules (constraints.md):
 *   - Self-hosted Supabase only.
 *   - HotSeatersMVP is the bible.
 *   - PGlite has no RLS; each `shapeWhere` MUST be a subset of the matching
 *     RLS USING clause for that table (RULE 5).
 */

export type SyncTier = 'A' | 'B';

/**
 * Configuration entry for a single server table that participates in sync.
 *
 * @property name          server table name (also the local view name)
 * @property tier          sync tier — A (writeable) or B (read-only)
 * @property tenantColumn  the column used for tenant filtering. `null` means
 *                         the table IS the tenant root (filter by id =
 *                         current_company_id). For tables scoped indirectly
 *                         (e.g. via a parent FK) leave `null` and supply a
 *                         custom `shapeWhere`.
 * @property primaryKey    PK columns; defaults to `['id']`.
 * @property columns       optional subset of columns to project locally. When
 *                         omitted the generator emits the full server column
 *                         list. Use this only to drop heavy blob/JSONB
 *                         columns that aren't read offline.
 * @property shapeWhere    optional override for the Electric shape WHERE
 *                         clause. Receives the current company id (as a
 *                         single-quoted SQL literal) and returns a complete
 *                         predicate without the leading `WHERE`.
 * @property notes         human comment surfaced in the generated SQL header
 *                         and in code review.
 */
export interface SyncEntityConfig {
  name: string;
  tier: SyncTier;
  tenantColumn: string | null;
  primaryKey?: string[];
  columns?: string[];
  shapeWhere?: (companyId: string) => string;
  notes?: string;
}

/**
 * v0.1 Tier-A entities (plan §0.12). FK-dependency order is enforced by the
 * generator when it emits SQL; the order here is documentation-only.
 *
 * Tier-B is currently empty in v0.1. Future entries will appear here per the
 * roadmap (`notification`, `hsh_review`, `document_send`, `document_view`).
 */
export const SYNC_CONFIG: SyncEntityConfig[] = [
  {
    name: 'company',
    tier: 'A',
    tenantColumn: null,
    shapeWhere: (cid) => `id = ${cid}`,
    notes: 'Tenant root. Scoped by id = current_company_id, not company_id.',
  },
  {
    name: 'user_info',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'All employees/consultants visible to the tenant. auth.users bridge ' +
      'lives on the server (RULE 6); auth_user_id may be NULL on most rows.',
  },
  {
    name: 'metadata_type',
    tier: 'A',
    tenantColumn: 'company_id',
    // Two-class shape: system-wide rows (company_id IS NULL) AND company rows.
    shapeWhere: (cid) => `(company_id = ${cid} OR company_id IS NULL)`,
    notes:
      'System-wide rows (company_id IS NULL) are admitted alongside ' +
      'tenant-scoped rows. metadata_type is mostly read-only at runtime; ' +
      'admin UIs may edit it.',
  },
  {
    name: 'entity_metadata',
    tier: 'A',
    tenantColumn: null,
    // entity_metadata.company_id can be NULL (mirrors metadata_type). Scope
    // through metadata_type so system-wide metadata rows are included.
    shapeWhere: (cid) =>
      `(company_id = ${cid} OR metadata_type_id IN (SELECT id FROM metadata_type WHERE company_id = ${cid} OR company_id IS NULL))`,
    notes:
      'Scoped via metadata_type so system-wide tiers/categories sync too.',
  },
  {
    name: 'entity_setting',
    tier: 'A',
    tenantColumn: 'company_id',
    // v0.1 simplification: only sync company-owned settings. user_info_id and
    // document_template_id-owned settings are NOT synced locally; the UI that
    // needs them (user prefs panel, template editor) will fetch via REST.
    // Revisit when those features land — split into three sub-shapes then.
    shapeWhere: (cid) => `company_id = ${cid}`,
    notes:
      'GAP: only company-owned settings sync in v0.1. user_info-owned and ' +
      'document_template-owned settings are server-only until those features ' +
      'land. Splitting into three sub-shapes (one per owner FK) is the v0.2 ' +
      'plan.',
  },
  {
    name: 'client',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  {
    name: 'client_address',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  {
    name: 'trial',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  {
    name: 'trial_service',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  {
    name: 'trial_contact',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  {
    name: 'trial_segment',
    tier: 'A',
    tenantColumn: 'company_id',
    notes: 'Segments needed offline so daily-min/PDR rules resolve locally.',
  },
  {
    name: 'trial_service_assignment',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'Consultant ↔ service assignments needed for the in-detail matrix and ' +
      'time-entry available-services resolution.',
  },
];

/**
 * FK-dependency order for `CREATE TABLE` emission in `local-schema.sql`.
 * Parents must precede children so that the generated SQL can be re-applied
 * as a single transaction without forward references in the view bodies.
 */
export const EMIT_ORDER: readonly string[] = [
  'company',
  'user_info',
  'metadata_type',
  'entity_metadata',
  'entity_setting',
  'client',
  'client_address',
  'trial',
  'trial_segment',
  'trial_service',
  'trial_contact',
  'trial_service_assignment',
];
