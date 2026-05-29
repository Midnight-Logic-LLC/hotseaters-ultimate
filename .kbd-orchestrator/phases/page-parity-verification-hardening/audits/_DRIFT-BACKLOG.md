# Drift backlog — page-parity-verification-hardening

Findings from `pnpm test:bible-parity` (deployed bible `hotseaters.com` vs
deployed port `hotseaters-ultimate.prometheusags.ai`, pixelmatch threshold 0.1).
Soft-assert gate <5% drift.

## ⚠️ CRITICAL CALIBRATION FINDING (2026-05-29)

**The deployed bible (`hotseaters.com`) is AHEAD of the bible SOURCE in the
repo.** Per RULE 2, the bible **source** (`HotSeatersMVP/src/pages/*.jsx`) is
ground truth — NOT the deployment.

Evidence: bible source `Landing.jsx:179` has a **white hero**
(`<section className="max-w-7xl mx-auto px-6 py-20 lg:py-32">` over the page's
`from-stone-50` gradient, dark headline). The deployed `hotseaters.com` shows a
**dark navy hero banner** with reversed-out white text. These are different
designs → the deployment was redesigned after the source snapshot we hold.

**Consequence:** the deployed-vs-deployed drift numbers for the marketing pages
are measuring the port against a *moving target that is itself ahead of ground
truth*. A high drift here does NOT mean the port is wrong — the port faithfully
matches the bible source (verified line-by-line in audits/landing.md +
audits/pricing.md, both PASS).

## Post-PGlite-fix drift (2026-05-29, after commit 77e285b deployed)

| Drift | Viewport | Surface | Interpretation |
|------:|----------|---------|----------------|
| 83.31% | mobile | `/Pricing` | Port renders correctly (verified); deployed bible likely redesigned |
| 80.69% | desktop | `/Pricing` | Same |
| 80.55% | mobile | `/` `/Landing` | Port renders full page (50k DOM, no errors); hero design differs from *deployed* bible, MATCHES bible source |
| 56.35% | desktop | `/` `/Landing` | Same — was 79% pre-fix (page was blank); now renders, residual = bible-deploy-ahead-of-source |
| 17.2-17.3% | both | `/ReferralLanding` | Real moderate drift — audit vs SOURCE in V03 |
| 13-15% | mobile | `/login`, `/TermsOfService`, `/PrivacyPolicy` | Real drift — audit vs SOURCE |
| 7-8% | desktop | `/PrivacyPolicy`, `/TermsOfService` | Real moderate drift |
| 0.9-5.5% | both | `/login`(d), `/accept-invite`, `/pending-approval`, `/account-rejected` | 🟢 At/near parity |

## What changed pre→post fix

- The PGlite crash fix (`77e285b`) **resolved the blank-page production bug** —
  the deployed `/` went from 0-char blank (`#root` empty, pageerror) to full
  render (50,469 chars, all sections, zero console errors). **This was the real
  customer-facing bug and it is FIXED in production.**
- Drift did NOT collapse to <5% as first predicted, because the residual is
  NOT a port defect — it's the deployed-bible-ahead-of-source calibration issue
  above. `/` desktop dropped 79%→56% (the blank page now renders); `/Pricing`
  reads ~80% because the deployed bible's pricing page was also redesigned.

## Revised V03/V11 actions

1. **Marketing pages (`/`, `/Landing`, `/Pricing`):** port matches bible
   SOURCE (PASS). Do NOT "fix" the port to chase the deployed bible — that
   would violate RULE 2 (source is ground truth). **Escalate to the user:**
   should the bible SOURCE be refreshed from the newer deployed design, or is
   the source the intended target? This is a ground-truth decision only the
   owner can make.
2. **`/ReferralLanding` (17%), policy pages (7-15%):** audit against the bible
   SOURCE in V03. These may be genuine port drift OR the same deploy-ahead
   issue — the source audit decides.
3. **Auth utilities (≤5.5%):** at parity, no action.

## Bottom line

The scary 79% number was TWO separate things, now disentangled:
- **A real production bug** (blank page from the PGlite crash) → **FIXED + deployed**.
- **A measurement-calibration issue** (deployed bible ahead of source) → needs a
  ground-truth decision from the owner, not a code fix.
