/**
 * use-team.ts — list of team members (`user_info` rows) for the current
 * tenant.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import {
  fetchTeamForCompany,
  sendInvitation as sendInvitationAction,
  updateUserInfo,
  type SendInvitationPayload,
} from '@/features/company/stores/company-store';
import { useMemo, useState } from 'react';

export interface TeamMember extends Record<string, unknown> {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_role: string | null;
  account_status: 'pending' | 'active' | 'rejected' | 'disabled' | null;
  is_sales: boolean;
}

export interface UseTeamResult {
  members: TeamMember[];
  isLoading: boolean;
  total: number | null;
  refetch: () => void;
  invite: (payload: SendInvitationPayload) => Promise<void>;
  invitePending: boolean;
  inviteError: string | null;
  updateMember: (memberId: string, patch: Partial<TeamMember>) => Promise<void>;
}

export function useTeam(companyId: string | null): UseTeamResult {
  const list = useEntityList<TeamMember, TeamMember>({
    type: 'UserInfo',
    queryKey: ['team', companyId ?? 'none'],
    enabled: !!companyId,
    fetch: async () => {
      const res = await fetchTeamForCompany(companyId ?? '');
      return {
        items: res.items as TeamMember[],
        total: res.total,
        nextCursor: res.nextCursor,
      };
    },
    normalize: (raw) => ({ id: String(raw.id), data: raw }),
  });
  // Stabilize the destructured shape so consumers of useTeam (which is read
  // through useSyncExternalStore-backed selectors downstream) don't trigger
  // React 19's "getSnapshot should be cached to avoid an infinite loop"
  // warning. The underlying library currently returns a fresh result object
  // per render; memoising the destructure pins the identity.
  const { items, isLoading, total, refetch } = useMemo(
    () => ({
      items: list.items,
      isLoading: list.isLoading,
      total: list.total,
      refetch: list.refetch,
    }),
    [list.items, list.isLoading, list.total, list.refetch],
  );

  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const invite = async (payload: SendInvitationPayload) => {
    setInvitePending(true);
    setInviteError(null);
    try {
      await sendInvitationAction(payload);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send invitation';
      setInviteError(msg);
      throw err;
    } finally {
      setInvitePending(false);
    }
  };

  const updateMember = async (memberId: string, patch: Partial<TeamMember>) => {
    await updateUserInfo(memberId, patch);
    refetch();
  };

  return {
    members: items,
    isLoading,
    total,
    refetch,
    invite,
    invitePending,
    inviteError,
    updateMember,
  };
}
