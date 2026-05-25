#!/usr/bin/env node
/**
 * gen-pglite-schema.mjs — generate src/shared/db/local-schema.sql
 *
 * Reads:
 *   - src/shared/db/sync-config.ts  (text-parsed; no ts-node)
 *   - ../latest-data/supabase/migrations/*.sql
 *
 * Emits:
 *   - src/shared/db/local-schema.sql
 *
 * Per plan §0.11 / §0.12 / Change 16.
 *
 * Hard rules:
 *   - Self-hosted Supabase only.
 *   - HotSeatersMVP is the bible.
 *   - PGlite mirrors the relevant slice of the server schema. NEVER hand-edit
 *     the output file — edit sync-config.ts or the supabase migrations.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = join(REPO_ROOT, 'src/shared/db/sync-config.ts');
const OUT_PATH = join(REPO_ROOT, 'src/shared/db/local-schema.sql');
// Resolve migrations dir — check CI layout (./latest-data inside repo) first,
// then fall back to local dev layout (../latest-data as sibling).
function findMigrationsDir(repoRoot) {
  const candidates = [
    resolve(repoRoot, 'latest-data/supabase/migrations'),   // CI: checked out inside repo
    resolve(repoRoot, '../latest-data/supabase/migrations'), // local dev: sibling
    resolve(repoRoot, '../../latest-data/supabase/migrations'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0]; // let the later check produce the friendly error
}
const MIGRATIONS_DIR = findMigrationsDir(REPO_ROOT);

// ── server type → PGlite column type ───────────────────────────────────────
const TYPE_MAP = {
  uuid: 'TEXT',
  text: 'TEXT',
  timestamptz: 'TEXT',
  timestamp: 'TEXT',
  date: 'TEXT',
  integer: 'INTEGER',
  int: 'INTEGER',
  bigint: 'INTEGER',
  smallint: 'INTEGER',
  numeric: 'NUMERIC',
  decimal: 'NUMERIC',
  real: 'NUMERIC',
  'double precision': 'NUMERIC',
  boolean: 'BOOLEAN',
  bool: 'BOOLEAN',
  jsonb: 'JSONB',
  json: 'JSONB',
};

function mapType(serverType) {
  const t = serverType.trim().toLowerCase();
  // Strip parameters like NUMERIC(10,2)
  const base = t.replace(/\(.+\)/, '').trim();
  if (TYPE_MAP[base]) return TYPE_MAP[base];
  // Heuristic fallback — anything text-like
  return 'TEXT';
}

// ── parse sync-config.ts (text mode) ───────────────────────────────────────
/**
 * Extracts entity names + tier + tenantColumn from the TS source. We avoid
 * spinning up ts-node by relying on the file's known shape (object literal
 * with `name:`, `tier:`, `tenantColumn:` keys).
 */
