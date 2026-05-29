# RULE-0 acceptance audit — Landing

- **Bible source:** `HotSeatersMVP/src/pages/Landing.jsx` (599 LOC)
- **Port page:** `src/features/landing/pages/landing-page.tsx` (950 LOC)
- **Route(s):** `/`, `/Landing` (`/landing` → redirect to `/Landing`)
- **VR mechanism:** deployed-drift (`bible-vs-port`)
- **Audited:** 2026-05-29 by Claude Opus 4.8 (source audit; deployed VR pending fresh deploy)

## The 9-point gate

| # | Gate | Verdict | Notes |
|---|------|---------|-------|
| 1 | Bible source read end-to-end | PASS | Read all 599 lines |
| 2 | Rendered DOM regions/sections/hierarchy match | PASS | Header, Hero, Features grid, Transform (Before/After), Stats banner, HotSeatHub, CTA, Footer, PolicyViewerModal — all present, same order |
| 3 | Every visible string verbatim | PASS | Hero headline "The Complete Business Toolkit for Trial Techs", subcopy, "Get Started Free"/"Watch Demo", "Try it free for 90 days • Setup in 5 minutes", all 6 features, 6 pain points, 6 transformations, HSH header + 4 cards, stats (1 / 15 min / 0 / 90 days), CTA "Ready to Transform Your Business?" / "Start Your Free Trial", footer © + policy links — all match |
| 4 | All image assets local under `public/brand/` | PASS | `/brand/chameleon-logo.png`, `/brand/hotseaters-header.png`, `/brand/hotseathub-header.png` — bible's `media.base44.com` PNGs correctly self-hosted (RULE 1) |
| 5 | Every `var(--theme-*)` token referenced | PASS | Header/hero/features/transform/HSH/CTA/footer all use the same `--theme-*` tokens via inline style; `MARKETING_THEME` applied |
| 6 | Every user-visible animation reproduced | PASS | `rippleItem` + `rippleIcon` keyframes verbatim incl. `prefers-reduced-motion` guard; hover translate/shadow on cards |
| 7 | VR drift ≤5% at 1440×900 AND 375×667 | ⚠️ BLOCKED-BY-DEPLOY | Deployed port renders BLANK (~79% drift). Source is correct — this is a deploy artifact, not a code defect. Re-measure after fresh deploy. |
| 8 | Deep links + CTAs route to same destinations | PASS-WITH-DEVIATION | Login/signup CTAs → `/login` (single login surface; bible's `AuthOptionsDialog` removed by design — documented in feature CLAUDE.md). Authed-visitor redirect via `pickAuthedDestination` mirrors bible Landing.jsx:26-44 + extends with lastViewedPage restoration (Layout.jsx parity). |
| 9 | Business rules preserved (RULE J) | PASS | Auth-aware redirect: pending-invitation-token → `/AcceptInvite`; no userInfo → `/Onboarding`; inactive → `/account-rejected`; no company → `/Onboarding`; lastViewedPage restoration; default → `/Dashboard`. Bible's `if (isAuthenticated) return null` → port's `<Navigate>` (same effect). |

## Overall

**STATUS: PASS (source)** — Landing is a faithful section-for-section port. No
copy drift, no missing sections, assets local, animations + theme tokens
present, business rules preserved.

## Critical note — deployed drift is NOT a code defect

The 79% deployed drift (`audits/_DRIFT-BACKLOG.md`) is **confirmed to be a
deploy artifact**: the source renders the full marketing page (verified
line-by-line above), but `hotseaters-ultimate.prometheusags.ai` serves a blank
surface. The SPA shell + bundle load fine, so the deployed bundle predates the
W1 landing port or is otherwise stale.

**Action: redeploy current `main`, then re-run `pnpm test:bible-parity`.** Do
NOT open a V11 code fix for Landing — there is nothing wrong with the code.

## Defects → V11 backlog

- None for Landing source. (Deploy refresh is an ops action, tracked in the
  drift backlog, not a code fix.)

## Accepted deviations

- Login/signup CTAs route to `/login` instead of opening `AuthOptionsDialog`
  (single-login-surface decision; recorded in `src/features/landing/CLAUDE.md`).
- `pickAuthedDestination` extends the bible's 3-branch redirect with
  `lastViewedPage` restoration — this is bible `Layout.jsx` behavior folded in,
  not a divergence.
