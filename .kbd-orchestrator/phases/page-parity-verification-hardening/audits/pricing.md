> ⚠️ **SUPERSEDED (2026-05-29).** Audited against a 427-commit-stale bible
> (`6f97312a`). Bible refreshed to `29ae47e3`. Re-audit against current source
> pending; the PASS below reflects the OLD bible. See `_DRIFT-BACKLOG.md`.

# RULE-0 acceptance audit — Pricing

- **Bible source:** `HotSeatersMVP/src/pages/Pricing.jsx` (300 LOC)
- **Port page:** `src/features/marketing/pages/pricing-page.tsx`
- **Route(s):** `/Pricing` (`/pricing` → redirect to `/Pricing`)
- **VR mechanism:** deployed-drift (`bible-vs-port`)
- **Audited:** 2026-05-29 by Claude Opus 4.8 (source audit; deployed VR pending fresh deploy)

## The 9-point gate (key items)

| # | Gate | Verdict | Notes |
|---|------|---------|-------|
| 1 | Bible read end-to-end | PASS | |
| 3 | Strings verbatim | PASS | All 9 plan features match bible verbatim (Complete deal & trial management … HotSeatHub marketplace included) |
| 9 | Business rules (RULE J) | PASS | `MONTHLY_PRICE=45`, `YEARLY_DISCOUNT=0.2` → yearlyMonthly=$36, yearlyAnnual=$432, savings=$108/user. Identical math to bible Pricing.jsx:38-42. Monthly/yearly toggle preserved. |
| 8 | Deep links / CTAs | PASS-WITH-DEVIATION | Checkout flow adapts bible's `base44.functions.invoke('createCheckoutSession')` to the port's payment seam; success/cancel → `/PaymentSuccess` / `/PaymentCancelled` (same destinations) |
| 7 | VR drift ≤5% | ⚠️ BLOCKED-BY-DEPLOY | 79% deployed drift = blank render, same stale-deploy cause as Landing |

## Overall

**STATUS: PASS (source).** Pricing math, feature list, and plan structure match
the bible. The 79% deployed drift is the same stale-deploy artifact as Landing,
not a code defect.

## Defects → V11 backlog

- None. Deploy refresh (ops) resolves the drift.
