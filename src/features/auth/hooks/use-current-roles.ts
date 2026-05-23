/**
 * use-current-roles.ts — derives the role from the live `user_info` row.
 *
 * Inlines the user_info entity read so this hook does not import the
 * sibling `use-current-user` hook (eslint `boundaries/element-types` does
 * not permit feature-hook → feature-hook).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import {
  useAuthSession,
  fetchUserInfoById,
} from '@/features/auth/stores/auth-store';

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
  const userInfoId = useAuthSession(
    (s) =>
      (s.user?.user_metadata?.user_info_id as string | undefined) ?? null,
  );
  const authLoading = useAuthSession((s) => s.isLoading);

  const { data, isLoading } = useEntity<UserInfoRoleShape, UserInfoRoleShape>({
    type: 'UserInfo',
    id: userInfoId ?? '',
    enabled: !!userInfoId,
    fetch: (id) => fetchUserInfoById(String(id)) as Promise<UserInfoRoleShape>,
    normalize: (raw) => raw,
  });

  const role = normalizeRole(data?.company_role);

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
