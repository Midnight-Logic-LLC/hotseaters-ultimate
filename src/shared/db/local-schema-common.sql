-- GENERATED-DERIVED (change-403). Hand-curated from local-schema.sql.
-- =============================================================================
-- local-schema-common.sql — REFERENCE / SYSTEM tables for hotseaters-ultimate.
--
-- Applied first on every per-user PGlite first-boot (change-403 §403.b).
-- These tables are tenant-agnostic or carry system-wide rows
-- (e.g. metadata_type rows with company_id IS NULL). They are safe to share
-- across users in the same browser because per-user PGlite isolation now
-- gives each Supabase user.id its own IDB store (idb://hotseaters/${userId}).
--
-- Schema versioning + the write-ahead queue (`local_writes`) and the sync
-- gate (`_sync_meta`) live here because they are infrastructure required by
-- both the common and user schemas.
--
-- Self-hosted Supabase only. HotSeatersMVP is the bible.
-- =============================================================================

CREATE TABLE IF NOT EXISTS _pglite_schema_version (
  id      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version TEXT    NOT NULL
);

INSERT INTO _pglite_schema_version (id, version)
  VALUES (1, '20260525000004')
  ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version;

CREATE TABLE IF NOT EXISTS _sync_meta (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tenant_id       TEXT,
  hydrated_at     TIMESTAMPTZ,
  schema_version  TEXT
);

INSERT INTO _sync_meta (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS local_writes (
  id          SERIAL PRIMARY KEY,
  txid        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  entity      TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  row_id      TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_local_writes_pending
  ON local_writes (created_at) WHERE synced_at IS NULL;

-- =============================================================================
-- REFERENCE / SYSTEM-WIDE ENTITIES
-- =============================================================================
-- metadata_type and entity_metadata can carry rows with company_id IS NULL
-- (the system-wide catalog: client tiers, consultant tiers, service
-- categories, pipeline stages). They are admitted as part of the common
-- schema so the lookup features (change-404) can read them even before a
-- tenant claim is available.
--
-- NOTE: settings_type, country, state, pipeline_stage are listed in the
-- v1 task spec but do not yet exist as separate tables in the generated
-- supabase schema; their data is folded into metadata_type via `scope`
-- (e.g. `metadata_type.scope = 'pipeline_stage'`). When the upstream
-- schema gains dedicated tables, regenerate this file from
-- scripts/gen-pglite-schema.mjs.
-- =============================================================================

-- ── metadata_type ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metadata_type_synced (
  id                           TEXT,
  company_id                   TEXT,
  scope                        TEXT,
  name                         TEXT,
  description                  TEXT,
  is_active                    TEXT,
  is_default                   TEXT,
  "order"                      INTEGER,
  extra_schema                 JSONB,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS metadata_type_local (
  id                           TEXT,
  company_id                   TEXT,
  scope                        TEXT,
  name                         TEXT,
  description                  TEXT,
  is_active                    TEXT,
  is_default                   TEXT,
  "order"                      INTEGER,
  extra_schema                 JSONB,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW metadata_type AS
  SELECT s.* FROM metadata_type_synced s
  WHERE NOT EXISTS (SELECT 1 FROM metadata_type_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.company_id, l.scope, l.name, l.description, l.is_active, l.is_default, l."order", l.extra_schema, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM metadata_type_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION metadata_type_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO metadata_type_local (id, company_id, scope, name, description, is_active, is_default, "order", extra_schema, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.company_id, NEW.scope, NEW.name, NEW.description, NEW.is_active, NEW.is_default, NEW."order", NEW.extra_schema, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('metadata_type', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'metadata_type');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION metadata_type_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO metadata_type_local (id, company_id, scope, name, description, is_active, is_default, "order", extra_schema, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.company_id, NEW.scope, NEW.name, NEW.description, NEW.is_active, NEW.is_default, NEW."order", NEW.extra_schema, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    scope = EXCLUDED.scope,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    is_default = EXCLUDED.is_default,
    "order" = EXCLUDED."order",
    extra_schema = EXCLUDED.extra_schema,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('metadata_type', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'metadata_type');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION metadata_type_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO metadata_type_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('metadata_type', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'metadata_type');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS metadata_type_insert_trg ON metadata_type;
DROP TRIGGER IF EXISTS metadata_type_update_trg ON metadata_type;
DROP TRIGGER IF EXISTS metadata_type_delete_trg ON metadata_type;
CREATE TRIGGER metadata_type_insert_trg INSTEAD OF INSERT ON metadata_type
  FOR EACH ROW EXECUTE FUNCTION metadata_type_insert();
CREATE TRIGGER metadata_type_update_trg INSTEAD OF UPDATE ON metadata_type
  FOR EACH ROW EXECUTE FUNCTION metadata_type_update();
CREATE TRIGGER metadata_type_delete_trg INSTEAD OF DELETE ON metadata_type
  FOR EACH ROW EXECUTE FUNCTION metadata_type_delete();

-- ── entity_metadata ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_metadata_synced (
  id                           TEXT,
  metadata_type_id             TEXT,
  company_id                   TEXT,
  multiplier                   NUMERIC,
  extra                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS entity_metadata_local (
  id                           TEXT,
  metadata_type_id             TEXT,
  company_id                   TEXT,
  multiplier                   NUMERIC,
  extra                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW entity_metadata AS
  SELECT s.* FROM entity_metadata_synced s
  WHERE NOT EXISTS (SELECT 1 FROM entity_metadata_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.metadata_type_id, l.company_id, l.multiplier, l.extra, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM entity_metadata_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION entity_metadata_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_metadata_local (id, metadata_type_id, company_id, multiplier, extra, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.metadata_type_id, NEW.company_id, NEW.multiplier, NEW.extra, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_metadata', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'entity_metadata');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION entity_metadata_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_metadata_local (id, metadata_type_id, company_id, multiplier, extra, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.metadata_type_id, NEW.company_id, NEW.multiplier, NEW.extra, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    metadata_type_id = EXCLUDED.metadata_type_id,
    company_id = EXCLUDED.company_id,
    multiplier = EXCLUDED.multiplier,
    extra = EXCLUDED.extra,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_metadata', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'entity_metadata');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION entity_metadata_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_metadata_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_metadata', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'entity_metadata');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entity_metadata_insert_trg ON entity_metadata;
DROP TRIGGER IF EXISTS entity_metadata_update_trg ON entity_metadata;
DROP TRIGGER IF EXISTS entity_metadata_delete_trg ON entity_metadata;
CREATE TRIGGER entity_metadata_insert_trg INSTEAD OF INSERT ON entity_metadata
  FOR EACH ROW EXECUTE FUNCTION entity_metadata_insert();
CREATE TRIGGER entity_metadata_update_trg INSTEAD OF UPDATE ON entity_metadata
  FOR EACH ROW EXECUTE FUNCTION entity_metadata_update();
CREATE TRIGGER entity_metadata_delete_trg INSTEAD OF DELETE ON entity_metadata
  FOR EACH ROW EXECUTE FUNCTION entity_metadata_delete();
