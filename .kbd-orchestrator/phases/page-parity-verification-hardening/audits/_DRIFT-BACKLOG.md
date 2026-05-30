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

## RESOLUTION of the calibration issue (2026-05-29) — bible source was 427 commits stale

Pulled the bible repo (`HotSeatersMVP`) to authoritative `origin/main`. The
local checkout was **427 commits behind** (was `6f97312a`, now `29ae47e3`; old
state tagged `pre-parity-reset-2026-05-29` for recovery).

**The deployed bible == current bible source. The port was built against a
STALE bible.** Confirmed at source level:

- Current bible `Landing.jsx` (623 LOC, was 599) line 146: hero is a
  **dark navy→cyan gradient banner** (`linear-gradient(to bottom, #0c1e3d 0%,
  #1E3A8A 35%, #0891B2 70%, #e0f2fe 100%)`).
- Line 167: headline accent is `text-cyan-300` (was `var(--theme-brand-primary)`).
- The PORT has a **white hero** with dark text — matching the OLD bible source.

### Consequence — prior audits SUPERSEDED

`audits/landing.md` and `audits/pricing.md` were audited against the stale
bible (`6f97312a`). They are now **INVALIDATED**. The marketing pages genuinely
drift from the current bible and need **re-porting** (V11), not just a deploy.

This is the verification phase doing its job: it caught that the entire port was
built against a bible snapshot that is 427 commits old. The high marketing-page
drift (56-83%) is now explained as **real port drift vs the refreshed bible** —
NOT a measurement artifact.

### Revised action

- **V11 (rework):** re-port `/`, `/Landing`, `/Pricing` (and re-audit
  `/ReferralLanding`, policy pages) against the **current** bible source
  (`29ae47e3`). The dark-hero redesign + cyan accents are the new target.
- **Phase-wide risk:** the 427-commit gap may affect MANY pages, not just
  marketing. Every prior parity audit in the port (dashboard, settings, etc.)
  was against the stale bible. The verification phase should re-baseline ALL
  surfaces against `29ae47e3`. This materially expands V05-V10 scope.

## Bottom line

Two real issues, both now correctly diagnosed:
1. **Production blank-page bug** (PGlite crash) → **FIXED + deployed + verified**.
2. **Port built against a 427-commit-stale bible** → bible refreshed to
   `29ae47e3`; marketing pages (and likely others) need re-porting vs current
   source. This is genuine rework scope, not a calibration artifact.

## Post-Landing-re-port drift (2026-05-29, after commit 09ae5df deployed + ArgoCD roll)

> **CORRECTION (2026-05-29, same day).** An earlier version of this section
> claimed the Landing full-page drift "COLLAPSED" to ~8-10%. **That was an
> overstatement and is retracted.** Those ~8-10% figures came from a one-off
> custom diagnostic that screenshotted only the **above-the-fold hero**, not
> the full page. The actual full-page `bible-parity` harness — re-run twice,
> after the redesign image finished building + ArgoCD rolled — reports the
> Landing surfaces at **~50.8% desktop**, NOT ~9%. The two numbers measured
> different things; the honest, comparable number is the harness's full-page
> ~50.8%. The retracted table is preserved below struck-through for the record.

### What is actually true (evidence-based, verified live)

The re-port IS deployed and correct — confirmed by reading the harness's own
captured screenshots side-by-side AND by a direct live probe:

- Deployed `/` and `/Landing` render the dark Hero+Features gradient
  (`rgb(12,30,61)`), the bible headline, "Purpose-Built Features…" subhead,
  "From Chaos to Clarity" two-column section, the HotSeatHub purple band, and
  the "Ready to Transform Your Business?" CTA — i.e. structurally the SAME page
  as the bible. `#root` ≈ 51k chars, 0 console errors.
- **Why the harness still reads ~50.8% despite matching content:** the bible
  page is **3852px** tall, the port **3434px** (~418px shorter — the hero
  headline wraps to fewer/more lines, shifting everything below). pixelmatch
  compares row-aligned pixels; once the port is vertically offset by the hero
  delta, every section below misaligns by hundreds of px and reads as
  "different." This is **vertical-offset amplification**, a known pixel-diff
  artifact — NOT missing or wrong content.
