/**
 * use-current-user.ts — live `user_info` row for the signed-in user.
 *
 * Pattern 4 migration: reads directly from the PGlite `user_info` unified
 * view via `useTierAById` instead of firing a REST fetch. On browser refresh,
 * the IDB row is returned immediately with zero network round-trips.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useAuthSession } from '@/features/auth/stores/auth-store';
import { useTierAById } from '@/shared/hooks/use-tier-a-query';

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
  preferences: Record<string, unknown> | null;
  profile_photo: string | null;
}

export interface UseCurrentUserResult {
  userInfo: UserInfoRecord | null;
  isLoading: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const userInfoId = useAuthSession((s) => s.currentUserInfoId);
  const authLoading = useAuthSession((s) => s.isLoading);

  // Pattern 4: read directly from PGlite user_info unified view.
  // On refresh this returns the IDB row immediately — no REST fetch.
  const { row, loading } = useTierAById<UserInfoRecord>('user_info', userInfoId);

  return {
    userInfo: userInfoId ? row : null,
    isLoading: authLoading || (!!userInfoId && loading),
  };
}
