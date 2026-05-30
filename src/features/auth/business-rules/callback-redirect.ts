/**
 * callback-redirect.ts — pure redirect-decision for the SPA auth callback.
 *
 * No I/O, no React, no Supabase. Just the decision the `/auth/callback` page
 * needs. Unit-tested in `__tests__/callback-redirect.test.ts`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

export type CallbackState = 'exchanging' | 'accepting-invite' | 'done' | 'error';

export interface RedirectDecisionInput {
  /** This hook's claims refresh / OAuth exchange has actually resolved. */
  claimsResolved: boolean;
  /** The callback flow reached its terminal 'done' state. */
  state: CallbackState;
  /** The session store has settled (initial getSession + claims query done). */
  isLoading: boolean;
  /** A redirect has already been committed — never override it. */
  alreadyRedirecting: boolean;
  /** The ACTUAL session presence, read at decision time (not the store flag). */
  hasSession: boolean;
  /** The signed-in user is bonded to a `user_info` row (post-onboarding). */
  hasCompany: boolean;
}

/**
 * Returns the path to navigate to, or `null` when the decision is not yet safe
 * to make.
 *
 * Critically, `/login` is only returned once the flow has fully settled
 * (`claimsResolved && state === 'done' && !isLoading`) AND there is genuinely
 * no session. This prevents latching `/login` on a transient
 * `hasSession === false` window during the async claims refresh + SyncGate
 * hydration — the bug that bounced authenticated users back to /login.
 */
export function decideCallbackRedirect(input: RedirectDecisionInput): string | null {
  const { claimsResolved, state, isLoading, alreadyRedirecting, hasSession, hasCompany } = input;
  if (alreadyRedirecting) return null;
  if (!claimsResolved || state !== 'done' || isLoading) return null;
  if (!hasSession) return '/login';
  if (!hasCompany) return '/onboarding';
  return '/Dashboard';
}
