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
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CONFIG_PATH = join(REPO_ROOT, 'src/shared/db/sync-config.ts');
const OUT_PATH = join(REPO_ROOT, 'src/shared/db/local-schema.sql');
const OUT_COMMON_PATH = join(REPO_ROOT, 'src/shared/db/local-schema-common.sql');
const OUT_USER_PATH = join(REPO_ROOT, 'src/shared/db/local-schema-user.sql');
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
 * Strip `//` line comments and block comments from TS/JS source while
 * preserving string and template literals (so a `//` inside a `notes: '...'`
 * value is never mistaken for a comment, and a comment is never mistaken for
 * code). Returns source of identical length with comment bytes replaced by
 * spaces — keeping offsets stable so any downstream slicing still lines up.
 *
 * This exists because the old regex object-splitter broke whenever a comment
 * sat *between* two SYNC_CONFIG entries (`},\n  // x\n  {`): the `(?=\{|$)`
 * lookahead would merge the two literals into one capture and silently drop
 * the second entity (the `lead` table, in change-S02). Removing comments
 * up front makes the brace-depth scanner immune to comment placement.
 */
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];
    // String / template literals — copy verbatim, honoring escapes.
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      out += ch;
      i += 1;
      while (i < n) {
        const c = src[i];
        out += c;
        if (c === '\\') {
          // copy the escaped char too
          if (i + 1 < n) {
            out += src[i + 1];
            i += 2;
            continue;
          }
        }
        i += 1;
        if (c === quote) break;
      }
      continue;
    }
    // Line comment — replace with spaces up to (not including) the newline.
    if (ch === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    // Block comment — replace with spaces, preserving newlines for line counts.
    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i < n) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Split an array body into its top-level `{ ... }` object-literal slices using
 * a brace-depth scanner that ignores braces inside string/template literals.
 * The input MUST already be comment-stripped (see `stripComments`). Returns the
 * raw text of each top-level object (without the surrounding braces).
 */
function splitTopLevelObjects(body) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  const n = body.length;
  while (i < n) {
    const ch = body[i];
    // Skip over string/template literals so braces inside them don't count.
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < n) {
        const c = body[i];
        if (c === '\\') {
          i += 2;
          continue;
        }
        i += 1;
        if (c === quote) break;
      }
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(body.slice(start, i));
        start = -1;
      }
    }
    i += 1;
  }
  return objects;
}

/**
 * Count top-level object literals in an (already comment-stripped) array body
 * by scanning for braces that open at depth 0, ignoring string contents. Used
 * as a parse-integrity assertion: the number of parsed entries MUST equal this.
 */
function countTopLevelObjects(body) {
  return splitTopLevelObjects(body).length;
}

/**
 * Parse the literal text of one SYNC_CONFIG object into our minimal shape.
 * Returns null when the slice has neither a `name` nor a `tier` (e.g. an empty
 * tail slice) so callers can distinguish "not an entry" from "malformed entry".
 */
