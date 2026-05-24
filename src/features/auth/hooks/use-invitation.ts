/**
 * use-invitation.ts — loads + evaluates an invitation token.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEffect, useState } from 'react';
import {
  useAuthSession,
  loadInvitation,
  applyOAuthIntent,
  acceptInvitation as acceptInvitationAction,
  type InvitationRecord,
} from '@/features/auth/stores/auth-store';
import {
  decideInvitation,
  type InvitationDecision,
  type InvitationSnapshot,
} from '@/features/auth/business-rules/accept-invitation';

export interface UseInvitationResult {
  loading: boolean;
  decision: InvitationDecision | null;
  decoded: { companyId: string; email: string; role: string } | null;
  invitation: InvitationRecord | null;
  companyName: string | null;
  storeTokenAndSignIn: () => void;
  acceptNow: () => Promise<{ companyId: string; companyName?: string; userInfoId?: string } | null>;
  accepting: boolean;
  acceptError: string | null;
}

export function useInvitation(token: string | null): UseInvitationResult {
  const isAuthenticated = useAuthSession((s) => s.isAuthenticated);
  const user = useAuthSession((s) => s.user);
  const companyId = useAuthSession((s) => s.companyId);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [decoded, setDecoded] = useState<UseInvitationResult['decoded']>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadInvitation(token).then((res) => {
      if (cancelled) return;
      setInvitation(res.invitation);
      setDecoded(res.decoded);
      setCompanyName(res.companyName);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const snapshot: InvitationSnapshot | null = token
    ? {
        token,
        email: invitation?.email ?? decoded?.email ?? '',
        role: invitation?.role ?? decoded?.role ?? '',
        companyId: invitation?.company_id ?? decoded?.companyId ?? '',
        expiresAt: invitation?.expires_at ?? null,
        acceptedAt: invitation?.accepted_at ?? null,
      }
    : null;

  const decision = snapshot
    ? decideInvitation(snapshot, {
        isAuthenticated,
        userEmail: user?.email ?? null,
        userInfoId:
          (user?.user_metadata?.user_info_id as string | undefined) ?? null,
        companyId,
      })
    : null;

  const storeTokenAndSignIn = () => {
    if (!token) return;
    applyOAuthIntent({ kind: 'accept-invite', token });
  };

  const acceptNow = async () => {
    if (!token) return null;
    setAccepting(true);
    setAcceptError(null);
    try {
      const result = await acceptInvitationAction(token);
      return result;
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Could not accept invitation');
      return null;
    } finally {
      setAccepting(false);
    }
  };

  return {
    loading,
    decision,
    decoded,
    invitation,
    companyName,
    storeTokenAndSignIn,
    acceptNow,
    accepting,
    acceptError,
  };
}
