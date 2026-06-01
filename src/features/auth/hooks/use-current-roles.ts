/**
 * use-current-roles.ts — derives the role from the live `user_info` row.
 *
 * Inlines the user_info entity read so this hook does not import the
 * sibling `use-current-user` hook (eslint `boundaries/element-types` does
 * not permit feature-hook → feature-hook).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useTierAById } from '@/shared/hooks/use-tier-a-query';
import { useAuthSession } from '@/features/auth/stores/auth-store';

export type Role = 'Owner' | 'Admin' | 'Sales' | 'Trial Consultant' | 'System Admin';

const ROLE_VALUES: ReadonlyArray<Role> = [
  'Owner',
  'Admin',
  'Sales',
  'Trial Consultant',
  'System Admin',
];

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null;
  return ROLE_VALUES.includes(value as Role) ? (value as Role) : null;
}

export interface UseCurrentRolesResult {
  role: Role | null;
  isOwner: boolean;
  isAdmin: boolean;
  isSales: boolean;
  isTrialConsultant: boolean;
  isSystemAdmin: boolean;
  hasAnyRole: (roles: ReadonlyArray<Role>) => boolean;
  isLoading: boolean;
}

interface UserInfoRoleShape extends Record<string, unknown> {
  id: string;
  company_role: string | null;
}

export function useCurrentRoles(): UseCurrentRolesResult {
  // `currentUserInfoId` is resolved by auth-session.ts on every auth state
  // change via a `user_info` query (by auth_user_id or by email fallback).
  // Do NOT read from `user_metadata.user_info_id` — that JWT claim is not
  // populated automatically by Supabase and is always undefined.
  const userInfoId = useAuthSession((s) => s.currentUserInfoId);
  const authLoading = useAuthSession((s) => s.isLoading);

  // S05: read the user_info row directly from the synced PGlite view
  // (Pattern 4) instead of the entity-graph `useEntity({ fetch })` bridge,
  // which round-tripped to Supabase REST. `user_info` is Tier-A synced.
  const { row, loading: isLoading } = useTierAById<UserInfoRoleShape>(
    'user_info',
    userInfoId,
  );

  const role = normalizeRole(row?.company_role);

  return {
    role,
    isOwner: role === 'Owner',
    isAdmin: role === 'Admin',
    isSales: role === 'Sales',
    isTrialConsultant: role === 'Trial Consultant',
    isSystemAdmin: role === 'System Admin',
    hasAnyRole: (roles) => role !== null && roles.includes(role),
    isLoading: authLoading || (!!userInfoId && isLoading),
  };
}
