/**
 * accept-invitation.ts — pure decision tree for invitation acceptance.
 *
 * Ported from MVP `AuthContext.checkUserAuth` + `AcceptInvite.processInvitation`
 * branches. Given the decoded invitation + the current auth/user context,
 * returns the next step the UI should take. No I/O — the caller orchestrates
 * the side effects (store actions, navigation).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export type AuthContextSnapshot = {
  isAuthenticated: boolean;
  userEmail: string | null;
  userInfoId: string | null;
  companyId: string | null;
};

export type InvitationSnapshot = {
  token: string;
  email: string;
  role: string;
  companyId: string;
  expiresAt: string | null;
  acceptedAt: string | null;
};

export type InvitationDecision =
  | { kind: 'expired' }
  | { kind: 'already-accepted' }
  | { kind: 'wrong-account'; expectedEmail: string }
  | { kind: 'auth-required'; storeToken: true }
  | { kind: 'accept' }
  | { kind: 'invalid-token' };

/**
 * Decide what to do with an invitation given the current auth context.
 *
 * Decision tree (matches MVP behavior):
 *   1. No token / invalid → invalid-token
 *   2. expires_at < now → expired
 *   3. accepted_at not null → already-accepted
 *   4. Not authenticated → auth-required (caller stashes token in storage)
 *   5. Authenticated but email mismatch → wrong-account
 *   6. Otherwise → accept
 */
export function decideInvitation(
  invitation: InvitationSnapshot | null,
  auth: AuthContextSnapshot,
  now: Date = new Date(),
): InvitationDecision {
  if (!invitation || !invitation.token || !invitation.companyId || !invitation.email) {
    return { kind: 'invalid-token' };
  }

  if (invitation.expiresAt) {
    const exp = new Date(invitation.expiresAt);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < now.getTime()) {
      return { kind: 'expired' };
    }
  }

  if (invitation.acceptedAt) {
    return { kind: 'already-accepted' };
  }

  if (!auth.isAuthenticated) {
    return { kind: 'auth-required', storeToken: true };
  }

  const invited = invitation.email.toLowerCase().trim();
  const current = (auth.userEmail ?? '').toLowerCase().trim();
  if (!current || current !== invited) {
    return { kind: 'wrong-account', expectedEmail: invitation.email };
  }

  return { kind: 'accept' };
}
