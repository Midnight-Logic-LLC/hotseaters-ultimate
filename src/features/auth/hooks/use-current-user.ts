/**
 * use-current-user.ts — live `user_info` row for the signed-in user.
 *
 * Reads the auth session through the auth-store re-export (no sibling-hook
 * imports — eslint `boundaries/element-types` does not allow feature-hook →
 * feature-hook).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import {
  useAuthSession,
  fetchUserInfoById,
} from '@/features/auth/stores/auth-store';

export interface UserInfoRecord extends Record<string, unknown> {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  account_status: 'pending' | 'active' | 'rejected' | 'disabled' | null;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
  company_role:
    | 'Owner'
    | 'Admin'
    | 'Sales'
    | 'Trial Consultant'
    | 'System Admin'
    | null;
  is_sales: boolean;
  status: string | null;
}

export interface UseCurrentUserResult {
  userInfo: UserInfoRecord | null;
  isLoading: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const userInfoId = useAuthSession(
    (s) =>
      (s.user?.user_metadata?.user_info_id as string | undefined) ?? null,
  );
  const authLoading = useAuthSession((s) => s.isLoading);

  const { data, isLoading } = useEntity<UserInfoRecord, UserInfoRecord>({
    type: 'UserInfo',
    id: userInfoId ?? '',
    enabled: !!userInfoId,
    fetch: (id) => fetchUserInfoById(String(id)) as Promise<UserInfoRecord>,
    normalize: (raw) => raw,
  });

  return {
    userInfo: userInfoId ? data : null,
    isLoading: authLoading || (!!userInfoId && isLoading),
  };
}
