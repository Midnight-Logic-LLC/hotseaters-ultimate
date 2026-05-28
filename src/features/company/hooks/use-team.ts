/**
 * use-team.ts — list of team members (`user_info` rows) for the current tenant.
 *
 * Pattern 4 migration: reads directly from the PGlite `user_info` unified
 * view via `useTierAQuery` instead of the `useEntityList` REST-cache bridge.
 * On browser refresh, IDB rows return immediately with zero network round-trips.
 *
 * Mutations (invite, updateMember) still route through the company-store which
 * calls Supabase REST — the write path is unchanged.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import {
  sendInvitation as sendInvitationAction,
  updateUserInfo,
  type SendInvitationPayload,
} from '@/features/company/stores/company-store';

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
  /** No-op — kept for API compat. PGlite live queries auto-refresh. */
  refetch: () => void;
  invite: (payload: SendInvitationPayload) => Promise<void>;
  invitePending: boolean;
  inviteError: string | null;
  updateMember: (memberId: string, patch: Partial<TeamMember>) => Promise<void>;
}

export function useTeam(companyId: string | null): UseTeamResult {
  // Pattern 4: read directly from PGlite user_info unified view.
  const { rows, loading } = useTierAQuery<TeamMember>(
    'user_info',
    companyId,
  );

  const [invitePending, setInvitePending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const invite = async (payload: SendInvitationPayload) => {
    setInvitePending(true);
    setInviteError(null);
    try {
      await sendInvitationAction(payload);
      // useLiveQuery auto-updates when the new user_info row syncs back via Electric.
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
    // useLiveQuery auto-updates when the updated user_info row syncs back.
  };

  return useMemo(
    () => ({
      members: rows,
      isLoading: loading,
      total: rows.length,
      refetch: () => {
        // useLiveQuery auto-updates on PGlite changes — nothing to do.
      },
      invite,
      invitePending,
      inviteError,
      updateMember,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, loading, invitePending, inviteError],
  );
}
