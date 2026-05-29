/**
 * role-mapping.ts — bridge between the V2 schema role strings (TitleCase,
 * stored in `user_info.company_role`) and the legacy lowercase strings used
 * by navigation/sidebar code ported from MVP.
 *
 * Pure — no I/O.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export type SchemaRole =
  | 'Owner'
  | 'Admin'
  | 'Sales'
  | 'Trial Consultant'
  | 'System Admin';

export type LegacyRole = 'owner' | 'admin' | 'sales' | 'trial_consultant';

export function toLegacyRole(role: SchemaRole | string | null | undefined): LegacyRole | undefined {
  switch (role) {
    case 'Owner':
      return 'owner';
    case 'Admin':
      return 'admin';
    case 'Sales':
      return 'sales';
    case 'Trial Consultant':
      return 'trial_consultant';
    default:
      return undefined;
  }
}

/**
 * True when the role is owner/admin in EITHER casing — the schema's TitleCase
 * (`'Owner'`/`'Admin'`) or the legacy lowercase (`'owner'`/`'admin'`). Use this
 * everywhere an owner/admin RBAC gate is needed so the convention is consistent
 * regardless of which casing the calling surface happens to hold.
 */
export function isOwnerOrAdmin(role: string | null | undefined): boolean {
  return (
    role === 'Owner' || role === 'Admin' || role === 'owner' || role === 'admin'
  );
}

export function toSchemaRole(role: LegacyRole | string | null | undefined): SchemaRole | null {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'sales':
      return 'Sales';
    case 'trial_consultant':
      return 'Trial Consultant';
    default:
      return null;
  }
}
