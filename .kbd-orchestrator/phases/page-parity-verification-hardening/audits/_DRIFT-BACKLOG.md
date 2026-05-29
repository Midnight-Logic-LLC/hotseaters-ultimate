# Drift backlog — page-parity-verification-hardening

Findings from `pnpm test:bible-parity` (deployed bible vs deployed port,
pixelmatch, threshold 0.1). Soft-assert gate is <5% drift. Captured 2026-05-29
via change-V01's extended harness.

## Unauth surface drift (V03/V04 scope → fix in V11)

| Drift | Viewport | Surface | Severity | Notes |
|------:|----------|---------|----------|-------|
| 79.58% | desktop | `/` | 🔴 BLOCKER | Port renders a fundamentally different page from the bible |
| 79.58% | desktop | `/Landing` | 🔴 BLOCKER | Same — marketing surface not at parity |
| 79.58% | desktop | `/Pricing` | 🔴 BLOCKER | Same |
| 78.24% | mobile | `/` | 🔴 BLOCKER | Same |
| 78.24% | mobile | `/Landing` | 🔴 BLOCKER | Same |
| 78.24% | mobile | `/Pricing` | 🔴 BLOCKER | Same |
| 8.91% | mobile | `/login` | 🟡 HIGH | Moderate drift |
| 8.80% | mobile | `/ReferralLanding` | 🟡 HIGH | Moderate drift |
| 7.57% | mobile | `/TermsOfService` | 🟡 HIGH | Moderate drift |
| 7.16% | mobile | `/PrivacyPolicy` | 🟡 HIGH | Moderate drift |
| 5.57% | desktop | `/ReferralLanding` | 🟡 HIGH | Just over gate |
| 4.61% | desktop | `/PrivacyPolicy` | 🟢 PASS | Under 5% gate |
| 4.16% | desktop | `/TermsOfService` | 🟢 PASS | Under gate |
| 3.15% | desktop | `/login` | 🟢 PASS | Under gate |
| 2.34% | mobile | `/pending-approval` | 🟢 PASS | At parity |
| 2.32% | mobile | `/account-rejected` | 🟢 PASS | At parity |
| 2.26% | mobile | `/accept-invite?token=fake` | 🟢 PASS | At parity |
| 0.50% | desktop | `/pending-approval` | 🟢 PASS | At parity |
| 0.50% | desktop | `/account-rejected` | 🟢 PASS | At parity |
| 0.48% | desktop | `/accept-invite?token=fake` | 🟢 PASS | At parity |

## Top finding (needs root-cause in V03)

`/`, `/Landing`, `/Pricing` show **~79% drift** at both viewports — an order of
magnitude beyond "polish." This is not subtle copy/color drift; the deployed
port is rendering a substantially different page. Likely causes to investigate
in V03:

1. The deployed port's marketing routes were not included in the last deploy
   (the W1 public-surface commit may not have shipped to
   `hotseaters-ultimate.prometheusags.ai`).
2. `/` redirects to a different layout (login/dashboard) on the port vs the
   bible's marketing home.
3. A build/routing regression on the deployed bundle.

**Action:** V03 must first confirm what the deployed port actually serves at
`/` (screenshot review in `.artifacts/bible-parity/desktop/root/port.png`)
before assuming a code defect. Per RULE 0.4, diagnose from the rendered output,
not the source.

### Diagnosis (2026-05-29, change-V01 follow-up)

Confirmed by inspecting the captured artifacts + live HTML:

- `bible.png` at `/` → full marketing landing ("The Complete Technology Toolkit
  for Trial Techs", Purpose-Built Features, From Chaos to Clarity, HotSeatHub,
  "Ready to Transform Your Business?" CTA).
- `port.png` at `/` → **completely blank** (empty surface, no content rendered).
- `curl https://hotseaters-ultimate.prometheusags.ai/` → SPA shell + bundle
  (`/assets/index-CiwlaRa7.js`) **are served correctly**. So this is a runtime
  render gap, not a 404/500.

**Most likely cause: the deployed bundle is STALE** — it predates the W1
public-surface port (`landing-page.tsx`) and/or the Pattern 4 + PGliteProvider
commits that are on `main` but may not have been deployed to
`hotseaters-ultimate.prometheusags.ai`. The landing source exists in the repo
(`src/features/landing/pages/landing-page.tsx`) and the route is wired
(`app-router.tsx` path="/"). 

**Next step (deploy verification, owner action):** confirm whether the deployed
bundle hash matches current `main`. If stale → redeploy and re-run
`pnpm test:bible-parity`; the ~79% drift on `/`, `/Landing`, `/Pricing` should
collapse. If a fresh deploy still renders blank → it IS a code/runtime defect
(e.g. the landing route crashing on the deployed Supabase/Electric env) and
becomes a V11 code fix. **Do not assume code drift until the deploy is
confirmed current.**

The 3–9% drifts on `/login`, `/ReferralLanding`, `/Terms*`, `/Privacy*` are
genuine page-level drift to audit per-page in V03/V04 regardless of the deploy
question.

## Authed surfaces

Not yet measured — require committed baselines (V05–V09, needs bible app local).
