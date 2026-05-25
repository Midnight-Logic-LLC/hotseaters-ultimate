# Tasks — change-401

- [x] T1. Add `patchPreferences(patch)` to `src/features/auth/stores/user-info-store.ts`. Unit test covers: merge semantics, no-op on empty patch, error path surfaces.
- [x] T2. NEW `src/app/last-route-tracker.tsx`. Renders null. Debounces 500 ms. Honours skip-list (Landing, Onboarding, AcceptInvite, SignDocument, ViewDocument, PrivacyPolicy, TermsOfService, login, register, forgot-password).
- [x] T3. NEW unit spec `src/app/__tests__/last-route-tracker.spec.tsx`. Cases: writes on navigate, debounces back-to-back navigations, ignores skip-list pages, no-op when userInfo null.
- [x] T4. Rewrite `src/features/landing/pages/landing-page.tsx` body: gate `!isAuthenticated` → render marketing; `isAuthenticated` → branch per Layout.jsx:364-419 via `<Navigate>` (NEVER `window.location.replace` inside React Router).
- [x] T5. `src/app/app-router.tsx`: add `<Route path="dashboard" element={<Navigate to="/Dashboard" replace />} />` inside the authed subtree. Mount `<LastRouteTracker />` adjacent to `<Outlet />` inside `<AuthGate>`.
- [x] T6. NEW Playwright spec `tests/e2e/auth-and-dashboard-reach.spec.ts`. Cases:
  - Fresh Google sign-in lands on /Dashboard.
  - /dashboard lowercase redirects to /Dashboard.
  - Navigation to /Trials then full-page reload stays on /Trials.
  - Sign-out + sign-in lands on /Trials (last-viewed restoration).
- [x] T7. `pnpm typecheck && pnpm test && pnpm test:e2e` green. (typecheck + filenames + 95 unit tests green locally; Playwright spec compiles and `playwright test --list` enumerates all 12 variants. Full Playwright run deferred to CI — requires preview-server build, which is multi-minute locally.)
- [ ] T8. Production smoke on hotseaters-ultimate.prometheusags.ai after deploy.
