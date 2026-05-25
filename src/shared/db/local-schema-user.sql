-- GENERATED-DERIVED (change-403). Hand-curated from local-schema.sql.
-- =============================================================================
-- local-schema-user.sql — TENANTED tables for hotseaters-ultimate.
--
-- Applied second on every per-user PGlite first-boot (change-403 §403.b),
-- after local-schema-common.sql.
--
-- Every table here is filtered by company_id at the Electric / Realtime
-- boundary via createTenantScopedElectricAdapter. PGlite has no RLS — the
-- per-user IDB store (idb://hotseaters/${userId}) + tenant adapter together
-- guarantee that one user's rows never reach another user's local database.
--
-- Tables in this file:
--   company, user_info, entity_setting, client, client_address, trial,
--   trial_segment, trial_service, trial_contact, trial_service_assignment.
--
-- Tables listed in change-403 §403.b that do NOT yet exist in supabase
-- migrations (and therefore are NOT in this file): client_service_override,
-- invoice, bill_payment, time_entry, expense, subcontract_request,
-- subcontract_assignment, deal_document, document_signer. They will be
-- added by the generator once the upstream supabase migrations land.
--
-- Self-hosted Supabase only. HotSeatersMVP is the bible.
-- =============================================================================

-- ── company ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  name                         TEXT,
  email                        TEXT,
  sender_email                 TEXT,
  phone                        TEXT,
  website                      TEXT,
  address                      TEXT,
  city                         TEXT,
  state                        TEXT,
  zip                          TEXT,
  owner_id                     TEXT,
  subscription_tier            TEXT,
  is_active                    TEXT,
  stripe_customer_id           TEXT,
  marketplace_post_jobs        TEXT,
  marketplace_fill_jobs        TEXT,
  has_hsh_addon                TEXT,
  hsh_rating                   NUMERIC,
  hsh_reviews_count            INTEGER,
  show_debug_info              TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS company_local (
  id                           TEXT,
  legacy_id                    TEXT,
  name                         TEXT,
  email                        TEXT,
  sender_email                 TEXT,
  phone                        TEXT,
  website                      TEXT,
  address                      TEXT,
  city                         TEXT,
  state                        TEXT,
  zip                          TEXT,
  owner_id                     TEXT,
  subscription_tier            TEXT,
  is_active                    TEXT,
  stripe_customer_id           TEXT,
  marketplace_post_jobs        TEXT,
  marketplace_fill_jobs        TEXT,
  has_hsh_addon                TEXT,
  hsh_rating                   NUMERIC,
  hsh_reviews_count            INTEGER,
  show_debug_info              TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW company AS
  SELECT s.* FROM company_synced s
  WHERE NOT EXISTS (SELECT 1 FROM company_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.name, l.email, l.sender_email, l.phone, l.website, l.address, l.city, l.state, l.zip, l.owner_id, l.subscription_tier, l.is_active, l.stripe_customer_id, l.marketplace_post_jobs, l.marketplace_fill_jobs, l.has_hsh_addon, l.hsh_rating, l.hsh_reviews_count, l.show_debug_info, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM company_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION company_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_local (id, legacy_id, name, email, sender_email, phone, website, address, city, state, zip, owner_id, subscription_tier, is_active, stripe_customer_id, marketplace_post_jobs, marketplace_fill_jobs, has_hsh_addon, hsh_rating, hsh_reviews_count, show_debug_info, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.name, NEW.email, NEW.sender_email, NEW.phone, NEW.website, NEW.address, NEW.city, NEW.state, NEW.zip, NEW.owner_id, NEW.subscription_tier, NEW.is_active, NEW.stripe_customer_id, NEW.marketplace_post_jobs, NEW.marketplace_fill_jobs, NEW.has_hsh_addon, NEW.hsh_rating, NEW.hsh_reviews_count, NEW.show_debug_info, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('company', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'company');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION company_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_local (id, legacy_id, name, email, sender_email, phone, website, address, city, state, zip, owner_id, subscription_tier, is_active, stripe_customer_id, marketplace_post_jobs, marketplace_fill_jobs, has_hsh_addon, hsh_rating, hsh_reviews_count, show_debug_info, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.name, NEW.email, NEW.sender_email, NEW.phone, NEW.website, NEW.address, NEW.city, NEW.state, NEW.zip, NEW.owner_id, NEW.subscription_tier, NEW.is_active, NEW.stripe_customer_id, NEW.marketplace_post_jobs, NEW.marketplace_fill_jobs, NEW.has_hsh_addon, NEW.hsh_rating, NEW.hsh_reviews_count, NEW.show_debug_info, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    sender_email = EXCLUDED.sender_email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    owner_id = EXCLUDED.owner_id,
    subscription_tier = EXCLUDED.subscription_tier,
    is_active = EXCLUDED.is_active,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    marketplace_post_jobs = EXCLUDED.marketplace_post_jobs,
    marketplace_fill_jobs = EXCLUDED.marketplace_fill_jobs,
    has_hsh_addon = EXCLUDED.has_hsh_addon,
    hsh_rating = EXCLUDED.hsh_rating,
    hsh_reviews_count = EXCLUDED.hsh_reviews_count,
    show_debug_info = EXCLUDED.show_debug_info,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('company', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'company');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION company_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('company', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'company');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_insert_trg ON company;
DROP TRIGGER IF EXISTS company_update_trg ON company;
DROP TRIGGER IF EXISTS company_delete_trg ON company;
CREATE TRIGGER company_insert_trg INSTEAD OF INSERT ON company
  FOR EACH ROW EXECUTE FUNCTION company_insert();
CREATE TRIGGER company_update_trg INSTEAD OF UPDATE ON company
  FOR EACH ROW EXECUTE FUNCTION company_update();
CREATE TRIGGER company_delete_trg INSTEAD OF DELETE ON company
  FOR EACH ROW EXECUTE FUNCTION company_delete();

-- ── user_info ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_info_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  first_name                   TEXT,
  last_name                    TEXT,
  title                        TEXT,
  phone                        TEXT,
  profile_photo                TEXT,
  signature_image              TEXT,
  notes                        TEXT,
  company_id                   TEXT,
  company_role                 TEXT,
  user_id                      TEXT,
  status                       TEXT,
  consultant_tier_id           TEXT,
  is_sales                     TEXT,
  hsh_location                 TEXT,
  hsh_rating                   NUMERIC,
  hsh_reviews_count            INTEGER,
  hsh_skills                   JSONB,
  hsh_profile_description      TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS user_info_local (
  id                           TEXT,
  legacy_id                    TEXT,
  first_name                   TEXT,
  last_name                    TEXT,
  title                        TEXT,
  phone                        TEXT,
  profile_photo                TEXT,
  signature_image              TEXT,
  notes                        TEXT,
  company_id                   TEXT,
  company_role                 TEXT,
  user_id                      TEXT,
  status                       TEXT,
  consultant_tier_id           TEXT,
  is_sales                     TEXT,
  hsh_location                 TEXT,
  hsh_rating                   NUMERIC,
  hsh_reviews_count            INTEGER,
  hsh_skills                   JSONB,
  hsh_profile_description      TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW user_info AS
  SELECT s.* FROM user_info_synced s
  WHERE NOT EXISTS (SELECT 1 FROM user_info_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.first_name, l.last_name, l.title, l.phone, l.profile_photo, l.signature_image, l.notes, l.company_id, l.company_role, l.user_id, l.status, l.consultant_tier_id, l.is_sales, l.hsh_location, l.hsh_rating, l.hsh_reviews_count, l.hsh_skills, l.hsh_profile_description, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM user_info_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION user_info_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_info_local (id, legacy_id, first_name, last_name, title, phone, profile_photo, signature_image, notes, company_id, company_role, user_id, status, consultant_tier_id, is_sales, hsh_location, hsh_rating, hsh_reviews_count, hsh_skills, hsh_profile_description, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.first_name, NEW.last_name, NEW.title, NEW.phone, NEW.profile_photo, NEW.signature_image, NEW.notes, NEW.company_id, NEW.company_role, NEW.user_id, NEW.status, NEW.consultant_tier_id, NEW.is_sales, NEW.hsh_location, NEW.hsh_rating, NEW.hsh_reviews_count, NEW.hsh_skills, NEW.hsh_profile_description, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('user_info', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'user_info');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_info_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_info_local (id, legacy_id, first_name, last_name, title, phone, profile_photo, signature_image, notes, company_id, company_role, user_id, status, consultant_tier_id, is_sales, hsh_location, hsh_rating, hsh_reviews_count, hsh_skills, hsh_profile_description, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.first_name, NEW.last_name, NEW.title, NEW.phone, NEW.profile_photo, NEW.signature_image, NEW.notes, NEW.company_id, NEW.company_role, NEW.user_id, NEW.status, NEW.consultant_tier_id, NEW.is_sales, NEW.hsh_location, NEW.hsh_rating, NEW.hsh_reviews_count, NEW.hsh_skills, NEW.hsh_profile_description, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    title = EXCLUDED.title,
    phone = EXCLUDED.phone,
    profile_photo = EXCLUDED.profile_photo,
    signature_image = EXCLUDED.signature_image,
    notes = EXCLUDED.notes,
    company_id = EXCLUDED.company_id,
    company_role = EXCLUDED.company_role,
    user_id = EXCLUDED.user_id,
    status = EXCLUDED.status,
    consultant_tier_id = EXCLUDED.consultant_tier_id,
    is_sales = EXCLUDED.is_sales,
    hsh_location = EXCLUDED.hsh_location,
    hsh_rating = EXCLUDED.hsh_rating,
    hsh_reviews_count = EXCLUDED.hsh_reviews_count,
    hsh_skills = EXCLUDED.hsh_skills,
    hsh_profile_description = EXCLUDED.hsh_profile_description,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('user_info', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'user_info');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_info_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_info_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('user_info', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'user_info');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_info_insert_trg ON user_info;
DROP TRIGGER IF EXISTS user_info_update_trg ON user_info;
DROP TRIGGER IF EXISTS user_info_delete_trg ON user_info;
CREATE TRIGGER user_info_insert_trg INSTEAD OF INSERT ON user_info
  FOR EACH ROW EXECUTE FUNCTION user_info_insert();
CREATE TRIGGER user_info_update_trg INSTEAD OF UPDATE ON user_info
  FOR EACH ROW EXECUTE FUNCTION user_info_update();
CREATE TRIGGER user_info_delete_trg INSTEAD OF DELETE ON user_info
  FOR EACH ROW EXECUTE FUNCTION user_info_delete();

-- ── entity_setting ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_setting_synced (
  id                           TEXT,
  settings_type_id             TEXT,
  company_id                   TEXT,
  user_info_id                 TEXT,
  document_template_id         TEXT,
  data                         TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS entity_setting_local (
  id                           TEXT,
  settings_type_id             TEXT,
  company_id                   TEXT,
  user_info_id                 TEXT,
  document_template_id         TEXT,
  data                         TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW entity_setting AS
  SELECT s.* FROM entity_setting_synced s
  WHERE NOT EXISTS (SELECT 1 FROM entity_setting_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.settings_type_id, l.company_id, l.user_info_id, l.document_template_id, l.data, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM entity_setting_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION entity_setting_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_setting_local (id, settings_type_id, company_id, user_info_id, document_template_id, data, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.settings_type_id, NEW.company_id, NEW.user_info_id, NEW.document_template_id, NEW.data, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_setting', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'entity_setting');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION entity_setting_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_setting_local (id, settings_type_id, company_id, user_info_id, document_template_id, data, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.settings_type_id, NEW.company_id, NEW.user_info_id, NEW.document_template_id, NEW.data, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    settings_type_id = EXCLUDED.settings_type_id,
    company_id = EXCLUDED.company_id,
    user_info_id = EXCLUDED.user_info_id,
    document_template_id = EXCLUDED.document_template_id,
    data = EXCLUDED.data,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_setting', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'entity_setting');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION entity_setting_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entity_setting_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('entity_setting', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'entity_setting');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS entity_setting_insert_trg ON entity_setting;
DROP TRIGGER IF EXISTS entity_setting_update_trg ON entity_setting;
DROP TRIGGER IF EXISTS entity_setting_delete_trg ON entity_setting;
CREATE TRIGGER entity_setting_insert_trg INSTEAD OF INSERT ON entity_setting
  FOR EACH ROW EXECUTE FUNCTION entity_setting_insert();
CREATE TRIGGER entity_setting_update_trg INSTEAD OF UPDATE ON entity_setting
  FOR EACH ROW EXECUTE FUNCTION entity_setting_update();
CREATE TRIGGER entity_setting_delete_trg INSTEAD OF DELETE ON entity_setting
  FOR EACH ROW EXECUTE FUNCTION entity_setting_delete();

-- ── client ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_type_id               TEXT,
  firm_name                    TEXT,
  phone                        TEXT,
  website                      TEXT,
  sales_lead                   TEXT,
  is_lead                      TEXT,
  status                       TEXT,
  notes                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS client_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_type_id               TEXT,
  firm_name                    TEXT,
  phone                        TEXT,
  website                      TEXT,
  sales_lead                   TEXT,
  is_lead                      TEXT,
  status                       TEXT,
  notes                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW client AS
  SELECT s.* FROM client_synced s
  WHERE NOT EXISTS (SELECT 1 FROM client_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.client_type_id, l.firm_name, l.phone, l.website, l.sales_lead, l.is_lead, l.status, l.notes, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM client_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION client_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_local (id, legacy_id, company_id, client_type_id, firm_name, phone, website, sales_lead, is_lead, status, notes, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.client_type_id, NEW.firm_name, NEW.phone, NEW.website, NEW.sales_lead, NEW.is_lead, NEW.status, NEW.notes, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION client_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_local (id, legacy_id, company_id, client_type_id, firm_name, phone, website, sales_lead, is_lead, status, notes, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.client_type_id, NEW.firm_name, NEW.phone, NEW.website, NEW.sales_lead, NEW.is_lead, NEW.status, NEW.notes, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    client_type_id = EXCLUDED.client_type_id,
    firm_name = EXCLUDED.firm_name,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    sales_lead = EXCLUDED.sales_lead,
    is_lead = EXCLUDED.is_lead,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION client_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'client');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_insert_trg ON client;
DROP TRIGGER IF EXISTS client_update_trg ON client;
DROP TRIGGER IF EXISTS client_delete_trg ON client;
CREATE TRIGGER client_insert_trg INSTEAD OF INSERT ON client
  FOR EACH ROW EXECUTE FUNCTION client_insert();
CREATE TRIGGER client_update_trg INSTEAD OF UPDATE ON client
  FOR EACH ROW EXECUTE FUNCTION client_update();
CREATE TRIGGER client_delete_trg INSTEAD OF DELETE ON client
  FOR EACH ROW EXECUTE FUNCTION client_delete();

-- ── client_address ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_address_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_id                    TEXT,
  label                        TEXT,
  address                      TEXT,
  city                         TEXT,
  state                        TEXT,
  zip                          TEXT,
  is_primary                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS client_address_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_id                    TEXT,
  label                        TEXT,
  address                      TEXT,
  city                         TEXT,
  state                        TEXT,
  zip                          TEXT,
  is_primary                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW client_address AS
  SELECT s.* FROM client_address_synced s
  WHERE NOT EXISTS (SELECT 1 FROM client_address_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.client_id, l.label, l.address, l.city, l.state, l.zip, l.is_primary, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM client_address_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION client_address_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_address_local (id, legacy_id, company_id, client_id, label, address, city, state, zip, is_primary, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.client_id, NEW.label, NEW.address, NEW.city, NEW.state, NEW.zip, NEW.is_primary, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client_address', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'client_address');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION client_address_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_address_local (id, legacy_id, company_id, client_id, label, address, city, state, zip, is_primary, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.client_id, NEW.label, NEW.address, NEW.city, NEW.state, NEW.zip, NEW.is_primary, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    client_id = EXCLUDED.client_id,
    label = EXCLUDED.label,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip = EXCLUDED.zip,
    is_primary = EXCLUDED.is_primary,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client_address', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'client_address');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION client_address_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_address_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('client_address', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'client_address');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_address_insert_trg ON client_address;
DROP TRIGGER IF EXISTS client_address_update_trg ON client_address;
DROP TRIGGER IF EXISTS client_address_delete_trg ON client_address;
CREATE TRIGGER client_address_insert_trg INSTEAD OF INSERT ON client_address
  FOR EACH ROW EXECUTE FUNCTION client_address_insert();
CREATE TRIGGER client_address_update_trg INSTEAD OF UPDATE ON client_address
  FOR EACH ROW EXECUTE FUNCTION client_address_update();
CREATE TRIGGER client_address_delete_trg INSTEAD OF DELETE ON client_address
  FOR EACH ROW EXECUTE FUNCTION client_address_delete();

-- ── trial ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_id                    TEXT,
  pipeline_stage_id            TEXT,
  deal_document_id             TEXT,
  primary_contact_id           TEXT,
  frp_client_id                TEXT,
  frp_contact_id               TEXT,
  consultant_id                TEXT,
  case_name                    TEXT,
  case_number                  TEXT,
  case_type                    TEXT,
  case_style                   TEXT,
  job_number                   TEXT,
  side                         TEXT,
  judge                        TEXT,
  courthouse                   TEXT,
  court                        TEXT,
  city                         TEXT,
  state                        TEXT,
  notes                        TEXT,
  start_date                   TEXT,
  end_date                     TEXT,
  completion_date              TEXT,
  continued_date_precision     TEXT,
  estimated_value              NUMERIC,
  retainer_value               NUMERIC,
  daily_minimum_hours          NUMERIC,
  bill_for_weekends            TEXT,
  won_date                     TEXT,
  lost_date                    TEXT,
  completion_type              TEXT,
  invoice_recipient_preferences JSONB,
  updated_by                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS trial_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  client_id                    TEXT,
  pipeline_stage_id            TEXT,
  deal_document_id             TEXT,
  primary_contact_id           TEXT,
  frp_client_id                TEXT,
  frp_contact_id               TEXT,
  consultant_id                TEXT,
  case_name                    TEXT,
  case_number                  TEXT,
  case_type                    TEXT,
  case_style                   TEXT,
  job_number                   TEXT,
  side                         TEXT,
  judge                        TEXT,
  courthouse                   TEXT,
  court                        TEXT,
  city                         TEXT,
  state                        TEXT,
  notes                        TEXT,
  start_date                   TEXT,
  end_date                     TEXT,
  completion_date              TEXT,
  continued_date_precision     TEXT,
  estimated_value              NUMERIC,
  retainer_value               NUMERIC,
  daily_minimum_hours          NUMERIC,
  bill_for_weekends            TEXT,
  won_date                     TEXT,
  lost_date                    TEXT,
  completion_type              TEXT,
  invoice_recipient_preferences JSONB,
  updated_by                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW trial AS
  SELECT s.* FROM trial_synced s
  WHERE NOT EXISTS (SELECT 1 FROM trial_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.client_id, l.pipeline_stage_id, l.deal_document_id, l.primary_contact_id, l.frp_client_id, l.frp_contact_id, l.consultant_id, l.case_name, l.case_number, l.case_type, l.case_style, l.job_number, l.side, l.judge, l.courthouse, l.court, l.city, l.state, l.notes, l.start_date, l.end_date, l.completion_date, l.continued_date_precision, l.estimated_value, l.retainer_value, l.daily_minimum_hours, l.bill_for_weekends, l.won_date, l.lost_date, l.completion_type, l.invoice_recipient_preferences, l.updated_by, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM trial_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION trial_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_local (id, legacy_id, company_id, client_id, pipeline_stage_id, deal_document_id, primary_contact_id, frp_client_id, frp_contact_id, consultant_id, case_name, case_number, case_type, case_style, job_number, side, judge, courthouse, court, city, state, notes, start_date, end_date, completion_date, continued_date_precision, estimated_value, retainer_value, daily_minimum_hours, bill_for_weekends, won_date, lost_date, completion_type, invoice_recipient_preferences, updated_by, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.client_id, NEW.pipeline_stage_id, NEW.deal_document_id, NEW.primary_contact_id, NEW.frp_client_id, NEW.frp_contact_id, NEW.consultant_id, NEW.case_name, NEW.case_number, NEW.case_type, NEW.case_style, NEW.job_number, NEW.side, NEW.judge, NEW.courthouse, NEW.court, NEW.city, NEW.state, NEW.notes, NEW.start_date, NEW.end_date, NEW.completion_date, NEW.continued_date_precision, NEW.estimated_value, NEW.retainer_value, NEW.daily_minimum_hours, NEW.bill_for_weekends, NEW.won_date, NEW.lost_date, NEW.completion_type, NEW.invoice_recipient_preferences, NEW.updated_by, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_local (id, legacy_id, company_id, client_id, pipeline_stage_id, deal_document_id, primary_contact_id, frp_client_id, frp_contact_id, consultant_id, case_name, case_number, case_type, case_style, job_number, side, judge, courthouse, court, city, state, notes, start_date, end_date, completion_date, continued_date_precision, estimated_value, retainer_value, daily_minimum_hours, bill_for_weekends, won_date, lost_date, completion_type, invoice_recipient_preferences, updated_by, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.client_id, NEW.pipeline_stage_id, NEW.deal_document_id, NEW.primary_contact_id, NEW.frp_client_id, NEW.frp_contact_id, NEW.consultant_id, NEW.case_name, NEW.case_number, NEW.case_type, NEW.case_style, NEW.job_number, NEW.side, NEW.judge, NEW.courthouse, NEW.court, NEW.city, NEW.state, NEW.notes, NEW.start_date, NEW.end_date, NEW.completion_date, NEW.continued_date_precision, NEW.estimated_value, NEW.retainer_value, NEW.daily_minimum_hours, NEW.bill_for_weekends, NEW.won_date, NEW.lost_date, NEW.completion_type, NEW.invoice_recipient_preferences, NEW.updated_by, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    client_id = EXCLUDED.client_id,
    pipeline_stage_id = EXCLUDED.pipeline_stage_id,
    deal_document_id = EXCLUDED.deal_document_id,
    primary_contact_id = EXCLUDED.primary_contact_id,
    frp_client_id = EXCLUDED.frp_client_id,
    frp_contact_id = EXCLUDED.frp_contact_id,
    consultant_id = EXCLUDED.consultant_id,
    case_name = EXCLUDED.case_name,
    case_number = EXCLUDED.case_number,
    case_type = EXCLUDED.case_type,
    case_style = EXCLUDED.case_style,
    job_number = EXCLUDED.job_number,
    side = EXCLUDED.side,
    judge = EXCLUDED.judge,
    courthouse = EXCLUDED.courthouse,
    court = EXCLUDED.court,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    notes = EXCLUDED.notes,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    completion_date = EXCLUDED.completion_date,
    continued_date_precision = EXCLUDED.continued_date_precision,
    estimated_value = EXCLUDED.estimated_value,
    retainer_value = EXCLUDED.retainer_value,
    daily_minimum_hours = EXCLUDED.daily_minimum_hours,
    bill_for_weekends = EXCLUDED.bill_for_weekends,
    won_date = EXCLUDED.won_date,
    lost_date = EXCLUDED.lost_date,
    completion_type = EXCLUDED.completion_type,
    invoice_recipient_preferences = EXCLUDED.invoice_recipient_preferences,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'trial');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_insert_trg ON trial;
DROP TRIGGER IF EXISTS trial_update_trg ON trial;
DROP TRIGGER IF EXISTS trial_delete_trg ON trial;
CREATE TRIGGER trial_insert_trg INSTEAD OF INSERT ON trial
  FOR EACH ROW EXECUTE FUNCTION trial_insert();
CREATE TRIGGER trial_update_trg INSTEAD OF UPDATE ON trial
  FOR EACH ROW EXECUTE FUNCTION trial_update();
CREATE TRIGGER trial_delete_trg INSTEAD OF DELETE ON trial
  FOR EACH ROW EXECUTE FUNCTION trial_delete();

-- ── trial_segment ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_segment_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  segment_number               INTEGER,
  label                        TEXT,
  start_date                   TEXT,
  end_date                     TEXT,
  notes                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS trial_segment_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  segment_number               INTEGER,
  label                        TEXT,
  start_date                   TEXT,
  end_date                     TEXT,
  notes                        TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW trial_segment AS
  SELECT s.* FROM trial_segment_synced s
  WHERE NOT EXISTS (SELECT 1 FROM trial_segment_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.trial_id, l.segment_number, l.label, l.start_date, l.end_date, l.notes, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM trial_segment_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION trial_segment_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_segment_local (id, legacy_id, company_id, trial_id, segment_number, label, start_date, end_date, notes, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.segment_number, NEW.label, NEW.start_date, NEW.end_date, NEW.notes, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_segment', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_segment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_segment_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_segment_local (id, legacy_id, company_id, trial_id, segment_number, label, start_date, end_date, notes, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.segment_number, NEW.label, NEW.start_date, NEW.end_date, NEW.notes, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    trial_id = EXCLUDED.trial_id,
    segment_number = EXCLUDED.segment_number,
    label = EXCLUDED.label,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    notes = EXCLUDED.notes,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_segment', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_segment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_segment_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_segment_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_segment', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'trial_segment');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_segment_insert_trg ON trial_segment;
DROP TRIGGER IF EXISTS trial_segment_update_trg ON trial_segment;
DROP TRIGGER IF EXISTS trial_segment_delete_trg ON trial_segment;
CREATE TRIGGER trial_segment_insert_trg INSTEAD OF INSERT ON trial_segment
  FOR EACH ROW EXECUTE FUNCTION trial_segment_insert();
CREATE TRIGGER trial_segment_update_trg INSTEAD OF UPDATE ON trial_segment
  FOR EACH ROW EXECUTE FUNCTION trial_segment_update();
CREATE TRIGGER trial_segment_delete_trg INSTEAD OF DELETE ON trial_segment
  FOR EACH ROW EXECUTE FUNCTION trial_segment_delete();

-- ── trial_service ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_service_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  service_id                   TEXT,
  segment_id                   TEXT,
  service_name                 TEXT,
  service_phase                TEXT,
  custom_description           TEXT,
  rate_type                    TEXT,
  rate                         NUMERIC,
  travel_eligible              TEXT,
  display_order                INTEGER,
  final_billing_method         TEXT,
  split_billing_at_threshold   BOOLEAN,
  start_date                   TEXT,
  end_date                     TEXT,
  days_before_trial            INTEGER,
  estimated_quantity           NUMERIC,
  estimated_total              NUMERIC,
  estimated_travel_hours       NUMERIC,
  pre_trial_estimated_hours    NUMERIC,
  projected_daily_revenue      NUMERIC,
  in_trial_projected_daily_revenue NUMERIC,
  pre_trial_projected_daily_revenue NUMERIC,
  updated_by                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS trial_service_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  service_id                   TEXT,
  segment_id                   TEXT,
  service_name                 TEXT,
  service_phase                TEXT,
  custom_description           TEXT,
  rate_type                    TEXT,
  rate                         NUMERIC,
  travel_eligible              TEXT,
  display_order                INTEGER,
  final_billing_method         TEXT,
  split_billing_at_threshold   BOOLEAN,
  start_date                   TEXT,
  end_date                     TEXT,
  days_before_trial            INTEGER,
  estimated_quantity           NUMERIC,
  estimated_total              NUMERIC,
  estimated_travel_hours       NUMERIC,
  pre_trial_estimated_hours    NUMERIC,
  projected_daily_revenue      NUMERIC,
  in_trial_projected_daily_revenue NUMERIC,
  pre_trial_projected_daily_revenue NUMERIC,
  updated_by                   TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW trial_service AS
  SELECT s.* FROM trial_service_synced s
  WHERE NOT EXISTS (SELECT 1 FROM trial_service_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.trial_id, l.service_id, l.segment_id, l.service_name, l.service_phase, l.custom_description, l.rate_type, l.rate, l.travel_eligible, l.display_order, l.final_billing_method, l.split_billing_at_threshold, l.start_date, l.end_date, l.days_before_trial, l.estimated_quantity, l.estimated_total, l.estimated_travel_hours, l.pre_trial_estimated_hours, l.projected_daily_revenue, l.in_trial_projected_daily_revenue, l.pre_trial_projected_daily_revenue, l.updated_by, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM trial_service_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION trial_service_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_local (id, legacy_id, company_id, trial_id, service_id, segment_id, service_name, service_phase, custom_description, rate_type, rate, travel_eligible, display_order, final_billing_method, split_billing_at_threshold, start_date, end_date, days_before_trial, estimated_quantity, estimated_total, estimated_travel_hours, pre_trial_estimated_hours, projected_daily_revenue, in_trial_projected_daily_revenue, pre_trial_projected_daily_revenue, updated_by, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.service_id, NEW.segment_id, NEW.service_name, NEW.service_phase, NEW.custom_description, NEW.rate_type, NEW.rate, NEW.travel_eligible, NEW.display_order, NEW.final_billing_method, NEW.split_billing_at_threshold, NEW.start_date, NEW.end_date, NEW.days_before_trial, NEW.estimated_quantity, NEW.estimated_total, NEW.estimated_travel_hours, NEW.pre_trial_estimated_hours, NEW.projected_daily_revenue, NEW.in_trial_projected_daily_revenue, NEW.pre_trial_projected_daily_revenue, NEW.updated_by, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_service');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_service_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_local (id, legacy_id, company_id, trial_id, service_id, segment_id, service_name, service_phase, custom_description, rate_type, rate, travel_eligible, display_order, final_billing_method, split_billing_at_threshold, start_date, end_date, days_before_trial, estimated_quantity, estimated_total, estimated_travel_hours, pre_trial_estimated_hours, projected_daily_revenue, in_trial_projected_daily_revenue, pre_trial_projected_daily_revenue, updated_by, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.service_id, NEW.segment_id, NEW.service_name, NEW.service_phase, NEW.custom_description, NEW.rate_type, NEW.rate, NEW.travel_eligible, NEW.display_order, NEW.final_billing_method, NEW.split_billing_at_threshold, NEW.start_date, NEW.end_date, NEW.days_before_trial, NEW.estimated_quantity, NEW.estimated_total, NEW.estimated_travel_hours, NEW.pre_trial_estimated_hours, NEW.projected_daily_revenue, NEW.in_trial_projected_daily_revenue, NEW.pre_trial_projected_daily_revenue, NEW.updated_by, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    trial_id = EXCLUDED.trial_id,
    service_id = EXCLUDED.service_id,
    segment_id = EXCLUDED.segment_id,
    service_name = EXCLUDED.service_name,
    service_phase = EXCLUDED.service_phase,
    custom_description = EXCLUDED.custom_description,
    rate_type = EXCLUDED.rate_type,
    rate = EXCLUDED.rate,
    travel_eligible = EXCLUDED.travel_eligible,
    display_order = EXCLUDED.display_order,
    final_billing_method = EXCLUDED.final_billing_method,
    split_billing_at_threshold = EXCLUDED.split_billing_at_threshold,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    days_before_trial = EXCLUDED.days_before_trial,
    estimated_quantity = EXCLUDED.estimated_quantity,
    estimated_total = EXCLUDED.estimated_total,
    estimated_travel_hours = EXCLUDED.estimated_travel_hours,
    pre_trial_estimated_hours = EXCLUDED.pre_trial_estimated_hours,
    projected_daily_revenue = EXCLUDED.projected_daily_revenue,
    in_trial_projected_daily_revenue = EXCLUDED.in_trial_projected_daily_revenue,
    pre_trial_projected_daily_revenue = EXCLUDED.pre_trial_projected_daily_revenue,
    updated_by = EXCLUDED.updated_by,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_service');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_service_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'trial_service');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_service_insert_trg ON trial_service;
DROP TRIGGER IF EXISTS trial_service_update_trg ON trial_service;
DROP TRIGGER IF EXISTS trial_service_delete_trg ON trial_service;
CREATE TRIGGER trial_service_insert_trg INSTEAD OF INSERT ON trial_service
  FOR EACH ROW EXECUTE FUNCTION trial_service_insert();
CREATE TRIGGER trial_service_update_trg INSTEAD OF UPDATE ON trial_service
  FOR EACH ROW EXECUTE FUNCTION trial_service_update();
CREATE TRIGGER trial_service_delete_trg INSTEAD OF DELETE ON trial_service
  FOR EACH ROW EXECUTE FUNCTION trial_service_delete();

-- ── trial_contact ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_contact_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  attorney_id                  TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS trial_contact_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  attorney_id                  TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW trial_contact AS
  SELECT s.* FROM trial_contact_synced s
  WHERE NOT EXISTS (SELECT 1 FROM trial_contact_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.trial_id, l.attorney_id, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM trial_contact_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION trial_contact_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_contact_local (id, legacy_id, company_id, trial_id, attorney_id, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.attorney_id, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_contact', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_contact');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_contact_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_contact_local (id, legacy_id, company_id, trial_id, attorney_id, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.attorney_id, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    trial_id = EXCLUDED.trial_id,
    attorney_id = EXCLUDED.attorney_id,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_contact', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_contact');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_contact_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_contact_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_contact', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'trial_contact');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_contact_insert_trg ON trial_contact;
DROP TRIGGER IF EXISTS trial_contact_update_trg ON trial_contact;
DROP TRIGGER IF EXISTS trial_contact_delete_trg ON trial_contact;
CREATE TRIGGER trial_contact_insert_trg INSTEAD OF INSERT ON trial_contact
  FOR EACH ROW EXECUTE FUNCTION trial_contact_insert();
CREATE TRIGGER trial_contact_update_trg INSTEAD OF UPDATE ON trial_contact
  FOR EACH ROW EXECUTE FUNCTION trial_contact_update();
CREATE TRIGGER trial_contact_delete_trg INSTEAD OF DELETE ON trial_contact
  FOR EACH ROW EXECUTE FUNCTION trial_contact_delete();

-- ── trial_service_assignment ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trial_service_assignment_synced (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  trial_service_id             TEXT,
  consultant_id                TEXT,
  subcontract_assignment_id    TEXT,
  google_calendar_event_id     TEXT,
  assigned_by                  TEXT,
  inactive_reason              TEXT,
  is_subcontractor             TEXT,
  status                       TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT
);

CREATE TABLE IF NOT EXISTS trial_service_assignment_local (
  id                           TEXT,
  legacy_id                    TEXT,
  company_id                   TEXT,
  trial_id                     TEXT,
  trial_service_id             TEXT,
  consultant_id                TEXT,
  subcontract_assignment_id    TEXT,
  google_calendar_event_id     TEXT,
  assigned_by                  TEXT,
  inactive_reason              TEXT,
  is_subcontractor             TEXT,
  status                       TEXT,
  created_at                   TEXT,
  updated_at                   TEXT,
  is_sample                    TEXT,
  created_by_id                TEXT,
  created_by                   TEXT,
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW trial_service_assignment AS
  SELECT s.* FROM trial_service_assignment_synced s
  WHERE NOT EXISTS (SELECT 1 FROM trial_service_assignment_local l WHERE l.id = s.id)
  UNION ALL
  SELECT l.id, l.legacy_id, l.company_id, l.trial_id, l.trial_service_id, l.consultant_id, l.subcontract_assignment_id, l.google_calendar_event_id, l.assigned_by, l.inactive_reason, l.is_subcontractor, l.status, l.created_at, l.updated_at, l.is_sample, l.created_by_id, l.created_by
  FROM trial_service_assignment_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION trial_service_assignment_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_assignment_local (id, legacy_id, company_id, trial_id, trial_service_id, consultant_id, subcontract_assignment_id, google_calendar_event_id, assigned_by, inactive_reason, is_subcontractor, status, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (COALESCE(NEW.id, gen_random_uuid()::text), NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.trial_service_id, NEW.consultant_id, NEW.subcontract_assignment_id, NEW.google_calendar_event_id, NEW.assigned_by, NEW.inactive_reason, NEW.is_subcontractor, NEW.status, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by);
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service_assignment', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_service_assignment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_service_assignment_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_assignment_local (id, legacy_id, company_id, trial_id, trial_service_id, consultant_id, subcontract_assignment_id, google_calendar_event_id, assigned_by, inactive_reason, is_subcontractor, status, created_at, updated_at, is_sample, created_by_id, created_by)
  VALUES (NEW.id, NEW.legacy_id, NEW.company_id, NEW.trial_id, NEW.trial_service_id, NEW.consultant_id, NEW.subcontract_assignment_id, NEW.google_calendar_event_id, NEW.assigned_by, NEW.inactive_reason, NEW.is_subcontractor, NEW.status, NEW.created_at, NEW.updated_at, NEW.is_sample, NEW.created_by_id, NEW.created_by)
  ON CONFLICT (id) DO UPDATE SET
    legacy_id = EXCLUDED.legacy_id,
    company_id = EXCLUDED.company_id,
    trial_id = EXCLUDED.trial_id,
    trial_service_id = EXCLUDED.trial_service_id,
    consultant_id = EXCLUDED.consultant_id,
    subcontract_assignment_id = EXCLUDED.subcontract_assignment_id,
    google_calendar_event_id = EXCLUDED.google_calendar_event_id,
    assigned_by = EXCLUDED.assigned_by,
    inactive_reason = EXCLUDED.inactive_reason,
    is_subcontractor = EXCLUDED.is_subcontractor,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at,
    is_sample = EXCLUDED.is_sample,
    created_by_id = EXCLUDED.created_by_id,
    created_by = EXCLUDED.created_by,
    is_deleted = false;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service_assignment', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', 'trial_service_assignment');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trial_service_assignment_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trial_service_assignment_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('trial_service_assignment', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', 'trial_service_assignment');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trial_service_assignment_insert_trg ON trial_service_assignment;
DROP TRIGGER IF EXISTS trial_service_assignment_update_trg ON trial_service_assignment;
DROP TRIGGER IF EXISTS trial_service_assignment_delete_trg ON trial_service_assignment;
CREATE TRIGGER trial_service_assignment_insert_trg INSTEAD OF INSERT ON trial_service_assignment
  FOR EACH ROW EXECUTE FUNCTION trial_service_assignment_insert();
CREATE TRIGGER trial_service_assignment_update_trg INSTEAD OF UPDATE ON trial_service_assignment
  FOR EACH ROW EXECUTE FUNCTION trial_service_assignment_update();
CREATE TRIGGER trial_service_assignment_delete_trg INSTEAD OF DELETE ON trial_service_assignment
  FOR EACH ROW EXECUTE FUNCTION trial_service_assignment_delete();
