import { describe, it, expect } from 'vitest';
import {
  isSeedCompany,
  isSeedSuperadmin,
  buildSeedCompanyRow,
  LEGACY_SEED_COMPANY_LEGACY_ID,
  DEFAULT_TENANT_SETTING_KEYS,
} from '../seed-company';

describe('isSeedCompany', () => {
  it('returns false for null / undefined', () => {
    expect(isSeedCompany(null)).toBe(false);
    expect(isSeedCompany(undefined)).toBe(false);
  });

  it('matches the legacy seed company id as string', () => {
    expect(isSeedCompany(LEGACY_SEED_COMPANY_LEGACY_ID)).toBe(true);
    expect(isSeedCompany('other-id')).toBe(false);
  });

  it('matches by legacy_id on a company object', () => {
    expect(isSeedCompany({ legacy_id: LEGACY_SEED_COMPANY_LEGACY_ID })).toBe(true);
    expect(isSeedCompany({ legacy_id: 'other' })).toBe(false);
  });
});

describe('isSeedSuperadmin', () => {
  it('requires both admin role and seed company scope', () => {
    expect(
      isSeedSuperadmin({ role: 'admin' }, { legacy_id: LEGACY_SEED_COMPANY_LEGACY_ID }),
    ).toBe(true);

    expect(
      isSeedSuperadmin({ role: 'user' }, { legacy_id: LEGACY_SEED_COMPANY_LEGACY_ID }),
    ).toBe(false);

    expect(isSeedSuperadmin({ role: 'admin' }, { legacy_id: 'something-else' })).toBe(false);
  });

  it('accepts an explicit seedCompanyId override (new V2 deploys)', () => {
    expect(
      isSeedSuperadmin(
        { role: 'admin' },
        { company_id: 'co-seed' },
        'co-seed',
      ),
    ).toBe(true);

    expect(
      isSeedSuperadmin(
        { role: 'admin' },
        { company_id: 'co-other' },
        'co-seed',
      ),
    ).toBe(false);
  });
});

describe('buildSeedCompanyRow', () => {
  it('trims and defaults missing fields', () => {
    const row = buildSeedCompanyRow({ name: '  Acme Trial Co  ' });
    expect(row.name).toBe('Acme Trial Co');
    expect(row.email).toBeNull();
    expect(row.is_active).toBe(true);
    expect(row.marketplace_post_jobs).toBe(false);
    expect(row.has_hsh_addon).toBe(false);
  });

  it('throws when name is empty', () => {
    expect(() => buildSeedCompanyRow({ name: '   ' })).toThrow();
  });
});

describe('DEFAULT_TENANT_SETTING_KEYS', () => {
  it('always includes the four MVP setting families', () => {
    expect(DEFAULT_TENANT_SETTING_KEYS).toContain('company.billing');
    expect(DEFAULT_TENANT_SETTING_KEYS).toContain('company.numbering');
    expect(DEFAULT_TENANT_SETTING_KEYS).toContain('company.time_clock');
    expect(DEFAULT_TENANT_SETTING_KEYS).toContain('company.branding');
  });
});
