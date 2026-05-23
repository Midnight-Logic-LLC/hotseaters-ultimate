# Landing feature

Marketing landing page for unauthenticated visitors. Bible-faithful port of
`HotSeatersMVP/src/pages/Landing.jsx` (355 lines).

## Verbatim copy (locked, do not vary)

All hero / features / benefits / CTA-band / microcopy strings are captured in
`pages/LandingPage.tsx` as inline constants. The single source of truth for
their wording is `HotSeatersMVP/src/pages/Landing.jsx`.

If the bible changes, port the change into this file. Do not paraphrase, do
not "improve" the copy.

## Theme

Marketing pages use **`MARKETING_THEME`** (bible's `defaultTheme.jsx` —
custom Google Fonts, pale blue page background `#f6fbfe`, max-content-width
96rem). The page applies it on mount via `applyThemeVars(MARKETING_THEME)`.

The custom fonts (`Zen Dots`, `Michroma`, `Montserrat`, `Syncopate`) are
preloaded globally in `index.html`.

## Auth-aware redirect

Bible (Landing.jsx lines 16-46): authenticated visitors never see the
marketing page. The page redirects them via `useEffect` according to:

1. `pending_invitation_token` in `localStorage` → `/AcceptInvite?token=…`
2. `companyId === null` → `/Onboarding`
3. otherwise → `/Dashboard`

Implemented in `LandingPage.tsx` (matches the bible logic verbatim).

## Boundaries

This feature module:

- imports `MarketingShell`, `AuthOptionsDialog` (shared primitives)
- imports `useAuth` (hook layer)
- imports `applyThemeVars`, `MARKETING_THEME` from `@/shared/lib/theme`
- imports lucide icons

It does NOT import stores, supabase, PGlite, electric, or
prometheus-entity-management internals (RULE 3 — components → hooks only).

HotSeatersMVP is the bible. Self-hosted Supabase only.
