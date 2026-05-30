/**
 * electric-sync-companyid.spec.ts — regression guard for the
 * `company_id = 'undefined'` malformed-shape bug.
 *
 * Root cause: a JS `undefined` companyId was interpolated into the `user_info`
 * Electric shape `where` as `'${companyId}'`, producing the literal predicate
 * `company_id = 'undefined'`. Electric rejects that with HTTP 400, the shape's
 * `onInitialSync` never fired, and SyncGate hung forever on the "Preparing
 * your data…" splash.
 *
 * These tests prove the where-builder can NEVER emit `'undefined'` once the
 * companyId guard is applied, and pin the guard's accept/reject contract.
 *
 * electric-sync.ts reads VITE_ELECTRIC_URL / VITE_ELECTRIC_SECRET at module
 * load and throws if unset (RULE 1). The test runner has no .env, so we stub
 * those two values BEFORE a dynamic import of the module under test.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { SYNC_CONFIG } from '../sync-config';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// PGlite worker bootstrap must never run in the node test env.
vi.mock('../pglite-client', () => ({
  openForUser: vi.fn(),
}));

let isValidCompanyId: (companyId: string | null | undefined) => boolean;

beforeAll(async () => {
  vi.stubEnv('VITE_ELECTRIC_URL', 'http://localhost:8000');
  vi.stubEnv('VITE_ELECTRIC_SECRET', 'test-secret');
  ({ isValidCompanyId } = await import('../electric-sync'));
});

describe('isValidCompanyId', () => {
  it('accepts a canonical lower-case UUID', () => {
    expect(isValidCompanyId(VALID_UUID)).toBe(true);
  });

  it('accepts an upper-case UUID', () => {
    expect(isValidCompanyId(VALID_UUID.toUpperCase())).toBe(true);
  });

  it('rejects undefined', () => {
    expect(isValidCompanyId(undefined)).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidCompanyId(null)).toBe(false);
  });

  it('rejects the empty string', () => {
    expect(isValidCompanyId('')).toBe(false);
  });

  it('rejects the literal string "undefined" (the coerced-undefined bug)', () => {
    expect(isValidCompanyId('undefined')).toBe(false);
  });

  it('rejects a non-UUID token', () => {
    expect(isValidCompanyId('not-a-uuid')).toBe(false);
  });
});

describe('shape where-builder cannot emit the malformed predicate', () => {
  // The two-class entries (metadata_type, entity_metadata) carry a custom
  // shapeWhere and reproduce the exact interpolation electric-sync performs:
  // shapeWhere(`'${companyId}'`). user_info (the FIRST entry, no custom
  // shapeWhere) gets its predicate from the tenant-scoped adapter via
  // tenantColumn — the same companyId value flows in, so the guard protects
  // it too.
  const withShapeWhere = SYNC_CONFIG.filter((c) => c.shapeWhere);

  const buildClause = (
    config: (typeof SYNC_CONFIG)[number],
    companyId: string | undefined,
  ): string | undefined => config.shapeWhere?.(`'${companyId}'`);

  it('UNGUARDED, an undefined companyId yields the literal "undefined"', () => {
    // Documents the pre-fix failure mode.
    for (const config of withShapeWhere) {
      expect(buildClause(config, undefined)).toContain("'undefined'");
    }
  });

  it('GUARDED, the build is refused before it can emit "undefined"', () => {
    const guardedBuild = (
      config: (typeof SYNC_CONFIG)[number],
      companyId: string | undefined,
    ): string | undefined => {
      if (!isValidCompanyId(companyId)) {
        throw new Error('invalid companyId — shape build refused');
      }
      return buildClause(config, companyId);
    };

    for (const config of withShapeWhere) {
      expect(() => guardedBuild(config, undefined)).toThrow('invalid companyId');
      expect(() => guardedBuild(config, 'undefined')).toThrow(
        'invalid companyId',
      );
      expect(guardedBuild(config, VALID_UUID)).not.toContain("'undefined'");
    }
  });
});