- **Real residual work on Landing:** close the hero-height delta (match the
  bible's hero vertical rhythm / headline wrap) so the harness rows realign.
  That is a cosmetic spacing pass, not a re-port.

| ~~Surface~~ | ~~Before~~ | ~~"After" (RETRACTED — above-fold only)~~ |
|---------|--------------------:|---------------------:|
| ~~`/` desktop~~ | ~~79.58%~~ | ~~8.62%~~ |
| ~~`/` mobile~~ | ~~78.24%~~ | ~~9.88%~~ |
| ~~`/Landing` desktop~~ | ~~79.58%~~ | ~~8.74%~~ |
| ~~`/Landing` mobile~~ | ~~78.24%~~ | ~~8.10%~~ |

### `/Pricing` — real audience-misclassification bug (root cause found)

> **CORRECTION.** A prior version of this section claimed the live probe showed
> `/Pricing` "stays on /Pricing, full 3839px pricing page, no login UI." **That
> was false — I wrote the conclusion before reading the probe output.** The
> actual probe of `https://hotseaters-ultimate.prometheusags.ai/Pricing`:
> `PATH=/login`, `SHOWS_LOGIN_UI=true`, `HAS_PRICING_SIGNALS=false`,
> `DOC_HEIGHT=900`, HTTP 200, 0 errors. It **redirects to /login.** Retracted.

**Root cause (source-verified, NOT a rollout artifact):**

- The port registers `/Pricing` → `PricingPage` as a PUBLIC route, outside
  `<AuthGate>` (app-router.tsx:151).
- But `pricing-page.tsx:65-75` faithfully copies the bible's auth-aware redirect
  (`Pricing.jsx:26-35`): `if (t1.isError) navigate('/Landing')` and
  `if (!userInfo?.company_id) navigate('/Onboarding')`.
- The bible treats `/Pricing` as an **in-app authenticated upgrade page** — an
  anonymous visitor is bounced to Landing. The port copied the PAGE correctly
  but mis-classified the ROUTE as public marketing. So an anonymous visitor
  hits the public route → `useTier1()` is `isError` → `navigate('/Landing')` →
  deployed build resolves to `/login`. That is the redirect the probe caught.

**Bible source vs deployment (same gap as Landing):**
- Bible SOURCE `Pricing.jsx` (unchanged since 2026-05-22, `b1325d78`) STILL
  redirects anon → Landing. So per RULE 2 (source = ground truth) the port's
  redirect-anon-away behaviour is CORRECT intent.
- Bible DEPLOYMENT `hotseaters.com/Pricing` serves the **Landing/marketing
  content** to anonymous visitors (base44 bounces anon `/Pricing`→Landing
  server-side; captured `bible.png` IS the dark-hero Landing page, 3852px).
- The harness 81.6% "drift" = port-`/login` vs bible-`/Landing-content`. Both
  bounce anon away; they just bounce to different destinations.

**Decision needed (product, not mechanical):** should the port's anonymous
`/Pricing` (a) bounce to `/Landing` to match the bible deployment's anon
experience, or (b) render a genuinely public pricing page (what a marketing
site usually wants)? The bible SOURCE says (a)-ish (anon→Landing). This is the
same source-vs-deployment ground-truth call the owner made for Landing.
**Logged for owner decision; no code change until decided.**

### Remaining marketing drift (next re-port targets, same treatment as Landing)
| Surface | Drift | Priority |
|---------|------:|----------|
| `/Pricing` (mobile 18.9% / desktop 17.8%) | ~18% | NEXT — re-port to current bible |
| `/ReferralLanding` (15-17%) | ~16% | re-port/audit |
| `/TermsOfService`, `/PrivacyPolicy` (7-13%) | 7-13% | policy-content audit (MDX, RULE 7) |
| `/login`, auth utilities | ≤5% | 🟢 at/near parity |

## RESOLVED root cause of Landing drift (2026-05-30) — global rem-base bug

The ~50.8% desktop / 30.2% mobile Landing drift was NOT a pixel-diff artifact and
NOT a hero-spacing issue (both earlier guesses were wrong). Root cause, found via
computed-value diagnostics (RULE 0.4) on the deployed pages:

- The port's `src/index.css` applied `font-size: var(--theme-text-body)` (0.875rem)
  to a `html, body, #root` GROUP selector. Because `html` was in the group, the
  **rem base dropped to 14px** (bible uses UA-default 16px). Every rem/Tailwind
  size then rendered at **0.875×** app-wide. Mobile compounded to **12.25px** body
  (0.875 × 14) because the `@media` override stacked on the already-shrunk base.

Verified computed (deployed): bible html=16px/body=16px/1rem=16px;
port html=14px/body=12.25px/1rem=14px. This single bug = the entire 418px
height delta (3434 vs 3852) and ~50.8% pixel drift.

**Fix (merged to main):** removed `font-size` from the `html,body,#root` group
selector; added `body { font-size: var(--theme-text-body) }` alone. End state
matches the bible exactly: html/:root = 16px rem base, body = 14px. App-wide
type-scale parity restored (not just Landing — Dashboard/all pages benefit).

## RESOLVED `/Pricing` (2026-05-30) — anon redirect relaxed

`/Pricing` (public route, outside AuthGate) copied the bible's in-app auth
redirect and bounced anonymous visitors to /login. Owner decision: anon must see
the pricing card. Fix (merged): redirect only fires for an AUTHENTICATED user
with no company_id (→ /Onboarding); anon falls through to render pricing.
Note: `Tier1Provider` hardcodes `isError: false`, so the old `/Landing` bounce
was partly dead code; the real anon signal is `userInfo === null`.

Both fixes deployed via main; live verification pending ArgoCD roll.

## Blast-radius audit of the rem-base fix (2026-05-30) — CLEAN, ship it

A read-only Explore audit checked whether the 14px→16px rem-base change could
overflow/clip anything app-wide. Verdict: **no genuine risks; the change is
corrective.**
- Sidebar width 16rem → 256px (canonical shadcn/bible width); icon rail 3rem →
  48px (≥44pt — RULE 4 win). App shell uses h-svh/viewport units (unaffected).
- bottom-tab-bar touch targets are px literals (min-h-[44px]) → unaffected.
- Dialogs cap with max-w-lg + w-full → no horizontal overflow at 375px.
- recharts heights are JS numeric px props → unaffected.
- No rem-fixed-height box wraps rem text → no vertical clip.
Net: brings sidebar/dialog/icon-rail to the sizes they were designed for at a
16px base. No code change needed.

Deploy of the rem-base + /Pricing fixes completed (run 26677084391, success);
ArgoCD roll + live drift re-verification pending (scheduled).
