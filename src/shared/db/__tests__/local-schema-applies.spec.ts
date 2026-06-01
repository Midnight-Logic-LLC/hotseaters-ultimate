/**
 * local-schema-applies.spec.ts — boots a REAL PGlite (with the vector
 * extension) and applies the generated runtime schema files in boot order,
 * then asserts every SYNC_CONFIG entity materialises as a queryable view and
 * that pgvector similarity works on the embedded entities.
 *
 * Why this exists: change-S02 added entities to local-schema.sql but the
 * RUNTIME applies local-schema-common.sql + local-schema-user.sql. Before S06
 * those runtime files were hand-curated and silently lagged behind — the new
 * tables did not exist at boot. The pure-text schema specs could not catch
 * that. This test executes the actual SQL the app runs, so a synced entity that
 * fails to materialise (or a malformed embedding column) fails CI loudly.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite/vector';
import { beforeAll, describe, expect, it } from 'vitest';

import { SYNC_CONFIG } from '../sync-config';

const dbDir = join(process.cwd(), 'src/shared/db');
const commonSql = readFileSync(join(dbDir, 'local-schema-common.sql'), 'utf8');
const userSql = readFileSync(join(dbDir, 'local-schema-user.sql'), 'utf8');

const EMBEDDING_DIM = 1536;

describe('generated runtime schema applies in a real PGlite', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await PGlite.create({ extensions: { vector } });
    // Boot order matters: common defines infra (local_writes) the user
    // triggers reference, plus the vector extension.
    await db.exec(commonSql);
    await db.exec(userSql);
  });

  it('materialises every SYNC_CONFIG entity as a queryable view', async () => {
    for (const entry of SYNC_CONFIG) {
      // Throws if the view/table is missing — the exact S02 regression.
      const res = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${entry.name}`,
      );
      expect(res.rows[0]?.n).toBe(0);
    }
  });

  it('runs a local pgvector similarity query on an embedded entity', async () => {
    const probe = `[${Array(EMBEDDING_DIM).fill(0.1).join(',')}]`;
    const query = `[${Array(EMBEDDING_DIM).fill(0.2).join(',')}]`;
    await db.exec(
      `INSERT INTO client_synced (id, company_id, embedding) VALUES ('c1', 'co1', '${probe}')`,
    );
    const res = await db.query<{ id: string; d: number }>(
      `SELECT id, (embedding <=> '${query}') AS d
       FROM client
       WHERE company_id = 'co1' AND embedding IS NOT NULL
       ORDER BY d ASC LIMIT 5`,
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0]?.id).toBe('c1');
    expect(typeof res.rows[0]?.d).toBe('number');
  });

  it('declares an embedding column only on the configured entities', async () => {
    const embedded = new Set(
      SYNC_CONFIG.filter((e) => e.embedding).map((e) => e.name),
    );
    for (const entry of SYNC_CONFIG) {
      const res = await db.query<{ n: number }>(
        `SELECT count(*)::int AS n
         FROM information_schema.columns
         WHERE table_name = '${entry.name}_synced' AND column_name = 'embedding'`,
      );
      const hasEmbedding = (res.rows[0]?.n ?? 0) > 0;
      expect(hasEmbedding).toBe(embedded.has(entry.name));
    }
  });
});
