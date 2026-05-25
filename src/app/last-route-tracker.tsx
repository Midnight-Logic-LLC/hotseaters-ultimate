/**
 * LastRouteTracker — bible parity for
 * `HotSeatersMVP/src/Layout.jsx:443-479`. Renders null. Listens to React
 * Router pathname changes, derives the bible-style `currentPageName`
 * (first path segment), and after a 500 ms debounce writes
 * `user_info.preferences.lastViewedPage` via the userInfo store.
 *
 * Skip-list mirrors the bible's `skipPages` (extended with auth public
 * paths the bible doesn't have because auth happens at the
 * `AuthenticatedApp` layer there).
 *
 * No-ops when `userInfo` is null (cold boot, signed-out).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { patchPreferences } from '@/features/auth/stores/user-info-store';

// Bible: Layout.jsx:443 plus the auth public paths our app surfaces.
const SKIP_PAGES = new Set<string>([
  'Landing',
  'Onboarding',
  'AcceptInvite',
  'SignDocument',
  'ViewDocument',
  'PrivacyPolicy',
  'TermsOfService',
  'login',
  'register',
  'forgot-password',
]);

const DEBOUNCE_MS = 500;

/** Derive the bible-style page name from a pathname (`/Trials/123` → `Trials`). */
export function pathnameToPageName(pathname: string): string {
  const trimmed = pathname.replace(/^\/+/, '');
  if (!trimmed) return '';
  const seg = trimmed.split('/')[0];
  return seg ?? '';
}

export function LastRouteTracker(): null {
  const location = useLocation();
  const { userInfo } = useCurrentUser();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userInfo) return;
    const pageName = pathnameToPageName(location.pathname);
    if (!pageName) return;
    if (SKIP_PAGES.has(pageName)) return;

    const previousPreferences =
      (userInfo.preferences as Record<string, unknown> | null) ?? {};
    if (previousPreferences['lastViewedPage'] === pageName) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void patchPreferences(
        { lastViewedPage: pageName },
        {
          userInfoId: userInfo.id,
          previousPreferences,
        },
      ).catch((err: unknown) => {
        // Bible Layout.jsx:464 swallows write failures with a warn — match.
        const msg = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.warn('LastRouteTracker: failed to save lastViewedPage:', msg);
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [location.pathname, userInfo]);

  return null;
}
