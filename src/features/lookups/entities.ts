/**
 * entities.ts — register lookup entities (MetadataType, EntityMetadata, SettingsType)
 * with the prometheus entity graph.
 *
 * Idempotent. Called once at module load from app-router.tsx alongside
 * registerClientEntities() and registerTrialsFeatureEntities().
 *
 * The JSON Schemas are generated automatically from the CREATE TABLE SQL by
 * registerEntityFromSql. Column definitions mirror local-schema-common.sql.
 *
 * NOTE: settings_type does not yet exist as a separate table in the generated
 * schema — pipeline_stage, service_category, client_tier, consultant_tier, and
 * service data all live in metadata_type via the `scope` column. When a
 * dedicated settings_type table is added, register it here.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { registerEntityFromSql } from '@prometheus-ags/prometheus-entity-management';

let registered = false;

export function registerLookupEntities(): void {
  if (registered) return;
  registered = true;

  // ── MetadataType ───────────────────────────────────────────────────────────
  // Covers pipeline_stage, service_category, service, client_tier,
  // consultant_tier — all distinguished by `scope`.
  registerEntityFromSql({
    entityType: 'MetadataType',
    createTableSql: `CREATE TABLE IF NOT EXISTS metadata_type (
      id TEXT,
      company_id TEXT,
      scope TEXT,
      name TEXT,
      description TEXT,
      is_active TEXT,
      is_default TEXT,
      "order" INTEGER,
      extra_schema JSONB,
      created_at TEXT,
      updated_at TEXT,
      is_sample TEXT,
      created_by_id TEXT,
      created_by TEXT
    )`,
  });

  // ── EntityMetadata ─────────────────────────────────────────────────────────
  // Instances that point to a MetadataType row via metadata_type_id.
  registerEntityFromSql({
    entityType: 'EntityMetadata',
    createTableSql: `CREATE TABLE IF NOT EXISTS entity_metadata (
      id TEXT,
      metadata_type_id TEXT,
      company_id TEXT,
      multiplier NUMERIC,
      extra TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_sample TEXT,
      created_by_id TEXT,
      created_by TEXT
    )`,
  });

  // ── SettingsType ───────────────────────────────────────────────────────────
  // settings_type is not yet a standalone table in the v2 schema — its data
  // is folded into metadata_type. This registration is intentionally omitted
  // until the upstream schema gains a dedicated settings_type table.
  // When added, register with:
  //   registerEntityFromSql({ entityType: 'SettingsType', createTableSql: `...` });
}