async function parseSyncConfig() {
  const src = await readFile(CONFIG_PATH, 'utf8');
  const entries = [];

  // Find the SYNC_CONFIG array body
  const arrMatch = src.match(/SYNC_CONFIG[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!arrMatch) throw new Error('Could not locate SYNC_CONFIG array');
  const body = arrMatch[1];

  // Split on top-level objects: `{ ... }`. Naive but adequate for our shape.
  const objRe = /\{\s*([\s\S]*?)\s*\}\s*,?\s*(?=\{|$)/g;
  let m;
  while ((m = objRe.exec(body)) !== null) {
    const obj = m[1];
    const name = (obj.match(/name:\s*['"]([^'"]+)['"]/) || [])[1];
    const tier = (obj.match(/tier:\s*['"]([AB])['"]/) || [])[1];
    const tenantMatch = obj.match(/tenantColumn:\s*(null|['"][^'"]+['"])/);
    const tenantColumn = tenantMatch
      ? tenantMatch[1] === 'null'
        ? null
        : tenantMatch[1].slice(1, -1)
      : null;
    if (name && tier) entries.push({ name, tier, tenantColumn });
  }
  if (!entries.length) throw new Error('SYNC_CONFIG parsed empty');
  return entries;
}

// ── read all migration files, in order ─────────────────────────────────────
async function readMigrations() {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
  if (!files.length) throw new Error(`No migrations under ${MIGRATIONS_DIR}`);
  const blobs = await Promise.all(
    files.map(async (f) => ({
      file: f,
      sql: await readFile(join(MIGRATIONS_DIR, f), 'utf8'),
      ts: f.split('_')[0],
    }))
  );
  return blobs;
}

// ── extract CREATE TABLE for a given entity ────────────────────────────────
/**
 * Returns { columns: [{ name, pgliteType, isReserved }] } or null if not found.
 * Matches `CREATE TABLE [IF NOT EXISTS] [public.]<name> ( ... );`
 */
function extractColumns(sql, entity) {
  const re = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${entity}\\s*\\(([\\s\\S]*?)\\n\\)\\s*;`,
    'i'
  );
  const m = sql.match(re);
  if (!m) return null;
  const body = m[1];

  const columns = [];
  // Split lines; each column line starts with an identifier (possibly quoted).
  // Skip lines that begin with constraint keywords.
  const lines = body.split('\n');
  for (let raw of lines) {
    const line = raw.split('--')[0].trim().replace(/,$/, '');
    if (!line) continue;
    // Skip constraint definitions
    if (/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\b/i.test(line)) {
      continue;
    }
    // Match: <ident-or-quoted>  <type>  [rest...]
    const colMatch = line.match(/^("?[a-zA-Z_][a-zA-Z0-9_]*"?)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?(?:\([^)]*\))?)/);
    if (!colMatch) continue;
    const rawName = colMatch[1];
    const isReserved = rawName.startsWith('"');
    const name = isReserved ? rawName.slice(1, -1) : rawName;
    columns.push({
      name,
      quoted: isReserved ? `"${name}"` : name,
      pgliteType: mapType(colMatch[2]),
    });
  }
  return { columns };
}

// ── emit SQL for one Tier-A entity ─────────────────────────────────────────
function emitTierA(entity, cols) {
  const colDefs = cols
    .map((c) => `  ${c.quoted.padEnd(28)} ${c.pgliteType}`)
    .join(',\n');
  const colList = cols.map((c) => c.quoted).join(', ');
  const colListWithL = cols.map((c) => `l.${c.quoted}`).join(', ');
  const newList = cols.map((c) => `NEW.${c.quoted}`).join(', ');
  const newListWithCoalesceId = cols
    .map((c) => (c.name === 'id' ? `COALESCE(NEW.${c.quoted}, gen_random_uuid()::text)` : `NEW.${c.quoted}`))
    .join(', ');
  const updateSet = cols
    .filter((c) => c.name !== 'id' && c.name !== 'created_at')
    .map((c) => `    ${c.quoted} = EXCLUDED.${c.quoted}`)
    .concat(['    is_deleted = false'])
    .join(',\n');

  return `
-- ── ${entity} ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ${entity}_synced (
${colDefs}
);

CREATE TABLE IF NOT EXISTS ${entity}_local (
${colDefs},
  is_deleted                   BOOLEAN NOT NULL DEFAULT false
);

CREATE OR REPLACE VIEW ${entity} AS
  SELECT s.* FROM ${entity}_synced s
  WHERE NOT EXISTS (SELECT 1 FROM ${entity}_local l WHERE l.id = s.id)
  UNION ALL
  SELECT ${colListWithL}
  FROM ${entity}_local l
  WHERE NOT l.is_deleted;

CREATE OR REPLACE FUNCTION ${entity}_insert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ${entity}_local (${colList})
  VALUES (${newListWithCoalesceId});
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('${entity}', 'insert', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', '${entity}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ${entity}_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ${entity}_local (${colList})
  VALUES (${newList})
  ON CONFLICT (id) DO UPDATE SET
${updateSet};
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('${entity}', 'update', NEW.id, to_jsonb(NEW));
  PERFORM pg_notify('local_write', '${entity}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ${entity}_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ${entity}_local (id, is_deleted) VALUES (OLD.id, true)
  ON CONFLICT (id) DO UPDATE SET is_deleted = true;
  INSERT INTO local_writes (entity, operation, row_id, payload)
  VALUES ('${entity}', 'delete', OLD.id, NULL);
  PERFORM pg_notify('local_write', '${entity}');
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ${entity}_insert_trg ON ${entity};
DROP TRIGGER IF EXISTS ${entity}_update_trg ON ${entity};
DROP TRIGGER IF EXISTS ${entity}_delete_trg ON ${entity};
CREATE TRIGGER ${entity}_insert_trg INSTEAD OF INSERT ON ${entity}
  FOR EACH ROW EXECUTE FUNCTION ${entity}_insert();
CREATE TRIGGER ${entity}_update_trg INSTEAD OF UPDATE ON ${entity}
  FOR EACH ROW EXECUTE FUNCTION ${entity}_update();
CREATE TRIGGER ${entity}_delete_trg INSTEAD OF DELETE ON ${entity}
  FOR EACH ROW EXECUTE FUNCTION ${entity}_delete();
`;
}

// ── emit Tier-B (synced-only) ──────────────────────────────────────────────
function emitTierB(entity, cols) {
  const colDefs = cols
    .map((c) => `  ${c.quoted.padEnd(28)} ${c.pgliteType}`)
    .join(',\n');
  return `
-- ── ${entity} (Tier B — read-only) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ${entity}_synced (
${colDefs}
);

CREATE OR REPLACE VIEW ${entity} AS SELECT * FROM ${entity}_synced;
`;
}

// ── header / preamble ──────────────────────────────────────────────────────
function emitHeader(schemaVersion) {
  return `-- GENERATED by scripts/gen-pglite-schema.mjs from supabase migrations. DO NOT HAND-EDIT.
-- =============================================================================
-- local-schema.sql — PGlite (in-browser Postgres) local schema for
-- hotseaters-ultimate.
--
-- Implements ElectricSQL's "through-the-database" write pattern. For each
-- Tier-A entity (sync-config.ts) there are three objects:
--
--   <entity>_synced   immutable — Electric writes server rows here
--   <entity>_local    shadow    — optimistic local writes live here
--   <entity>          view      — synced + local merged; the app reads/writes
--
-- INSTEAD OF triggers on the view route writes to <entity>_local and append
-- a row to \`local_writes\`. A pg_notify on \`local_write\` drives the
-- write-path sync utility, which POSTs pending writes to Supabase and on
-- confirmation clears the optimistic row.
--
-- Self-hosted Supabase only. HotSeatersMVP is the bible.
-- Generated from migrations through ${schemaVersion}.
-- =============================================================================

CREATE TABLE IF NOT EXISTS _pglite_schema_version (
  id      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version TEXT    NOT NULL
);

INSERT INTO _pglite_schema_version (id, version)
  VALUES (1, '${schemaVersion}')
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
-- TIER-A / TIER-B ENTITIES (FK-dependency order)
-- =============================================================================
`;
}

// ── EMIT_ORDER parsing ─────────────────────────────────────────────────────
async function parseEmitOrder() {
  const src = await readFile(CONFIG_PATH, 'utf8');
  const m = src.match(/EMIT_ORDER[^=]*=\s*\[([\s\S]*?)\]/);
  if (!m) return null;
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.error(`[gen-pglite-schema] migrations dir not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const config = await parseSyncConfig();
  const emitOrder = (await parseEmitOrder()) || config.map((c) => c.name);
  const migrations = await readMigrations();

  // Schema version = latest migration's timestamp prefix.
  const schemaVersion = migrations[migrations.length - 1].ts;

  // Build the SQL.
  const ordered = emitOrder
    .map((name) => config.find((c) => c.name === name))
    .filter(Boolean);

  // Sanity: any entity in config not in EMIT_ORDER → append at end.
  for (const c of config) {
    if (!ordered.find((o) => o.name === c.name)) ordered.push(c);
  }

  let sql = emitHeader(schemaVersion);

  const allMigrations = migrations.map((m) => m.sql).join('\n');

  for (const entry of ordered) {
    const found = extractColumns(allMigrations, entry.name);
    if (!found) {
      console.error(
        `[gen-pglite-schema] FATAL: no CREATE TABLE for entity '${entry.name}' (tier ${entry.tier})`
      );
      process.exit(1);
    }
    console.log(
      `[gen-pglite-schema] ${entry.name} (tier ${entry.tier}): ${found.columns.length} columns`
    );
    sql +=
      entry.tier === 'A'
        ? emitTierA(entry.name, found.columns)
        : emitTierB(entry.name, found.columns);
  }

  // Idempotency: byte-equal short-circuit.
  if (existsSync(OUT_PATH)) {
    const current = await readFile(OUT_PATH, 'utf8');
    if (current === sql) {
      console.log('[gen-pglite-schema] unchanged');
      process.exit(0);
    }
  }

  await writeFile(OUT_PATH, sql, 'utf8');
  console.log(`[gen-pglite-schema] wrote ${OUT_PATH} (version=${schemaVersion})`);
}

main().catch((err) => {
  console.error('[gen-pglite-schema] failed:', err);
  process.exit(1);
});
