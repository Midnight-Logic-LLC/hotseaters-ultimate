import type { Provider, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from './supabase-client';
import { closeForUser } from './pglite-client';
import { resetGraph } from '../stores/graph-reset';

/**
 * auth-session.ts — Zustand store wrapping `supabase.auth`.
 *
 * The single place outside `features/auth/stores/*` that touches the Supabase
 * auth surface. Subscribes to `onAuthStateChange` and exposes:
 *
 *   - `session`            current Supabase session
 *   - `user`               session.user (convenience)
 *   - `companyId`          resolved from `user_info.auth_user_id = auth.uid()`
 *   - `isAuthenticated`    session !== null (i.e. SDK believes the user is
 *                          signed in). NOT conflated with onboarding state —
 *                          that's what `hasCompany` is for.
 *   - `hasCompany`         companyId !== null (i.e. the signed-in user has
 *                          completed Owner onboarding and is bonded to a
 *                          `user_info` row). Used by route guards to decide
 *                          between `/onboarding` and `/Dashboard`.
 *   - `isLoading`          true until the initial getSession() + companyId
 *                          query settle
 *
 * Sign-in/out actions, plus `refreshClaims()` to re-run the companyId query
 * (used on tenant switch / account-linking).
 *
 * Components and feature hooks never import this directly — they reach it
 * through `features/auth/hooks/*` (Change 5). Only `sync-gate.tsx` is allowed
 * to consume it at the app-root layer (RULE 3 invariant 4).
 */

export interface AuthSessionState {
  session: Session | null;
  user: User | null;
  companyId: string | null;
  /** True when the Supabase SDK has an active session. Does NOT imply
   *  the user has completed onboarding — see `hasCompany` for that. */
  isAuthenticated: boolean;
  /** True when the signed-in user has a `user_info` row (post-onboarding). */
  hasCompany: boolean;
  isLoading: boolean;

  signInWithOAuth: (provider: Provider) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

async function fetchCompanyId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_info')
    .select('company_id')
    .eq('auth_user_id', userId)
    .single();
  if (error) {
    // PGRST116 = no rows; user_info row not created yet (during onboarding).
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return (data?.company_id as string | null) ?? null;
}

export const useAuthSession = create<AuthSessionState>((set, get) => ({
  session: null,
  user: null,
  companyId: null,
  isAuthenticated: false,
  hasCompany: false,
  isLoading: true,

  async signInWithOAuth(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  async signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },

  async signOut() {
    // Capture user id BEFORE clearing session so we can close their PGlite db.
    const previousUserId = get().user?.id ?? null;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Close the per-user PGlite instance and reset the entity graph so a
    // new sign-in (potentially a different user) starts with a clean slate.
    if (previousUserId) {
      await closeForUser(previousUserId);
    }
    resetGraph();
    // onAuthStateChange will null-out session; we proactively reset state.
    set({
      session: null,
      user: null,
      companyId: null,
      isAuthenticated: false,
      hasCompany: false,
    });
  },

  async refreshClaims() {
    const { user, session } = get();
    if (!user) {
      set({ companyId: null, hasCompany: false, isAuthenticated: !!session });
      return;
    }
    const companyId = await fetchCompanyId(user.id);
    set({
      companyId,
      hasCompany: companyId !== null,
      // isAuthenticated is solely driven by session presence — keep it true
      // even when the user has not yet completed onboarding.
      isAuthenticated: !!session,
    });
  },
}));

// ─── Boot: read existing session, then subscribe to changes ────────────────
void (async () => {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    const user = session?.user ?? null;
    const companyId = user ? await fetchCompanyId(user.id) : null;
    useAuthSession.setState({
      session,
      user,
      companyId,
      isAuthenticated: !!session,
      hasCompany: companyId !== null,
      isLoading: false,
    });
  } catch {
    useAuthSession.setState({ isLoading: false });
  }
})();

supabase.auth.onAuthStateChange((_event, session) => {
  void (async () => {
    const user = session?.user ?? null;
    const companyId = user ? await fetchCompanyId(user.id) : null;
    useAuthSession.setState({
      session,
      user,
      companyId,
      isAuthenticated: !!session,
      hasCompany: companyId !== null,
      isLoading: false,
    });
  })();
});
