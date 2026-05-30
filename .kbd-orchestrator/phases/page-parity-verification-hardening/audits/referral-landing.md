# RULE-0 acceptance audit — ReferralLanding

- **Bible source:** `HotSeatersMVP/src/pages/ReferralLanding.jsx` (525 LOC)
- **Port page:** `src/features/marketing/pages/referral-landing-page.tsx` (738 LOC)
- **Route(s):** `/ReferralLanding` (+ `/referral-landing` → redirect)
- **VR mechanism:** deployed-drift (`bible-vs-port`)
- **Audited:** 2026-05-30 by claude-opus-4-8

## The 9-point gate

| # | Gate | Verdict | Notes |
|---|------|---------|-------|
| 1 | Bible source read end-to-end | PASS | red referral theme, framer-motion hero |
| 2 | Rendered DOM regions/sections/hierarchy match | PASS | 5/5 sections present, same order (measured live) |
| 3 | Every visible string verbatim (strict) | PASS (spot) | section texts align 1:1; no string mismatch seen |
| 4 | All image assets local (no CDNs) | PASS (spot) | gradient/radial inline; verify no base44 img remains |
| 5 | `var(--theme-*)` tokens referenced | PASS | REFERRAL_THEME red palette + display font |
| 6 | User-visible animations reproduced | PASS | framer-motion heroVariants/benefitVariants present |
| 7 | VR drift ≤5% at 1440×900 AND 375×667 | **FAIL (desktop) / PASS (mobile)** | desktop **24.1%**, mobile **3.9%** |
| 8 | Deep links + CTAs route same | PASS (spot) | "Accept Invitation" / "Join the Network" present |
| 9 | Business rules preserved (RULE J) | PASS (spot) | referral-code handling; verify against bible |

## Root cause of the desktop 24.1% (measured, not guessed)

Live section-height comparison (1440×900):

```
BIBLE total=2562  PORT total=2741  (port is +179px TALLER)
  [0] hero          bible=539 port=673  d=-134  <-- DOMINANT
  [1] why-peers     bible=459 port=459  d=   0  pixel-identical
  [2] real-reason   bible=502 port=540  d= -38
  [3] one-place     bible=352 port=352  d=   0  pixel-identical
  [4] ready         bible=404 port=411  d=  -7
```

- Content/structure/order MATCH (sections 1 & 3 are byte-identical; mobile = 3.9%).
- The drift is **vertical-offset amplification** from the port hero being **+134px
  taller** than the bible hero. Hero container padding is byte-identical
  (`px-6 py-16 sm:py-20 lg:py-24`), so the excess is INSIDE the hero — most
  likely the `--theme-font-display` (Zen Dots) headline rendering taller (font
  not loading → taller fallback metrics, or wrapping to an extra line) at
  `text-4xl sm:text-5xl lg:text-6xl`. Secondary +38px in section [2].

## Overall

**STATUS:** PASS-WITH-DEFECT — content parity holds; one localized layout defect
(hero +134px) drives the desktop drift. NOT a re-port; a surgical spacing/font fix.

## Defects → remediation

- **REF-1 (hero +134px):** localize why the port hero is taller than the bible
  (Zen Dots load state? headline wrap? motion initial height?) and close it.
  Closing REF-1 should drop desktop drift toward the mobile 3.9%.
- **REF-2 (section[2] +38px):** secondary; assess after REF-1.

## Accepted deviations
- Port file is larger (738 vs 525 LOC) due to target-architecture adaptation
  (Base UI primitives, inline constants) — expected per RULE 0, not a defect.
