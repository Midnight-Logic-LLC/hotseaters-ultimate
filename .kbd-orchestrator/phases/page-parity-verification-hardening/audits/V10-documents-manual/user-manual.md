# UserManual — RULE-0 Parity Audit

**Bible:** `/Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/UserManual.jsx`
**Port:** `/Users/gqadonis/Projects/midnight/hotseaters-ultimate/src/features/manual/pages/user-manual-page.tsx`
**Route:** `/UserManual` (+ `/user-manual` redirect)
**Audited:** 2026-06-29

---

## Gate Results

| # | Gate | Result | Notes |
|---|------|--------|-------|
| 1 | Rendered DOM regions / hierarchy | PASS | All sections present: ManualHero, Platform Overview panel, User Roles & Permissions grid, Explore by Workflow cards, Quick Tips by Role panel, footer timestamp. Order and nesting match bible. |
| 2 | Every visible string verbatim | PASS | All role descriptions, section labels, items, overview items (Rate Formula, Pipeline, Time → Invoice, HSH Marketplace, Documents, Billing Periods), all tip text per role, "What is HotSeaters?", "User Roles & Permissions", "Explore by Workflow", "Quick Tips by Role", "Last updated: 2026-04-29" — verified verbatim. |
| 3 | Image assets locally hosted | PASS | Bible hero uses `https://media.base44.com/images/...chameleon-logo...` (CDN). Port uses `/brand/chameleon-logo.png` (self-hosted under `public/brand/`). RULE 0 compliant. |
| 4 | var(--theme-*) tokens | PASS | --theme-font-body, --theme-max-content-width, --theme-brand-primary, --theme-font-brand-title all used correctly. Hard-coded palette values (#eae7e2, #1c1917, #d6d3d1, etc.) match bible exactly — these are intentional design values, not token gaps. |
| 5 | Animations | PASS | hover:shadow-md on section cards, opacity transition on ChevronRight — both match bible. No other animations on this page. |
| 6 | Deep links / CTAs | PASS | Section cards link to `/ManualSales`, `/ManualOperations`, `/ManualTimeExpenses`, `/ManualBilling`, `/ManualHSH`, `/ManualCompany`. Port uses `to={\`/${s.page}\`}` which produces same routes. Bible uses `createPageUrl(s.page)` which is equivalent. |
| 7 | Business rules (static page) | PASS | Page is fully static — no async data fetching, no calculations. All ROLES, SECTIONS, OVERVIEW_ITEMS, TIP_GROUPS data match bible exactly including all text, colors, and items. |
| 8 | RULE 7 compliance (MDX routing) | INFO | RULE 7 states "Manual content lives in content/user-manual/*.mdx. Never write a React page to display documentation. Use /manual/<slug>." The UserManual page itself is an index/hub page (not MDX documentation content) and is correctly implemented as a React page. The `content/user-manual/` directory exists and has 35+ MDX files. However: the UserManual page does NOT route to `/manual/<slug>` — it routes to `/UserManual` matching the bible's routing pattern. The RULE 7 MDX architecture appears intended for the sub-pages (ManualSales, ManualOperations, etc.) but those are also implemented as React pages (not MDX consumers). This is a RULE 7 architectural gap but matches the bible's own page-based approach. |

---

## RULE 7 MDX Status

`content/user-manual/` has 35 MDX files including: app-overview.mdx, approvals.mdx, billing.mdx, clients.mdx, dashboard.mdx, deals.mdx, trials.mdx, etc.

However, none of the manual sub-pages (ManualSales, ManualOperations, etc.) currently consume these MDX files — they are standalone React pages with hardcoded content. The MDX files exist but are not wired to a `/manual/<slug>` route. This is an architectural gap vs RULE 7 but does not affect RULE 0 visual/functional parity with the bible (which also uses React pages, not MDX).

---

## Defects Found

### Blocking
None against RULE 0.

### Polish / Non-blocking
1. **RULE 7 MDX wiring** — content/user-manual/*.mdx files exist but no `/manual/<slug>` route consumes them. Manual sub-pages are React pages not MDX consumers. This is an architectural debt item, not a RULE 0 parity defect (bible itself uses React pages). Tracked separately.

---

## Inline Fixes Applied
None required.
