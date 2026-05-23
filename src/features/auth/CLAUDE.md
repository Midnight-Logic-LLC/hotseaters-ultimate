# `src/features/auth/` — auth + identity feature

## Hard constraints

1. **Self-hosted Supabase only.** `*.supabase.co` is banned. (RULE 1.)
2. **HotSeatersMVP is the bible.** (RULE 2.) See
   `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/lib/AuthContext.jsx`
   and the legacy `pages/Onboarding.jsx`, `pages/AcceptInvite.jsx`.
3. **Components → hooks → stores → APIs.** (RULE 3.)
4. **`auth.users` is bridged via `user_info.auth_user_id`.** (RULE 6.) Never
   FK a domain table to `auth.users.id`.

## Layer map

| Layer | Allowed imports |
|---|---|
| `pages/`        | `components/ui/*`, `shared/ui/*`, `shared/hooks/*`, `shared/lib/*`, `features/auth/hooks/*`, `features/auth/components/*` |
| `components/`   | `components/ui/*`, `shared/ui/*`, `shared/hooks/*`, `shared/lib/*`, `features/auth/hooks/*` |
| `hooks/`        | `features/auth/stores/*`, `features/auth/business-rules/*`, `features/auth/entities`, `shared/hooks/*`, `shared/lib/*`, and `@prometheus-ags/prometheus-entity-management` (main entry only — NOT `/graph` `/engine` `/adapters/*`) |
| `stores/`       | `shared/db/*`, `shared/lib/*`, `features/auth/entities`, `features/auth/business-rules/*`, `@supabase/supabase-js`, `@prometheus-ags/prometheus-entity-management` |
| `business-rules/` | `shared/lib/*` only. **Pure functions.** |
| `entities.ts`   | `shared/lib/*` only. **Schema data only — no side effects, no I/O.** Registration happens in `stores/auth-store.ts`. |

## Responsibility

- Owns Google OAuth + email magic-link sign-in.
- Owns the SPA OAuth callback (`/auth/callback`).
- Owns the onboarding flow (firm creation + bridge).
- Owns invitation acceptance.
- Owns the `UserInfo` and `Company` entity schema registrations (auth needs
  them up-front).
- Exposes `useAuth()`, `useCurrentUser()`, `useCurrentCompany()`,
  `useCurrentRoles()` — the only auth surface for the rest of the app.

## Hooks contract

- `useAuth()` — session, isAuthenticated, isLoading, companyId, sign-in/out
  actions.
- `useCurrentUser()` — live `user_info` row.
- `useCurrentCompany()` — live `company` row.
- `useCurrentRoles()` — role + predicates + `hasAnyRole`.
- `useInvitation(token)` — invitation decoding + decision + accept action.
- `useAuthCallback()` — orchestrates `/auth/callback`.
- `useOnboarding()` — submit-only orchestration.

## Self-hosted Supabase only. HotSeatersMVP is the bible.
