# change-V11 — Drift remediation

## Why
V03–V10 surface parity defects (copy drift, color/token mismatch, missing
sections, font weight, wrong deep links, missing business rules). This change
fixes them. Per the prior phase's known issue, deployed copy contains drift
(e.g. "90 days" vs bible's "14 days") — fix to match the bible.

## What changes
Fix every defect in the V03–V10 backlog. Per RULE 0.3, systemic primitive bugs
(wrong cursor/font/border across pages) are fixed in
`src/components/ui/<primitive>.tsx` and/or `src/index.css`, NOT per-page. Use
RULE 0.4 (`getComputedStyle` diagnostic) to root-cause visual defects from the
resolved computed value, not the source CSS.

### Pre-confirmed defects from /kbd-analyze (2026-06-28)

These are confirmed via source-code analysis and do NOT require waiting for V03–V10 audits:

**S-1 — Marketing page font override bug (P0 — blocks Landing/ReferralLanding/Pricing visual parity)**
- Root cause: `applyThemeVars(DEFAULT_THEME)` in `app-providers.tsx:36` sets `--theme-font-body: system-ui` as an **inline style** on `<html>`. Marketing pages emit `generateThemeCSS(MARKETING_THEME)` via a `<style>` tag, which loses to inline styles regardless of order.
- Fix: Replace the `<style>{generateThemeCSS(MARKETING_THEME)}</style>` tag in each marketing page with `useEffect(() => { applyThemeVars(MARKETING_THEME); return () => applyThemeVars(DEFAULT_THEME); }, [])`.
- Files: `src/features/landing/pages/landing-page.tsx`, `src/features/marketing/pages/referral-landing-page.tsx`, `src/features/marketing/pages/pricing-page.tsx`, `src/features/marketing/pages/privacy-policy-page.tsx`, `src/features/marketing/pages/terms-of-service-page.tsx`.

**S-2 — Dialog theming selectors missing from `src/index.css` (P0)**
- Root cause: Bible's `globals.css` applies `[role="dialog"]` CSS selectors for `font-family`, `border-radius`, `box-shadow`, `background-color` globally. These rules are absent from the port's `src/index.css`.
- Fix: Port the `[role="dialog"]`, `[role="dialog"] h2`, `[role="dialog"] input/textarea/select/button` selector rules from `HotSeatersMVP/src/globals.css` into `src/index.css`.
- File: `src/index.css`.

**S-3 — Verify iOS standalone @media + Quill .ql-align-* classes (P0)**
- Bible `index.css` has `@media (display-mode: standalone)` iOS viewport lock rules and `.ql-align-*` Quill editor classes. Confirm both exist in port `src/index.css` and add if missing.

## Impact
Production code. Scope = defects found. Depends on V03–V10.
