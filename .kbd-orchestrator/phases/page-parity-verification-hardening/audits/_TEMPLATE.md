# RULE-0 acceptance audit — <PageName>

- **Bible source:** `HotSeatersMVP/src/pages/<Name>.jsx`
- **Port page:** `src/features/<feature>/pages/<name>-page.tsx`
- **Route(s):** `<route>`
- **VR mechanism:** deployed-drift (`bible-vs-port`) | authed-baseline (`toHaveScreenshot`)
- **Audited:** <date> by <agent>

## The 9-point gate

| # | Gate | Verdict | Notes |
|---|------|---------|-------|
| 1 | Bible source read end-to-end | PASS / FAIL | |
| 2 | Rendered DOM regions/sections/hierarchy match | PASS / FAIL / DEVIATION | |
| 3 | Every visible string verbatim (strict) | PASS / FAIL | list any mismatch |
| 4 | All image assets local under `public/brand/` (no CDNs) | PASS / FAIL | |
| 5 | Every `var(--theme-*)` token the bible uses referenced | PASS / FAIL | |
| 6 | Every user-visible animation reproduced | PASS / FAIL | |
| 7 | VR drift ≤5% at 1440×900 AND 375×667 | PASS / FAIL | desktop %, mobile % |
| 8 | Deep links + CTAs route to same destinations | PASS / FAIL | |
| 9 | All business rules / calcs / validations / conditionals / side-effects preserved (RULE J) | PASS / FAIL | enumerate |

## Overall

**STATUS:** PASS / FAIL / PASS-WITH-DEVIATIONS

## Defects → V11 backlog

- (file each FAIL here with file:line + bible reference)

## Accepted deviations

- (record any intentional divergence + rationale)
