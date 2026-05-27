import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const schemaPath = join(process.cwd(), 'src/shared/db/local-schema-common.sql');
const schemaSql = readFileSync(schemaPath, 'utf8');

function columnType(tableName: string, columnName: string): string {
  const tableMatch = schemaSql.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName} \\((.*?)\\);`, 's'),
  );
  if (!tableMatch?.[1]) {
    throw new Error(`Missing table ${tableName}`);
  }

  const columnMatch = tableMatch[1].match(
    new RegExp(`\\n\\s+${columnName.replace(/"/g, '\\"')}\\s+([A-Z]+)\\b`),
  );
  if (!columnMatch?.[1]) {
    throw new Error(`Missing column ${tableName}.${columnName}`);
  }

  return columnMatch[1];
}

describe('local common PGlite schema', () => {
  it('keeps Electric system-shape columns aligned with Postgres types', () => {
    for (const tableName of ['metadata_type_synced', 'metadata_type_local']) {
      expect(columnType(tableName, 'is_active')).toBe('BOOLEAN');
      expect(columnType(tableName, 'is_default')).toBe('BOOLEAN');
      expect(columnType(tableName, 'is_sample')).toBe('BOOLEAN');
    }

    for (const tableName of ['entity_metadata_synced', 'entity_metadata_local']) {
      expect(columnType(tableName, 'extra')).toBe('JSONB');
      expect(columnType(tableName, 'is_sample')).toBe('BOOLEAN');
    }
  });

  it('does not overwrite the stored schema version before migration checks run', () => {
    expect(schemaSql).toContain("VALUES (1, '20260526000001')");
    expect(schemaSql).toContain('ON CONFLICT (id) DO NOTHING');
  });
});