function parseEntry(obj) {
  const name = (obj.match(/name:\s*['"]([^'"]+)['"]/) || [])[1];
  const tier = (obj.match(/tier:\s*['"]([AB])['"]/) || [])[1];
  const tenantMatch = obj.match(/tenantColumn:\s*(null|['"][^'"]+['"])/);
  const tenantColumn = tenantMatch
    ? tenantMatch[1] === 'null'
      ? null
      : tenantMatch[1].slice(1, -1)
    : null;
  // S06: which runtime file the DDL routes into, and whether a pgvector
  // `embedding` column rides this entity's synced/local tables.
  const domain =
    (obj.match(/domain:\s*['"](common|user)['"]/) || [])[1] || 'user';
  const embMatch = obj.match(/embedding:\s*\{\s*dim:\s*(\d+)\s*\}/);
  const embedding = embMatch ? { dim: Number(embMatch[1]) } : null;
  if (!name && !tier) return null;
  return { name, tier, tenantColumn, domain, embedding };
}

/**
 * Extract entity name + tier + tenantColumn from SYNC_CONFIG source text.
 *
 * Robustness contract (the whole point of this function existing):
 *   1. Comments anywhere — including BETWEEN two object literals — must never
 *      merge or drop an entry. Achieved by stripping comments first.
 *   2. The parse is verified: the number of `{name, tier}` entries MUST equal
 *      the number of top-level `{ ... }` object literals in the array body. A
 *      mismatch means an entry was silently dropped or malformed, and we throw
 *      loudly rather than emit an incomplete schema.
 *
 * @param {string} src  full sync-config.ts source text
 * @returns {{ name: string, tier: string, tenantColumn: string | null }[]}
 */
function parseSyncConfigSource(src) {
  // Strip comments first so neither object-splitting nor key-matching can be
  // fooled by a `//` between entries or a `//` inside a `notes:` string.
  const clean = stripComments(src);

  // Find the SYNC_CONFIG array body in the comment-stripped source.
  const arrMatch = clean.match(/SYNC_CONFIG[^=]*=\s*\[([\s\S]*?)\n\];/);
  if (!arrMatch) throw new Error('Could not locate SYNC_CONFIG array');
  const body = arrMatch[1];

  const objectSlices = splitTopLevelObjects(body);
  const entries = [];
  for (const slice of objectSlices) {
    const entry = parseEntry(slice);
    if (entry && entry.name && entry.tier) entries.push(entry);
  }

  if (!entries.length) throw new Error('SYNC_CONFIG parsed empty');

  // Parse-integrity assertion: every top-level object literal must have
  // yielded a {name, tier} entry. If counts diverge, an entry was dropped or
  // malformed — fail loudly instead of silently emitting an incomplete schema.
  const objectCount = objectSlices.length;
  if (entries.length !== objectCount) {
    throw new Error(
      `SYNC_CONFIG parse mismatch: found ${objectCount} object literal(s) in ` +
        `the array but parsed ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} ` +
        `with both name + tier. An entry was dropped or is malformed (missing ` +
        `name/tier, or tier not 'A'/'B'). Refusing to emit an incomplete schema.`,
    );
  }

  return entries;
}

async function parseSyncConfig() {
  const src = await readFile(CONFIG_PATH, 'utf8');
  return parseSyncConfigSource(src);
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
    // Match: <ident-or-quoted>  <type>  [modifiers...]
    // The type is EITHER the two-word `double precision` OR a single word with
    // an optional `(...)` parameter. We must NOT let an optional second word
    // greedily swallow modifier keywords like `NOT NULL` / `PRIMARY KEY` —
    // that produced `BOOLEAN NOT` → unmapped → TEXT (the is_active/is_default
    // regression). `double precision` is the only multi-word type we emit.
    const colMatch = line.match(
      /^("?[a-zA-Z_][a-zA-Z0-9_]*"?)\s+(double\s+precision|[A-Za-z]+(?:\([^)]*\))?)/i,
    );
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
function emitTierA(entity, cols, embedding) {
  // S06: server-generated embeddings sync as an ordinary column. Append a
  // pgvector column so it rides the same synced/local/view/trigger plumbing as
  // every other column (no special-casing downstream).
  if (embedding) {
    cols = [
      ...cols,
      { name: 'embedding', quoted: 'embedding', pgliteType: `vector(${embedding.dim})` },
    ];
  }
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
function emitTierB(entity, cols, embedding) {
  if (embedding) {
    cols = [
      ...cols,
      { name: 'embedding', quoted: 'embedding', pgliteType: `vector(${embedding.dim})` },
    ];
  }
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
const DO_NOT_EDIT =
  '-- GENERATED by scripts/gen-pglite-schema.mjs from supabase migrations. DO NOT HAND-EDIT.';

/**
 * Infra preamble — version row, sync meta, the write-ahead queue, and (when any
 * synced entity carries an embedding) the pgvector extension. Lives in the
 * COMMON file (applied first) and in the full reference file.
 */
function emitInfraPreamble(schemaVersion, needsVector) {
  const vectorExt = needsVector
    ? `-- pgvector for local semantic search (S06). Embeddings are server-generated
-- and sync as ordinary vector columns; similarity runs locally via <=>.
CREATE EXTENSION IF NOT EXISTS vector;

`
    : '';
  return `${vectorExt}CREATE TABLE IF NOT EXISTS _pglite_schema_version (
  id      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version TEXT    NOT NULL
);

-- DO NOTHING (not DO UPDATE): the boot-time migration check in
-- pglite-client.ts reads the STORED version AFTER re-applying this schema and
-- compares it to BUNDLED_PGLITE_SCHEMA_VERSION. Overwriting it here would make
-- the stored version always equal the bundled one, so a schema upgrade would
-- never be detected. Preserve the prior version; pglite-client stamps the new
-- one explicitly once the drop/re-hydrate migration has run.
INSERT INTO _pglite_schema_version (id, version)
  VALUES (1, '${schemaVersion}')
  ON CONFLICT (id) DO NOTHING;

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
`;
}

const THRU_DB_BLURB = `-- Implements ElectricSQL's "through-the-database" write pattern. For each
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
-- Self-hosted Supabase only. HotSeatersMVP is the bible.`;

// Full reference file (committed; CI drift gate runs against it).
function emitFullHeader(schemaVersion, needsVector) {
  return `${DO_NOT_EDIT}
-- =============================================================================
-- local-schema.sql — FULL PGlite local schema (reference + CI drift gate).
-- The RUNTIME applies local-schema-common.sql then local-schema-user.sql;
-- this file is the union of both and is NOT loaded directly. All three are
-- generated together from sync-config.ts — there is no hand-curation step.
--
${THRU_DB_BLURB}
-- Generated from migrations through ${schemaVersion}.
-- =============================================================================

${emitInfraPreamble(schemaVersion, needsVector)}
-- =============================================================================
-- TIER-A / TIER-B ENTITIES (FK-dependency order)
-- =============================================================================
`;
}

// COMMON runtime file — infra + tenant-agnostic / system tables. Applied first.
function emitCommonHeader(schemaVersion, needsVector) {
  return `${DO_NOT_EDIT}
-- =============================================================================
-- local-schema-common.sql — REFERENCE / SYSTEM tables + infra for
-- hotseaters-ultimate. Applied FIRST on every per-user PGlite first-boot
-- (change-403 §403.b). Carries the version row, sync meta, the write-ahead
-- queue, and the system/reference entities (domain:'common' in sync-config.ts).
--
${THRU_DB_BLURB}
-- Generated from migrations through ${schemaVersion}.
-- =============================================================================

${emitInfraPreamble(schemaVersion, needsVector)}
-- =============================================================================
-- COMMON (domain:'common') ENTITIES
-- =============================================================================
`;
}

// USER runtime file — tenant tables. Applied second (after common).
function emitUserHeader(schemaVersion) {
  return `${DO_NOT_EDIT}
-- =============================================================================
-- local-schema-user.sql — TENANTED tables for hotseaters-ultimate. Applied
-- SECOND on every per-user PGlite first-boot (change-403 §403.b), after
-- local-schema-common.sql (which defines local_writes + the infra this file's
-- triggers reference). Carries the tenant entities (domain:'user', the
-- default, in sync-config.ts).
--
${THRU_DB_BLURB}
-- Generated from migrations through ${schemaVersion}.
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
  // Strict mode: fail hard if migrations are missing. Used by CI's
  // `gen:pglite-schema:check` drift gate. Off by default so a developer
  // building the app without a `latest-data` checkout gets a soft warning
  // + uses the already-committed `local-schema.sql` (the schema that
  // ships in the bundle is the *committed* file, not whatever this script
  // would emit). The app has no runtime dependency on the migrations dir.
  const strict =
    process.env.PGLITE_SCHEMA_STRICT === '1' ||
    process.argv.includes('--strict');

  if (!existsSync(MIGRATIONS_DIR)) {
    if (strict) {
      console.error(
        `[gen-pglite-schema] migrations dir not found: ${MIGRATIONS_DIR}\n` +
          `[gen-pglite-schema] (STRICT mode — set PGLITE_SCHEMA_STRICT=0 or drop --strict to soft-warn instead)`,
      );
      process.exit(1);
    }
    console.warn(
      `[gen-pglite-schema] migrations dir not found: ${MIGRATIONS_DIR}\n` +
        `[gen-pglite-schema] Skipping regeneration; using committed src/shared/db/local-schema.sql as-is.\n` +
        `[gen-pglite-schema] To regenerate, place the supabase migrations at one of:\n` +
        `[gen-pglite-schema]   - hotseaters-ultimate/latest-data/supabase/migrations/ (vendored)\n` +
        `[gen-pglite-schema]   - ../latest-data/supabase/migrations/ (sibling checkout)\n` +
        `[gen-pglite-schema] CI invokes this script with --strict via gen:pglite-schema:check; that gate enforces non-drift.`,
    );
    if (!existsSync(OUT_PATH)) {
      console.error(
        `[gen-pglite-schema] FATAL: no migrations AND no committed ${OUT_PATH}. ` +
          `Cannot proceed — the runtime needs this file. Either commit a baseline or vendor migrations.`,
      );
      process.exit(1);
    }
    return; // soft no-op; committed local-schema.sql wins
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

  const allMigrations = migrations.map((m) => m.sql).join('\n');
  const needsVector = ordered.some((e) => e.embedding);

  // Emit each entity's DDL once, tagged with its domain so we can route it into
  // the common vs user runtime file. The full file is the union (reference +
  // CI drift gate).
  const commonBody = [];
  const userBody = [];
  for (const entry of ordered) {
    const found = extractColumns(allMigrations, entry.name);
    if (!found) {
      console.error(
        `[gen-pglite-schema] FATAL: no CREATE TABLE for entity '${entry.name}' (tier ${entry.tier})`
      );
      process.exit(1);
    }
    const ddl =
      entry.tier === 'A'
        ? emitTierA(entry.name, found.columns, entry.embedding)
        : emitTierB(entry.name, found.columns, entry.embedding);
    console.log(
      `[gen-pglite-schema] ${entry.name} (tier ${entry.tier}, domain ${entry.domain}` +
        `${entry.embedding ? `, embedding vector(${entry.embedding.dim})` : ''}): ` +
        `${found.columns.length} columns`,
    );
    if (entry.domain === 'common') commonBody.push(ddl);
    else userBody.push(ddl);
  }

  const fullSql =
    emitFullHeader(schemaVersion, needsVector) +
    commonBody.join('') +
    userBody.join('');
  const commonSql = emitCommonHeader(schemaVersion, needsVector) + commonBody.join('');
  const userSql = emitUserHeader(schemaVersion) + userBody.join('');

  const targets = [
    { path: OUT_PATH, sql: fullSql, label: 'local-schema.sql' },
    { path: OUT_COMMON_PATH, sql: commonSql, label: 'local-schema-common.sql' },
    { path: OUT_USER_PATH, sql: userSql, label: 'local-schema-user.sql' },
  ];

  let wrote = 0;
  for (const t of targets) {
    if (existsSync(t.path)) {
      const current = await readFile(t.path, 'utf8');
      if (current === t.sql) {
        console.log(`[gen-pglite-schema] ${t.label} unchanged`);
        continue;
      }
    }
    await writeFile(t.path, t.sql, 'utf8');
    console.log(`[gen-pglite-schema] wrote ${t.label} (version=${schemaVersion})`);
    wrote++;
  }
  if (wrote === 0) console.log('[gen-pglite-schema] all files unchanged');
}

// Exported for unit testing (src/shared/db/__tests__/gen-pglite-schema.spec.ts).
// These are pure functions with no I/O.
export {
  stripComments,
  splitTopLevelObjects,
  countTopLevelObjects,
  parseEntry,
  parseSyncConfigSource,
};

// Only run the generator when invoked directly (`node scripts/gen-pglite-schema.mjs`),
// not when imported by a test. Comparing the resolved module URL to argv[1]
// avoids triggering `main()` + `process.exit` on import.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error('[gen-pglite-schema] failed:', err);
    process.exit(1);
  });
}
