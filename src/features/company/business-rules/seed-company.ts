/**
 * seed-company.ts — pure helpers ported from MVP `lib/seedCompany.js`.
 *
 * In MVP the "seed" Company is a real DB record from which every new tenant
 * is cloned. The HotSeaters-ultimate port treats the seed company concept
 * as a frontend predicate only — superadmin gating happens server-side via
 * RLS + Edge Functions. These helpers keep the predicate logic pure so it
 * can be unit-tested.
 *
 * No I/O. No imports of any data-seam module.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

/**
 * The legacy MongoDB seed company id. Kept as a constant for traceability
 * with MVP; the new V2 deployment may not have a seed company, in which case
 * `isSeedCompany()` will always return false.
 */
export const LEGACY_SEED_COMPANY_LEGACY_ID = '6a0750c33fc890c852169dc9';

export interface CompanyLike {
  id?: string | null;
  legacy_id?: string | null;
}

export interface UserLike {
  role?: 'admin' | 'user' | null;
}

export interface UserInfoLike {
  company_id?: string | null;
  legacy_id?: string | null;
}

export function isSeedCompany(
  companyOrLegacyId: string | CompanyLike | null | undefined,
): boolean {
  if (!companyOrLegacyId) return false;
  if (typeof companyOrLegacyId === 'string') {
    return companyOrLegacyId === LEGACY_SEED_COMPANY_LEGACY_ID;
  }
  return (
    companyOrLegacyId.legacy_id === LEGACY_SEED_COMPANY_LEGACY_ID
  );
}

/**
 * Superadmin predicate (frontend advisory only — real enforcement is in
 * server-side functions / RLS).
 *
 * Requires:
 *   - User is a platform-level admin (`user.role === 'admin'`)
 *   - User's current UserInfo row is scoped to the seed company
 */
export function isSeedSuperadmin(
  user: UserLike | null | undefined,
  userInfo: UserInfoLike | null | undefined,
  seedCompanyId?: string | null,
): boolean {
  if (!user || !userInfo) return false;
  if (user.role !== 'admin') return false;
  if (seedCompanyId && userInfo.company_id === seedCompanyId) return true;
  if (userInfo.legacy_id === LEGACY_SEED_COMPANY_LEGACY_ID) return true;
  return false;
}

/**
 * Returns the default settings_type keys a newly-onboarded tenant should
 * have rows for in `entity_setting`. The Edge Function `onboard-company` is
 * the authoritative writer of these defaults — this list is exported here so
 * tests + UI can reason about the expected baseline.
 */
export const DEFAULT_TENANT_SETTING_KEYS: ReadonlyArray<string> = [
  'company.billing',
  'company.numbering',
  'company.time_clock',
  'company.branding',
];

/**
 * Build the initial Company row payload from onboarding input. Pure
 * transform — adds the conventional defaults the V2 schema expects.
 */
export interface OnboardingCompanyInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface SeedCompanyRow {
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_active: true;
  marketplace_post_jobs: false;
  marketplace_fill_jobs: false;
  has_hsh_addon: false;
}

export function buildSeedCompanyRow(input: OnboardingCompanyInput): SeedCompanyRow {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error('Company name is required');
  }
  return {
    name: trimmed,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    website: input.website?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    zip: input.zip?.trim() || null,
    is_active: true,
    marketplace_post_jobs: false,
    marketplace_fill_jobs: false,
    has_hsh_addon: false,
  };
}
