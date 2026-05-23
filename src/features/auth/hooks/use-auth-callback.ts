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

export type CallbackState = 'exchanging' | 'accepting-invite' | 'done' | 'error';

export interface UseAuthCallbackResult {
  state: CallbackState;
  error: string | null;
  redirectTo: string | null;
}

export function useAuthCallback(): UseAuthCallbackResult {
  const isAuthenticated = useAuthSession((s) => s.isAuthenticated);
  const isLoading = useAuthSession((s) => s.isLoading);
  const companyId = useAuthSession((s) => s.companyId);

  const [state, setState] = useState<CallbackState>('exchanging');
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== 'done' || isLoading) return;
    if (!isAuthenticated) {
      setRedirectTo('/login');
      return;
    }
    if (!companyId) {
      setRedirectTo('/onboarding');
      return;
    }
    if (!redirectTo) setRedirectTo('/Dashboard');
  }, [state, isLoading, isAuthenticated, companyId, redirectTo]);

  return { state, error, redirectTo };
}
