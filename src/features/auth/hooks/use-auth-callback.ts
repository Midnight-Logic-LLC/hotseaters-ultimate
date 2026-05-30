/**
 * use-auth-callback.ts — orchestrates the SPA OAuth callback flow.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEffect, useState } from 'react';
import {
  useAuthSession,
  consumeOAuthIntent,
  exchangeOAuthCode,
  acceptInvitation,
} from '@/features/auth/stores/auth-store';
import {
  decideCallbackRedirect,
  type CallbackState,
} from '@/features/auth/business-rules/callback-redirect';

export type { CallbackState };

export interface UseAuthCallbackResult {
  state: CallbackState;
  error: string | null;
  redirectTo: string | null;
}

export function useAuthCallback(): UseAuthCallbackResult {
  const hasCompany = useAuthSession((s) => s.hasCompany);
  const isLoading = useAuthSession((s) => s.isLoading);

  const [state, setState] = useState<CallbackState>('exchanging');
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  // True only after THIS hook's claims refresh / OAuth exchange has actually
  // resolved. Gates the redirect decision so Effect B cannot latch `/login`
  // on a transient `isAuthenticated === false` mid-refresh.
  const [claimsResolved, setClaimsResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await exchangeOAuthCode(code);
        } else {
          await useAuthSession.getState().refreshClaims();
        }
        if (cancelled) return;

        const intent = consumeOAuthIntent();
        if (intent?.kind === 'accept-invite' && intent.token) {
          setState('accepting-invite');
          await acceptInvitation(intent.token);
          if (cancelled) return;
          setRedirectTo('/Dashboard');
          setState('done');
          return;
        }

        if (!cancelled) {
          setClaimsResolved(true);
          setState('done');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Sign-in callback failed');
        setState('error');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Mount-only: the callback flow runs exactly once on mount.
  }, []);

  useEffect(() => {
    // Decide from the ACTUAL session, not the (possibly stale during an
    // in-flight claims refresh) `isAuthenticated` store flag.
    const next = decideCallbackRedirect({
      claimsResolved,
      state,
      isLoading,
      alreadyRedirecting: redirectTo !== null,
      hasSession: useAuthSession.getState().session !== null,
      hasCompany,
    });
    if (next) setRedirectTo(next);
  }, [claimsResolved, state, isLoading, hasCompany, redirectTo]);

  return { state, error, redirectTo };
}
