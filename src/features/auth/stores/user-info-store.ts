/**
 * features/auth/stores/user-info-store.ts — userInfo-row mutation actions.
 *
 * Bible parity: `HotSeatersMVP/src/Layout.jsx:447-467` writes
 * `user_info.preferences` via `base44.entities.UserInfo.update(...)` with
 * merge semantics. The local mirror does the same against the
 * `user_info` table — the local-first runtime propagates the change back
 * into the entity graph through Realtime / RTS.
 *
 * `patchPreferences(patch)` is the single write path used by
 * `<LastRouteTracker>` (change-401) and any future preference-writing
 * surface (sidebar collapse, theme overrides, etc.).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';
import { useAuthSession } from '@/shared/db/auth-session';

const USE_LEGACY_HOSTED_USER_INFO_SCHEMA =
  import.meta.env.VITE_SUPABASE_URL === 'https://hotbase.prometheusags.ai';

interface PatchPreferencesOptions {
  /**
   * The user_info row id to patch. Defaults to the current session's
   * `user_metadata.user_info_id`. Tests pass it explicitly.
   */
  userInfoId?: string;
  /**
   * The previous preferences object — merged with `patch` to form the new
   * value. Defaults to `{}` so a missing column starts fresh. Callers that
   * already have the row in hand (e.g. the route tracker) should pass it to
   * avoid clobbering keys this writer doesn't know about.
   */
  previousPreferences?: Record<string, unknown> | null;
}

/**
 * Patch `user_info.preferences` with merge semantics:
 *   next = { ...previousPreferences, ...patch }
 *
 * No-ops when `patch` is empty. Throws on Supabase error so the caller can
 * decide whether to log or surface. The tracker logs and swallows.
 */
export async function patchPreferences(
  patch: Record<string, unknown>,
  options: PatchPreferencesOptions = {},
): Promise<void> {
  if (!patch || Object.keys(patch).length === 0) return;
  if (USE_LEGACY_HOSTED_USER_INFO_SCHEMA) return;

  const userInfoId =
    options.userInfoId ??
    ((useAuthSession.getState().user?.user_metadata?.user_info_id as
      | string
      | undefined) ??
      null);
  if (!userInfoId) return;

  const prev = options.previousPreferences ?? {};
  const next: Record<string, unknown> = { ...prev, ...patch };

  const { error } = await supabase
    .from('user_info')
    .update({ preferences: next })
    .eq('id', userInfoId);
  if (error) throw error;
}
