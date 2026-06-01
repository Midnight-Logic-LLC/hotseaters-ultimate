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
 * Which generated runtime schema file an entity's DDL is emitted into.
 *
 *   'common' — tenant-agnostic / system tables (rows shared across users in a
 *              browser, e.g. metadata_type / entity_metadata system rows).
 *              Emitted into `local-schema-common.sql`, applied FIRST on boot
 *              alongside the infra tables (`local_writes`, `_sync_meta`,
 *              `_pglite_schema_version`).
 *   'user'   — tenant-scoped tables. Emitted into `local-schema-user.sql`,
 *              applied SECOND (after common).
 *
 * Defaults to 'user' when omitted. The generator
 * (`scripts/gen-pglite-schema.mjs`) reads this to write both runtime files
 * directly — there is NO hand-curation step.
 */
export type SyncDomain = 'common' | 'user';

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
 * @property domain        which runtime schema file the DDL is emitted into
 *                         (`'common'` | `'user'`); defaults to `'user'`.
 * @property embedding     when set, the generator adds a pgvector
 *                         `embedding vector(<dim>)` column to this entity's
 *                         synced/local tables for local semantic search (S06,
 *                         method D1 — server generates the embeddings; they
 *                         sync as an ordinary column).
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
  domain?: SyncDomain;
  embedding?: { dim: number };
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
    domain: 'common',
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
    tenantColumn: 'company_id',
    domain: 'common',
    // Electric's HTTP shape API does not support subqueries in `where`.
    // Scope directly to tenant rows plus system-wide rows.
    shapeWhere: (cid) => `(company_id = ${cid} OR company_id IS NULL)`,
    notes:
      'System-wide rows (company_id IS NULL) are admitted alongside ' +
      'tenant-scoped rows. Avoid subqueries: Electric shapes reject them.',
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
    embedding: { dim: 1536 },
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
    embedding: { dim: 1536 },
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
  {
    name: 'lead',
    tier: 'A',
    tenantColumn: 'company_id',
    embedding: { dim: 1536 },
    notes:
      'LeadRadar roster. RLS: company_id = current_company_id() — direct ' +
      'tenant predicate is exact.',
  },
  {
    name: 'attorney',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'Sales/Clients attorney directory. attorney has its own company_id ' +
      'column; the RLS SELECT policy is EXISTS(client c WHERE c.id = ' +
      'attorney.client_id AND c.company_id = current_company_id()). Electric ' +
      'shapes reject subqueries, so we scope by the direct company_id column, ' +
      'which is a subset of the EXISTS policy (an attorney shares its client’s ' +
      'company_id by construction). RULE 5 satisfied.',
    embedding: { dim: 1536 },
  },
  {
    name: 'sales_activity',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'Deal activity feed. RLS: company_id = current_company_id() — exact.',
  },
  {
    name: 'invoice',
    tier: 'A',
    tenantColumn: 'company_id',
    notes: 'Billing. RLS: company_id = current_company_id() — exact.',
  },
  {
    name: 'time_entry',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'Time & expenses. RLS: company_id = current_company_id() — exact. ' +
      'Read-heavy historical; revisit column projection if shape memory grows.',
  },
  {
    name: 'subcontract_request',
    tier: 'A',
    tenantColumn: 'company_id',
    notes:
      'HotSeatHub requests OWNED by this tenant. RLS also admits rows where ' +
      'current company is in invited_company_ids (JSONB ? operator), which ' +
      'Electric shapes cannot express — so we sync only company_id-owned rows, ' +
      'a strict subset of the policy. GAP: invited-but-not-owned requests stay ' +
      'REST until a sub-shape or server view exposes them. RULE 5 satisfied.',
  },
  {
    name: 'subcontract_assignment',
    tier: 'A',
    tenantColumn: null,
    // subcontract_assignment has NO company_id column; it is tenant-scoped by
    // EITHER side of the hiring relationship. The custom predicate is exactly
    // the RLS SELECT USING clause, so it is trivially a subset (RULE 5).
    shapeWhere: (cid) =>
      `(hiring_company_id = ${cid} OR subcontractor_company_id = ${cid})`,
    notes:
      'HotSeatHub assignments visible to either the hiring or subcontractor ' +
      'company. No company_id column — scoped by the two company FKs, matching ' +
      'the RLS both_select policy exactly.',
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
  'attorney',
  'lead',
  'trial',
  'trial_segment',
  'trial_service',
  'trial_contact',
  'trial_service_assignment',
  'sales_activity',
  'invoice',
  'time_entry',
  'subcontract_request',
  'subcontract_assignment',
];
