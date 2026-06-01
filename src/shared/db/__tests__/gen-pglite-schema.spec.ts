/**
 * gen-pglite-schema.spec.ts — guards the SYNC_CONFIG parser in
 * `scripts/gen-pglite-schema.mjs` against the two hazards discovered while
 * adding tables in change-S02:
 *
 *   1. A comment placed BETWEEN two array object literals (`},\n  // x\n  {`)
 *      used to break the regex lookahead, merging two entries into one capture
 *      and silently dropping the second entity (the `lead` table dropped from
 *      local-schema.sql with no error).
 *   2. The emit loop had no parse-integrity check, so a dropped entry went
 *      unnoticed until a manual grep caught it.
 *
 * The parser is now comment-stripped + brace-depth scanned, with a hard
 * assertion that #parsed entries == #top-level object literals.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Import the pure, exported helpers from the generator script directly.
// The generator is plain `.mjs` with no type declarations, so the import is
// untyped (`any`); we re-type its surface locally below to keep the spec under
// strict settings (noImplicitAny / noUncheckedIndexedAccess).
// @ts-expect-error — no .d.ts for the .mjs generator script (intentional)
import * as gen from '../../../../scripts/gen-pglite-schema.mjs';

interface ParsedEntry {
  name: string;
  tier: string;
  tenantColumn: string | null;
}

const stripComments = gen.stripComments as (src: string) => string;
const splitTopLevelObjects = gen.splitTopLevelObjects as (
  body: string,
) => string[];
const countTopLevelObjects = gen.countTopLevelObjects as (
  body: string,
) => number;
const parseSyncConfigSource = gen.parseSyncConfigSource as (
  src: string,
) => ParsedEntry[];

/** Wrap object-literal text in the minimal SYNC_CONFIG array shell the parser expects. */
function wrapConfig(arrayBody: string): string {
  return `export const SYNC_CONFIG: SyncEntityConfig[] = [\n${arrayBody}\n];\n`;
}

describe('gen-pglite-schema SYNC_CONFIG parser', () => {
  it('parses BOTH entries when a comment sits between two object literals (the change-S02 hazard)', () => {
    // This is the exact shape that silently dropped the `lead` table: a `//`
    // line comment between `},` and the next `{`.
    const src = wrapConfig(
      `  {
    name: 'client',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  // a stray comment between two entries — used to merge them into one capture
  {
    name: 'lead',
    tier: 'A',
    tenantColumn: 'company_id',
  },`,
    );

    const entries = parseSyncConfigSource(src);

    expect(entries.map((e) => e.name)).toEqual(['client', 'lead']);
    expect(entries).toHaveLength(2);
  });

  it('parses entries separated by a block comment between literals', () => {
    const src = wrapConfig(
      `  {
    name: 'trial',
    tier: 'A',
    tenantColumn: 'company_id',
  },
  /* block comment between entries */
  {
    name: 'trial_service',
    tier: 'B',
    tenantColumn: 'company_id',
  },`,
    );

    const entries = parseSyncConfigSource(src);
    expect(entries.map((e) => e.name)).toEqual(['trial', 'trial_service']);
    expect(entries.map((e) => e.tier)).toEqual(['A', 'B']);
  });

  it('does not mistake a `//` inside a notes string for a comment', () => {
    // The URL-looking `//` and the `{` brace inside the string must not break
    // either comment-stripping or brace-depth scanning.
    const src = wrapConfig(
      `  {
    name: 'company',
    tier: 'A',
    tenantColumn: null,
    notes: 'see https://example.com/x and the { shape } below',
  },
  {
    name: 'user_info',
    tier: 'A',
    tenantColumn: 'company_id',
  },`,
    );

    const entries: ParsedEntry[] = parseSyncConfigSource(src);
    expect(entries.map((e) => e.name)).toEqual(['company', 'user_info']);
    expect(entries[0]?.tenantColumn).toBeNull();
    expect(entries[1]?.tenantColumn).toBe('company_id');
  });

  it('counts top-level object literals correctly with comments and nested braces', () => {
    const body = `  {
    name: 'a', tier: 'A', tenantColumn: null,
    shapeWhere: (cid) => \`(company_id = \${cid} OR company_id IS NULL)\`,
  },
  // comment
  {
    name: 'b', tier: 'B', tenantColumn: 'company_id',
  },`;
    const clean = stripComments(body);
    expect(countTopLevelObjects(clean)).toBe(2);
    expect(splitTopLevelObjects(clean)).toHaveLength(2);
  });

  it('throws loudly when an entry is malformed (parse-integrity assertion)', () => {
    // Second object literal has no `name` / `tier` — it is a real top-level
    // object so the count is 2, but only 1 valid entry parses → must throw.
    const src = wrapConfig(
      `  {
    name: 'company',
    tier: 'A',
    tenantColumn: null,
  },
  {
    foo: 'bar',
  },`,
    );

    expect(() => parseSyncConfigSource(src)).toThrow(/parse mismatch/i);
  });

  it('parses the real sync-config.ts and the count matches its object literals', () => {
    const realSrc = readFileSync(
      join(process.cwd(), 'src/shared/db/sync-config.ts'),
      'utf8',
    );
    const entries = parseSyncConfigSource(realSrc);

    // Every entry is well-formed.
    for (const e of entries) {
      expect(e.name).toBeTruthy();
      expect(['A', 'B']).toContain(e.tier);
    }
    // No silent drop: at least the known v0.1 set is present.
    expect(entries.map((e) => e.name)).toContain('company');
    expect(entries.map((e) => e.name)).toContain('trial_service_assignment');
  });
});
