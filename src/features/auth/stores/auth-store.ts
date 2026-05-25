/**
 * features/auth/stores/auth-store.ts — the Supabase-aware feature store.
 *
 * Wraps the global `useAuthSession` Zustand store (`src/shared/db/auth-session.ts`)
 * and adds the auth-adjacent server actions the feature needs:
 *
 *   - `loadInvitation(token)`        decode + fetch invitation row by token
 *   - `sendInvitation(payload)`      invokes the `send-invitation` Edge Function
 *   - `applyOAuthIntent(intent)`     stashes invitation/SSO intent in
 *                                    sessionStorage so the OAuth callback can
 *                                    consume it. Replaces the Next.js
 *                                    httpOnly cookie (plan §0.9).
 *   - `consumeOAuthIntent()`         reads + clears the intent.
 *   - `exchangeOAuthCode(...)`       wraps `supabase.auth.exchangeCodeForSession`.
 *
 * Per RULE 3 invariant 3, this is one of two places (the other being
 * `shared/db/auth-session.ts`) allowed to import `@supabase/supabase-js`
 * outside of the data seam. Feature hooks call THIS module — never the
 * Supabase client directly.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';
import { useAuthSession } from '@/shared/db/auth-session';
import { AUTH_FEATURE_ENTITY_SCHEMAS } from '@/features/auth/entities';
import { openForUser } from '@/shared/db/pglite-client';

import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management';

// ─── Entity registration (idempotent, module-level) ───────────────────────
// We register from a store module rather than `entities.ts` so the import
// stays inside the data-seam layer (RULE 3 invariant 3).
let entitiesRegistered = false;
function ensureEntitiesRegistered(): void {
  if (entitiesRegistered) return;
  for (const [entityType, schema] of Object.entries(AUTH_FEATURE_ENTITY_SCHEMAS)) {
    registerEntityJsonSchema({ entityType, schema, source: 'static' });
  }
  entitiesRegistered = true;
}
ensureEntitiesRegistered();

// ─── Re-export the session store so feature hooks have a single import. ──
export { useAuthSession };

// ─── OAuth intent — sessionStorage replacement for Next.js httpOnly cookie ─
export type OAuthIntent =
  | { kind: 'accept-invite'; token: string }
  | { kind: 'signup' }
  | { kind: 'signin' };

const OAUTH_INTENT_KEY = 'hs.oauth_intent';

export function applyOAuthIntent(intent: OAuthIntent): void {
  try {
    sessionStorage.setItem(OAUTH_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // sessionStorage may be unavailable in private mode — non-fatal.
  }
}

export function consumeOAuthIntent(): OAuthIntent | null {
  try {
    const raw = sessionStorage.getItem(OAUTH_INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(OAUTH_INTENT_KEY);
    return JSON.parse(raw) as OAuthIntent;
  } catch {
    return null;
  }
}

// ─── Email + password sign-in / sign-up / reset ──────────────────────────
// Honors the bible's AuthOptionsDialog promise of email/password support.
// Bridges to GoTrue via the Supabase SDK; the onAuthStateChange subscriber
// in auth-session.ts propagates the resulting session into the store.

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await useAuthSession.getState().refreshClaims();
  // Boot (or return cached) per-user PGlite after successful sign-in so the
  // local database is ready before the first sync gate render.
  if (data.session?.user.id) {
    void openForUser(data.session.user.id);
  }
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
  // No refreshClaims() — sign-up returns no session until email is confirmed.
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

// ─── OAuth code exchange (SPA flow per plan §0.9 / risk row) ───────────────
export async function exchangeOAuthCode(code: string): Promise<void> {
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // PKCE race: `detectSessionInUrl: true` in the Supabase client means the
    // SDK may have already consumed the `?code` query param and stored the
    // session before this explicit exchange call runs. In that case the
    // exchange fails with "both auth code and code verifier should be
    // non-empty" because the code verifier has already been wiped. The
    // session is still valid — just fall through to refreshClaims.
    const msg = error.message.toLowerCase();
    const raced =
      msg.includes('code verifier') ||
      msg.includes('both auth code') ||
      msg.includes('invalid request');
    if (!raced) throw error;
  }
  await useAuthSession.getState().refreshClaims();
  // Boot per-user PGlite after OAuth code exchange so the local database is
  // ready before the first sync gate render.
  const session = data?.session ?? (await supabase.auth.getSession()).data.session;
  if (session?.user.id) {
    void openForUser(session.user.id);
  }
}

// ─── Invitation lookup ────────────────────────────────────────────────────
export interface InvitationRecord {
  id: string;
  token: string;
  email: string;
  role: string;
  company_id: string;
  company_name?: string;
  expires_at?: string | null;
  accepted_at?: string | null;
}

/**
 * Decode an invite token (base64 of "companyId:email:role" per MVP) and fetch
 * the matching invitation + company row.
 */
