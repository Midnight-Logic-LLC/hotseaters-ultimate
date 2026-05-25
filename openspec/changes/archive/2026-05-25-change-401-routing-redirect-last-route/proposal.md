# change-401 — routing redirect + last-route persistence

## Why
Brand-new Google sign-ins reach the authenticated subtree but never land on
`/Dashboard`. Bible `App.jsx:97-100` + `Layout.jsx:364-419` redirect to
`/Dashboard` (or `lastViewedPage`) for every authenticated visitor on `/` or
`/Landing`. The port does neither. `/dashboard` (lowercase) also 404s.

## What changes
1. `src/features/landing/pages/landing-page.tsx` — auth-aware redirect
   matching bible branching (pending invite, no userInfo, inactive, no
   company, otherwise last-viewed or `/Dashboard`).
2. `src/app/app-router.tsx` — `/dashboard` lowercase alias →
   `<Navigate to="/Dashboard" replace />`. Mount `<LastRouteTracker />`
   inside `<AuthGate>`.
3. NEW `src/app/last-route-tracker.tsx` — debounced (500 ms) writer for
   `user_info.preferences.lastViewedPage`. Skip-list mirrors bible.
4. `src/features/auth/stores/user-info-store.ts` — `patchPreferences`
   action.

## Out of scope
- Theme changes via company.theme channel (handled by change-403).
- Dashboard widget content (handled by change-402).

## Tasks → see `tasks.md`.
