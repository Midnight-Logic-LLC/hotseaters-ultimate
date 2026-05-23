/**
 * use-auth.ts — feature facade over the auth-session store + auth-store
 * server actions. Components must reach auth state through THIS hook (not
 * the underlying Zustand store).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useCallback } from 'react';
import { useAuthSession } from '@/features/auth/stores/auth-store';

export interface UseAuthResult {
  user: ReturnType<typeof useAuthSession.getState>['user'];
  session: ReturnType<typeof useAuthSession.getState>['session'];
  isAuthenticated: boolean;
  isLoading: boolean;
  companyId: string | null;
  currentUserInfoId: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

/**
 * Selector-driven hook so React only re-renders when the fields we expose
 * actually change. The action methods are stable (Zustand keeps reference
 * identity across renders).
 */
export function useAuth(): UseAuthResult {
  const user = useAuthSession((s) => s.user);
  const session = useAuthSession((s) => s.session);
  const isAuthenticated = useAuthSession((s) => s.isAuthenticated);
  const isLoading = useAuthSession((s) => s.isLoading);
  const companyId = useAuthSession((s) => s.companyId);

  // The auth-session store's `currentUserInfoId` is not yet a first-class
  // field — derive it from `user.user_metadata` if present, else null. The
  // canonical source is `user_info.id` via the bridge, but we don't fetch it
  // here (that would couple this hook to the entity graph too early in boot).
  // Components that need the user_info row use `useCurrentUser()`.
  const currentUserInfoId =
    (user?.user_metadata?.user_info_id as string | undefined) ?? null;

  const signInWithGoogle = useCallback(async () => {
    await useAuthSession.getState().signInWithOAuth('google');
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    await useAuthSession.getState().signInWithMagicLink(email);
  }, []);

  const signOut = useCallback(async () => {
    await useAuthSession.getState().signOut();
  }, []);

  const refreshClaims = useCallback(async () => {
    await useAuthSession.getState().refreshClaims();
  }, []);

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    companyId,
    currentUserInfoId,
    signInWithGoogle,
    signInWithMagicLink,
    signOut,
    refreshClaims,
  };
}
