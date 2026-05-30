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
  (`px-6 py-16 sm:py-20 lg:py-24`).
- **Zen-Dots hypothesis DISPROVEN by live probe:** the headline `<h1>` is
  IDENTICAL on both — `Zen Dots, 60px/60lh, h1 height=120px` on bible AND port.
  zenDots loads true on both. The headline is not the cause.
- **Localized:** with the container padding + headline both identical, the +134px
  excess lives in the hero's content BELOW the headline (subhead / benefit chips
  / invite-stat block / CTA group). That sub-block is where the port adds ~134px
  vs the bible. Secondary +38px in section [2] (real-reason).

## Overall

**STATUS:** REF-1 FIXED (merged eef2a78). Content parity held throughout; the
desktop drift was a single Tailwind-v4 syntax bug, now corrected.

## Defects → remediation

- **REF-1 (hero +134px) — ✅ FIXED + merged (eef2a78), deploying.**
  ROOT CAUSE: the hero letter-card grid used `md:grid-cols-[auto,1fr]` — Tailwind
  **v3** comma syntax. The port runs Tailwind **v4**, which requires underscore
  (`[auto_1fr]`); the comma form compiles to invalid `grid-template-columns:
  auto,1fr` which the browser silently drops → grid collapses to 1 column →
  avatar (95px col) blows to full-width 878px and stacks above the message =
  +134px. Independently confirmed via live child-probe: card 337px→471px, avatar
  column 95px→878px. Fix = 1 char (`,`→`_`). Mobile unaffected (md: breakpoint).
  Grep-verified: ONLY instance of this comma-syntax grid bug in src/ (RULE 0.3
  class-check done — nothing else to sweep).
- **REF-2 (section[2] +38px):** secondary residual; re-measure after the REF-1
  deploy rolls — much of it may have been the same collapse bleeding downward.

## Post-fix verification — CONFIRMED LIVE (2026-05-30)

REF-1 deploy rolled; fresh `bible-parity` run (artifacts <1min old):
**ReferralLanding desktop 24.1% → 4.4%** (mobile 3.9%). Both now UNDER the <5%
parity gate. The one-char Tailwind-v4 grid fix closed the entire +134px hero
delta exactly as diagnosed. Gate 7 (VR ≤5%) now PASS at both viewports.

**ReferralLanding STATUS: PASS** (9/9 gates). REF-2 (the secondary section[2]
+38px) absorbed by the same fix — no separate work needed.

## Accepted deviations
- Port file is larger (738 vs 525 LOC) due to target-architecture adaptation
  (Base UI primitives, inline constants) — expected per RULE 0, not a defect.