export async function loadInvitation(token: string): Promise<{
  invitation: InvitationRecord | null;
  decoded: { companyId: string; email: string; role: string } | null;
  companyName: string | null;
}> {
  let decoded: { companyId: string; email: string; role: string } | null = null;
  try {
    const parts = atob(token).split(':');
    if (parts.length >= 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
      decoded = { companyId: parts[0], email: parts[1], role: parts[2] };
    }
  } catch {
    // Bad token — caller surfaces error.
  }

  if (!decoded) return { invitation: null, decoded: null, companyName: null };

  // Company name fetch — may fail if the user is not yet authenticated; that's
  // fine, we just show a generic message.
  let companyName: string | null = null;
  try {
    const { data } = await supabase
      .from('company')
      .select('name')
      .eq('id', decoded.companyId)
      .maybeSingle();
    companyName = (data?.name as string | null) ?? null;
  } catch {
    /* anonymous-read may be disabled; non-fatal */
  }

  // Invitation row lookup — may also fail anonymously; handled by caller.
  let invitation: InvitationRecord | null = null;
  try {
    const { data } = await supabase
      .from('invitation')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    invitation = (data as InvitationRecord | null) ?? null;
  } catch {
    /* expected for anonymous callers */
  }

  return { invitation, decoded, companyName };
}

// ─── Send invitation Edge Function ────────────────────────────────────────
export interface SendInvitationPayload {
  email: string;
  role: 'Owner' | 'Admin' | 'Sales' | 'Trial Consultant';
  company_id: string;
}

export async function sendInvitation(payload: SendInvitationPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('send-invitation', {
    body: payload,
  });
  if (error) throw error;
}

// ─── Entity fetchers (used as REST fallback by feature hooks) ─────────────
// The local-first runtime keeps these rows in PGlite; these REST fetchers are
// only invoked on a cold graph cache miss (first paint after install).

export async function fetchUserInfoById(id: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('user_info')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCompanyById(id: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('company')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface CreateCompanyInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

/**
 * Create a company row and link it to the current user_info row. Used by the
 * onboarding wizard. Calls a server function so the trigger can also seed the
 * tenant's default metadata_type rows atomically.
 */
export async function createCompanyForOnboarding(
  input: CreateCompanyInput,
): Promise<{ companyId: string }> {
  const { data, error } = await supabase.functions.invoke('onboard-company', {
    body: input,
  });
  if (error) {
    // Fallback: best-effort client-side create when the edge function is not
    // deployed yet (dev). Real production goes through the edge fn.
    const { data: created, error: insertErr } = await supabase
      .from('company')
      .insert({ ...input, is_active: true })
      .select('id')
      .single();
    if (insertErr) throw insertErr;
    const companyId = created.id as string;

    // Attach the company to the current user_info row.
    const auth = useAuthSession.getState();
    if (auth.user) {
      const { error: linkErr } = await supabase
        .from('user_info')
        .update({ company_id: companyId, company_role: 'Owner', account_status: 'active' })
        .eq('auth_user_id', auth.user.id);
      if (linkErr) throw linkErr;
    }
    await useAuthSession.getState().refreshClaims();
    return { companyId };
  }
  await useAuthSession.getState().refreshClaims();
  return data as { companyId: string };
}

/** Update an existing company row (used by Company Settings page). */
export async function updateCompany(
  companyId: string,
  patch: Partial<CreateCompanyInput> & { theme?: Record<string, unknown> | null },
): Promise<void> {
  const { error } = await supabase.from('company').update(patch).eq('id', companyId);
  if (error) throw error;
}

/** Update an existing user_info row (used by Team page for status/role edits). */
export async function updateUserInfo(
  userInfoId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('user_info').update(patch).eq('id', userInfoId);
  if (error) throw error;
}

export async function fetchTeamForCompany(companyId: string): Promise<{
  items: unknown[];
  total: number | null;
  nextCursor: string | null;
}> {
  const { data, error, count } = await supabase
    .from('user_info')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { items: data ?? [], total: count ?? null, nextCursor: null };
}

// ─── Accept invitation Edge Function (server-side bridge update) ──────────
export async function acceptInvitation(token: string): Promise<{
  companyId: string;
  companyName?: string;
  userInfoId?: string;
}> {
  const { data, error } = await supabase.functions.invoke('accept-invitation', {
    body: { token },
  });
  if (error) throw error;
  await useAuthSession.getState().refreshClaims();
  return data as { companyId: string; companyName?: string; userInfoId?: string };
}
