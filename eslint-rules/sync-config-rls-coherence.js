// =============================================================================
// eslint-rules/sync-config-rls-coherence.js
//
// Custom ESLint rule enforcing RULE 5 from constraints.md:
//   "PGlite has no RLS; Electric shapes are RLS-coherent. Shape WHERE
//    predicates ⊆ corresponding RLS policies."
//
// Concretely: every entity declared in `src/shared/db/sync-config.ts`
// (SYNC_CONFIG) MUST have at least one `CREATE POLICY ... ON public.<entity>`
// in the RLS migration file(s) under
// `../latest-data/supabase/migrations/*_rls_policies*.sql`.
//
// Missing policy = data could leak through Electric to PGlite without
// server-side gate. We fail CI loudly.
//
// The rule fires once per project (on `Program:exit` of `sync-config.ts`
// itself, to avoid duplicate reports across files).
//
// Hard constraints: self-hosted Supabase only; HotSeatersMVP is the bible.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const _RULE_NAME = 'sync-config-rls-coherence';

/**
 * Resolve the path to the RLS migration(s) relative to this rule file.
 * The repo layout is documented in `constraints.md` RULE 9.
 */
function findRlsMigrations(repoRoot) {
  const candidates = [
    // CI layout: latest-data is checked out INSIDE the repo at ./latest-data/
    path.resolve(repoRoot, 'latest-data/supabase/migrations'),
    // Local dev layout: latest-data is a sibling of the repo root
    path.resolve(repoRoot, '../latest-data/supabase/migrations'),
    path.resolve(repoRoot, '../../latest-data/supabase/migrations'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return fs
        .readdirSync(dir)
        .filter((f) => /rls_policies.*\.sql$/.test(f))
        .map((f) => path.join(dir, f));
    }
  }
  return [];
}

/**
 * Parse entity names + tiers out of the SYNC_CONFIG literal.
 * Tolerant to formatting; relies on `name: '<id>'` and `tier: '<A|B>'`
 * sitting close together inside each object literal.
 */
function parseSyncConfig(source) {
  const entities = [];
  // Match each entity object block.
  const blockRe = /\{[^{}]*?name:\s*'([a-z_][a-z0-9_]*)'[^{}]*?tier:\s*'([AB])'/g;
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    entities.push({ name: m[1], tier: m[2] });
  }
  return entities;
}

/**
 * Parse the set of tables that have at least one `CREATE POLICY ... ON
 * public.<table>` declaration (static) OR appear in a dynamic DO-block loop
 * pattern like `FOREACH t IN ARRAY ARRAY['table_a', 'table_b']` paired with
 * `ENABLE ROW LEVEL SECURITY` on those same tables.
 *
 * The dynamic pattern is used in latest-data to apply identical policies to
 * sibling tables (trial_segment / trial_service / trial_contact) without
 * repeating verbose SQL. The static regex can't see inside EXECUTE format(),
 * so we detect the array-loop pattern as a fallback.
 */
function parsePoliciedTables(sqlSources) {
  const tables = new Set();

  // Pattern 1: static CREATE POLICY ... ON public.<table>
  const staticRe = /CREATE\s+POLICY\s+\S+\s+ON\s+public\.([a-z_][a-z0-9_]*)/gi;

  // Pattern 2: dynamic DO-block FOREACH loop with ARRAY['t1', 't2', ...]
  // paired with `ENABLE ROW LEVEL SECURITY` nearby. We detect the array list
  // and treat those tables as covered when they also have an ENABLE RLS stmt.
  const arrayLoopRe = /FOREACH\s+\w+\s+IN\s+ARRAY\s+ARRAY\['([^']+(?:'\s*,\s*'[^']+)*)'\]/gi;

  for (const src of sqlSources) {
    let m;

    // Collect static policies
    staticRe.lastIndex = 0;
    while ((m = staticRe.exec(src)) !== null) {
      tables.add(m[1].toLowerCase());
    }

    // Collect dynamic-loop tables (only if they also have ENABLE ROW LEVEL SECURITY)
    arrayLoopRe.lastIndex = 0;
    while ((m = arrayLoopRe.exec(src)) !== null) {
      const loopTableNames = m[1].split(/'\s*,\s*'/).map((t) => t.trim().toLowerCase());
      for (const t of loopTableNames) {
        // Verify ENABLE ROW LEVEL SECURITY exists for this table in the same file
        if (new RegExp(`ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY[^;]*?ON\\s+public\\.${t}|ALTER\\s+TABLE\\s+public\\.${t}[^;]*?ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i').test(src)) {
          tables.add(t);
        }
      }
    }
  }
  return tables;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Every entity in SYNC_CONFIG must have a matching CREATE POLICY in the RLS migrations.',
    },
    schema: [],
    messages: {
      missingPolicy:
        "RULE 5 violation: '{{name}}' (tier {{tier}}) is in SYNC_CONFIG but has no " +
        'CREATE POLICY ... ON public.{{name}} in the RLS migrations. PGlite has no RLS — ' +
        'the server-side policy is the only gate. Add policies in ' +
        'latest-data/supabase/migrations/<ts>_rls_policies.sql before syncing this entity.',
      missingRlsFile:
        "Could not locate any *_rls_policies*.sql under latest-data/supabase/migrations " +
        "(checked ./latest-data/, ../latest-data/, ../../latest-data/). " +
        'Sync↔RLS coherence cannot be verified.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    // Only run once, anchored to sync-config.ts itself.
    if (!filename.endsWith(path.join('shared', 'db', 'sync-config.ts'))) {
      return {};
    }
    return {
      'Program:exit'(node) {
        const repoRoot = path.resolve(path.dirname(filename), '..', '..', '..');
        const sqlFiles = findRlsMigrations(repoRoot);
        if (sqlFiles.length === 0) {
          context.report({ node, messageId: 'missingRlsFile' });
          return;
        }
        const sqlSources = sqlFiles.map((f) => fs.readFileSync(f, 'utf8'));
        const policied = parsePoliciedTables(sqlSources);
        const source = context.sourceCode.getText();
        const entities = parseSyncConfig(source);
        for (const { name, tier } of entities) {
          if (!policied.has(name)) {
            context.report({
              node,
              messageId: 'missingPolicy',
              data: { name, tier },
            });
          }
        }
      },
    };
  },
};
