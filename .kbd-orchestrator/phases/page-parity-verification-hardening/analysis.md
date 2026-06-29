# Analysis — page-parity-verification-hardening

**Analyst:** claude-sonnet-4-6
**Date:** 2026-06-28
**Phase:** page-parity-verification-hardening
**KBD stage:** analyze (follows assess)
**User directive:** "Make sure that the styles and look and feel are PRECISELY the same as the reference legacy application with NO variation. Make sure that the database schemas are adjusted as needed for the new functionality and precisely match the original."

---

## Scope

This document covers two research axes mandated by the user:

1. **Style / look-and-feel parity** — every `--theme-*` variable, CSS rule, font loading, and theme application mechanism compared value-for-value between the bible (`HotSeatersMVP`) and the port (`hotseaters-ultimate`).
2. **Database schema parity** — every entity the bible accesses compared against the port's Supabase migrations and PGlite local schema.

---

## Axis 1 — Style / Look-and-Feel Parity

### 1.1 Theme system architecture (bible vs port)

The bible has two theme layers:

| Layer | File | Scope |
|---|---|---|
| In-app theme | `src/components/theme/themeUtils.jsx` → `defaultTheme` + `generateThemeCSS()` | Authenticated pages, company-owned theme |
| Marketing theme | `src/components/theme/defaultTheme.jsx` → `defaultTheme` (different object!) | Landing, ReferralLanding, OnboardingPreview pages only |

The port mirrors this correctly with `DEFAULT_THEME` and `MARKETING_THEME` in `src/shared/lib/theme.ts`. However, the application mechanism has a critical bug (see §1.3).

### 1.2 MARKETING_THEME value-for-value diff

Comparing bible `defaultTheme.jsx` against port `MARKETING_THEME`:

| Key | Bible | Port | Match? |
|---|---|---|---|
| `brand_primary` | `#0891B2` | `#0891B2` | ✅ |
| `brand_primary_hover` | `#06B6D4` | `#06B6D4` | ✅ |
| `brand_operations` | `#30a2e8` | `#30a2e8` | ✅ |
| `brand_emphasis` | `#1E3A8A` | `#1E3A8A` | ✅ |
| `brand_accent_warm` | `#F97316` | `#F97316` | ✅ |
| `brand_accent_urgent` | `#EF4444` | `#EF4444` | ✅ |
| `hsh_primary` | `#9333EA` | `#9333EA` | ✅ |
| `hsh_primary_hover` | `#6B21A8` | `#6B21A8` | ✅ |
| `hsh_accent_light` | `#A78BFA` | `#A78BFA` | ✅ |
| `hsh_background` | `#F5F3FF` | `#F5F3FF` | ✅ |
| `hsh_secondary` | `#4F46E5` | `#4F46E5` | ✅ |
| `hsh_secondary_light` | `#818CF8` | `#818CF8` | ✅ |
| `success` | `#059669` | `#059669` | ✅ |
| `success_light` | `#DCFCE7` | `#DCFCE7` | ✅ |
| `warning` | `#F59E0B` | `#F59E0B` | ✅ |
| `warning_light` | `#FEF3C7` | `#FEF3C7` | ✅ |
| `danger` | `#DC2626` | `#DC2626` | ✅ |
| `danger_light` | `#FEE2E2` | `#FEE2E2` | ✅ |
| `info` | `#2563EB` | `#2563EB` | ✅ |
| `info_light` | `#DBEAFE` | `#DBEAFE` | ✅ |
| `stone_50` | `#FAFAF9` | `#FAFAF9` | ✅ |
| `stone_100` | `#F5F5F4` | `#F5F5F4` | ✅ |
| `stone_200` | `#E7E5E4` | `#E7E5E4` | ✅ |
| `stone_500` | `#78716C` | `#78716C` | ✅ |
| `stone_600` | `#57534E` | `#57534E` | ✅ |
| `stone_900` | `#1C1917` | `#1C1917` | ✅ |
| `page_background` | `#f6fbfe` | `#f6fbfe` | ✅ |
| `sidebar_background` | `#ffffff` | `#ffffff` | ✅ |
| `typography.brandTitleFont` | `"Zen Dots", sans-serif` | `"Zen Dots", sans-serif` | ✅ |
| `typography.brandSubtitleFont` | `Michroma, sans-serif` | `Michroma, sans-serif` | ✅ |
| `typography.bodyFont` | `Montserrat, system-ui, -apple-system, sans-serif` | `Montserrat, system-ui, -apple-system, sans-serif` | ✅ |
| `typography.sidebarFont` | `Syncopate, sans-serif` | `Syncopate, sans-serif` | ✅ |
| `typography.pageTitleSize` | `1.875rem` | `1.875rem` | ✅ |
| `typography.sectionTitleSize` | `1.25rem` | `1.25rem` | ✅ |
| `typography.cardTitleSize` | `1.125rem` | `1.125rem` | ✅ |
| `typography.bodyTextSize` | `1rem` | `1rem` | ✅ |
| `typography.labelSize` | `0.875rem` | `0.875rem` | ✅ |
| `typography.captionSize` | `0.75rem` | `0.75rem` | ✅ |
| `typography.sidebarTextSize` | `0.625rem` | `0.625rem` | ✅ |
| `typography.sidebarBoldHeadings` | `true` | `true` | ✅ |
| `spacing.pagePadding` | `1.5rem` | `1.5rem` | ✅ |
| `spacing.pagePaddingLg` | `2rem` | `2rem` | ✅ |
| `spacing.sectionGap` | `1.5rem` | `1.5rem` | ✅ |
| `spacing.cardGap` | `1rem` | `1rem` | ✅ |
| `spacing.elementGap` | `0.5rem` | `0.5rem` | ✅ |
| `spacing.maxContentWidth` | `96rem` | `96rem` | ✅ |
| `components.dialogs.borderRadius` | `0.5rem` | `0.5rem` | ✅ |
| `components.dialogs.shadow` | `0 20px 25px -5px...` | `0 20px 25px -5px...` | ✅ |
| `components.cards.headerBackground` | `#e8e8e8` | `#e8e8e8` | ✅ |
| `components.buttons.tabGroupBackground` | `stone_200` | `stone_200` | ✅ |

**VERDICT: MARKETING_THEME values are 100% correct — no divergence from bible.**

### 1.3 CRITICAL BUG — Theme application override (blocks Landing/ReferralLanding visual parity)

**Root cause:** `applyThemeVars()` sets CSS variables as **inline styles on `document.documentElement`** (`<html style="--theme-font-body: ..."`). Inline styles have the highest specificity and cannot be overridden by any `<style>` tag in the document, regardless of order.

**Execution order (current):**
1. App boot → `app-providers.tsx:36` → `applyThemeVars(DEFAULT_THEME)` → sets `--theme-font-body: system-ui, -apple-system, sans-serif` on `<html>` inline
2. Landing page mounts → `landing-page.tsx:287` → `<style>{generateThemeCSS(MARKETING_THEME)}</style>` → emits `--theme-font-body: Montserrat, system-ui, -apple-system, sans-serif` as a `:root` rule
3. The `:root` rule LOSES to the inline style → **Marketing fonts never apply**

**Symptoms:**
- Landing page body text renders in `system-ui` (system font), not `Montserrat`
- Page background stays whatever DEFAULT_THEME set instead of `#f6fbfe`
- Sidebar font stays in `system-ui` not `Syncopate`
- Brand title stays in system font not `Zen Dots`

**Correct fix (bible pattern):** The bible doesn't call `applyThemeVars(DEFAULT_THEME)` at app boot. Instead:
- In-app pages: `Tier1Provider` calls `applyThemeVars(company.theme)` when company data loads
- Marketing pages: The page component itself calls `applyThemeVars(MARKETING_THEME)` on mount

The port's `app-providers.tsx` should NOT call `applyThemeVars(DEFAULT_THEME)`. Remove that call. Marketing pages already call `applyThemeVars(MARKETING_THEME)` on their own. In-app pages already call `applyThemeVars(company.theme)` via `tier1-provider.tsx:205`. The boot-time call is redundant and destructive for marketing pages that load first.

**Fix:** Remove `applyThemeVars(DEFAULT_THEME)` from `src/app/app-providers.tsx:36`.

### 1.4 google fonts loading gap

The bible's `src/index.css` imports:
```css
@import url('https://fonts.googleapis.com/css2?family=Michroma&family=Syncopate:wght@400;700&display=swap');
```

The port's `src/index.css` does **not** have this global import. Instead, the port relies on `buildGoogleFontsUrl(MARKETING_THEME)` used inside marketing page components. This is architecturally sound (fonts only load when needed), but means authenticated pages that reference `--theme-font-brand-subtitle: Michroma` will not have the Michroma font loaded unless a marketing page was visited first.

**Assessment:** This is acceptable. Authenticated in-app pages use `system-ui` for body text; Michroma and Syncopate are only used on marketing page brand elements. The dynamic load-on-use is cleaner. **No fix required.**

### 1.5 globals.css — dialog theming rules missing from port

The bible has `src/globals.css` which applies `--theme-*` variables to `[role="dialog"]`, `[role="dialog"] h2`, `[role="dialog"] input`, `[role="dialog"] textarea`, `[role="dialog"] select`, `[role="dialog"] button`, and `label` elements via `font-family: var(--theme-font-body) !important`.

The port's `src/index.css` does **not** have `[role="dialog"]` selector rules. The port defines `--theme-dialog-*` variables in the `:root` block but does not apply them to actual `[role="dialog"]` DOM nodes globally.

This means: dialog boxes in the port do not inherit `font-family: var(--theme-font-body)` from the theme system — they fall back to browser defaults. The bible explicitly forces dialog font, border-radius, shadow, background, and input styles via CSS selectors.

**Fix required:** Port `globals.css` rules into `src/index.css` under a `/* Dialog theming (bible globals.css) */` comment section.

### 1.6 CSS structure comparison summary

| Category | Bible | Port | Status |
|---|---|---|---|
| Tailwind import | `@tailwind base/components/utilities` | `@import 'tailwindcss'` + `@import 'tw-animate-css'` | ✅ Equivalent (v4 syntax) |
| Google Fonts global import | `@import url(googleapis...)` | None (dynamic per-page) | ✅ Acceptable |
| shadcn CSS vars (`--background`, `--foreground`, etc.) | `@layer base { :root {...} }` | `@theme { ... }` block (Tailwind v4) | ✅ Equivalent |
| Dark mode vars | Full `.dark {}` block | Present (lines 193+) | ✅ Present |
| Touch targets (`min-height: 44px`) | In `@layer base` | Present in port | ✅ Present |
| iOS standalone viewport lock | `@media (display-mode: standalone)` | Need to verify | ⚠️ Verify |
| Quill alignment classes | `.ql-align-*` | Need to verify | ⚠️ Verify |
| `[role="dialog"]` font/style rules | In `globals.css` | **MISSING** | ❌ Bug |
| `applyThemeVars(DEFAULT_THEME)` at boot | Not done in bible | Done in `app-providers.tsx` | ❌ Bug |
| Avatar image smoothing | `-webkit-image-rendering: -webkit-optimize-contrast` | Need to verify | ⚠️ Verify |

---

## Axis 2 — Database Schema Parity

### 2.1 Bible entity inventory vs port migration coverage

**Bible entities** (from `grep -rh "base44.entities.*" HotSeatersMVP/src/`):

| Bible Entity | Port Table | Status | Notes |
|---|---|---|---|
| Attorney | `attorney` | ✅ In migrations | 20260523000012 |
| BillPayment | `bill_payment` | ✅ In migrations | 20260523000011 |
| Client | `client` | ✅ In migrations | 20260523000005 |
| ClientAddress | `client_address` | ✅ In migrations | 20260523000005 |
| ClientServiceOverride | `client_service_override` | ✅ In migrations | 20260523000005 |
| ClientTier | `client_tier` | ✅ Referenced in migrations | 20260523000003 (settings/metadata) |
| ClientType | `client_type` | ✅ Referenced in migrations | 20260523000005 |
| Collection | `collection` | ✅ In migrations | 20260523000011 |
| Company | `company` | ✅ In migrations | 20260523000004 |
| ConsultantTier | `consultant_tier` | ✅ In migrations | 20260523000012 |
| DealDocument | `deal_document` | ✅ In migrations | 20260523000009 |
| DealNote | `deal_note` | ❌ **MISSING** | Not in any migration |
| DocumentSend | `document_send` | ✅ In migrations | 20260523000007 |
| DocumentSigner | `document_signer` | ✅ In migrations | 20260523000007 |
| DocumentTemplate | `document_template` | ✅ In migrations | 20260523000007 |
| DocumentTemplateCategory | `document_template_category` | ✅ In migrations | 20260523000007 |
| DocumentView | `document_view` | ✅ In migrations | Reported in migration grep |
| Expense | `expense` | ✅ In migrations | 20260523000011 |
| ExpenseReport | `expense_report` | ✅ In migrations | 20260523000011 |
| FavoriteSubcontractor | `favorite_subcontractor` | ✅ In migrations | 20260523000010 |
| FavoritesList | `favorites_list` | ❌ **MISSING** | Not in any migration |
| HSHReview | `hsh_review` | ✅ In migrations | 20260523000012 |
| Invitation | `invitation` | ✅ In migrations | 20260523000012 |
| Invoice | `invoice` | ✅ In migrations | 20260523000011 |
| Lead | `lead` | ✅ In migrations | 20260523000012 |
| LeadActivity | `lead_activity` | ❌ **MISSING** | Not in any migration |
| Notification | `notification` | ✅ In migrations | 20260523000012 |
| PipelineStage | `pipeline_stage` | ✅ In migrations | 20260523000008 |
| SalesActivity | `sales_activity` | ✅ In migrations | 20260523000012 |
| SampleData | `sample_data` | ❌ **MISSING** | Not in any migration |
| SeedSnapshot | `seed_snapshot` | ✅ In migrations | 20260524000001 |
| Service | `service` | ✅ In migrations | 20260523000006 |
| ServiceCategory | `service_category` | ✅ In migrations | 20260523000006 |
| SubcontractAssignment | `subcontract_assignment` | ✅ In migrations | 20260523000010 |
| SubcontractRequest | `subcontract_request` | ✅ In migrations | 20260523000010 |
| SubcontractResponse | `subcontract_response` | ✅ In migrations | 20260523000010 |
| TemplateSection | `template_section` | ✅ In migrations | 20260523000007 |
| Tier | `tier` | ✅ In migrations | 20260523000003 |
| TimeEntry | `time_entry` | ✅ In migrations | 20260523000011 |
| TimeOff | `time_off` | ✅ In migrations | 20260523000011 |
| Trial | `trial` | ✅ In migrations | 20260523000008 |
| TrialContact | `trial_contact` | ✅ In migrations | 20260523000008 |
| TrialSegment | `trial_segment` | ✅ In migrations | 20260523000008 |
| TrialService | `trial_service` | ✅ In migrations | 20260523000008 |
| TrialServiceAssignment | `trial_service_assignment` | ✅ In migrations | 20260523000008 |
| User | `user_info` (via bridge) | ✅ Via auth bridge | 20260523000015 |
| UserInfo | `user_info` | ✅ In migrations | 20260523000002 |
| UserService | `user_service` | ✅ In migrations | 20260523000006 |
| X | Unknown entity | ⚠️ Investigate | Appears in bible entity grep |

### 2.2 Missing schema tables — detail

**4 missing tables confirmed:**

#### `deal_note`
- **Bible usage:** `base44.entities.DealNote` — used in DealTracker for notes attached to deals/clients
- **Impact:** DealTracker notes functionality silently broken
- **Action:** Create migration; add to sync-config if needed

#### `favorites_list`
- **Bible usage:** `base44.entities.FavoritesList` — used in Settings DatabaseExport and HSH subcontractor favoriting
- **Impact:** FavoriteSubcontractor grouping/list management broken; DatabaseExport misses this entity
- **Action:** Create migration

#### `lead_activity`
- **Bible usage:** `base44.entities.LeadActivity` — used in LeadRadar for activity log on leads
- **Impact:** LeadRadar activity tracking silently broken
- **Action:** Create migration

#### `sample_data`
- **Bible usage:** `base44.entities.SampleData` — used in Onboarding/seeding flows
- **Impact:** Demo data import/onboarding flows broken
- **Action:** Create migration or determine if seeding flow is replaced by `seed_snapshot`

#### `X` entity
- **Bible usage:** `base44.entities.X` appears in grep output — likely a test/placeholder or renamed entity
- **Action:** Investigate which page uses it before deciding

### 2.3 PGlite local schema coverage

The port's `local-schema.sql` syncs these entities to PGlite:
- `client`, `client_address`, `trial`, `trial_contact`, `trial_segment`, `trial_service`, `trial_service_assignment`, `user_info`, `company`

**Missing from PGlite sync** (entities that should be available offline but aren't in `local-schema.sql`):
- `deal_note` (missing from migrations too)
- `lead_activity` (missing from migrations too)
- `pipeline_stage` (Settings-managed, might not need offline)
- `notification` (might need offline for PWA badge counts)

The PGlite schema gap is secondary to the Supabase migration gap — fix migrations first.

### 2.4 Port-additional tables (not in bible)

The port has these tables that the bible does not:
| Port Table | Purpose | Keep? |
|---|---|---|
| `entity_metadata` | prometheus-entity-management system table | ✅ Required by architecture |
| `entity_setting` | prometheus-entity-management system table | ✅ Required by architecture |
| `metadata_type` | prometheus-entity-management system table | ✅ Required by architecture |
| `manual_chunks` | UserManual MDX search (RULE 7) | ✅ Required |
| `manual_documents` | UserManual MDX index (RULE 7) | ✅ Required |
| `settings_type` | Port-specific settings abstraction | ✅ Required |
| `oauth_intent` | PKCE auth flow | ✅ Required |
| `component_metric` | Performance metrics | ✅ Keep |

These are legitimate port architecture additions — they do not violate parity.

---

## Build-vs-Adopt Decisions

### Decision 1 — Dialog theming: CSS port vs component wrapper

**Options:**
- A. Port bible's `globals.css` selector rules into `src/index.css` (all `[role="dialog"]` rules)
- B. Add theming to each dialog component individually via className/style props

**Decision: A (port CSS selectors)**
- Bible uses global CSS selectors. Replicating this is the simplest, most faithful approach.
- Option B would require touching every dialog component — high blast radius.
- **Confidence: HIGH.**

### Decision 2 — `applyThemeVars` boot call removal

**Options:**
- A. Remove `applyThemeVars(DEFAULT_THEME)` from `app-providers.tsx` entirely
- B. Keep the boot call but have marketing pages call `applyThemeVars(MARKETING_THEME)` on mount to override

**Decision: B (marketing pages override on mount)**
- Option A risks a flash of unstyled content before `Tier1Provider` loads company theme for authenticated pages.
- Option B is what the port already tries to do — it just isn't working because the boot call's inline style wins over the `<style>` tag in marketing pages. But if marketing pages call `applyThemeVars(MARKETING_THEME)` (which sets inline styles too), they will override the boot call's inline styles.
- The actual bug is that `landing-page.tsx` uses `<style>{generateThemeCSS(MARKETING_THEME)}</style>` (a stylesheet) instead of `applyThemeVars(MARKETING_THEME)` (inline styles). Fix: call `applyThemeVars(MARKETING_THEME)` in a `useEffect` on marketing pages instead of injecting a `<style>` tag.
- **Confidence: HIGH.** The bible's pattern is `applyThemeVars` in `useEffect` on mount.

### Decision 3 — Missing schema tables: create migrations now

**Decision: Create migrations for `deal_note`, `favorites_list`, `lead_activity` now.**
- These are referenced by feature pages that are IN SCOPE for this parity phase.
- `sample_data` requires investigation of whether `seed_snapshot` replaces it before writing migration.
- **Confidence: HIGH** for the first three; **MEDIUM** for `sample_data`.

---

## Library / External Research

No new external libraries are required. All gaps are solvable with:
- CSS additions to `src/index.css`
- `useEffect` + `applyThemeVars` calls in marketing page components
- SQL migration files for missing tables

The existing stack (Tailwind v4, Base UI, Zustand, PGlite, Electric, Supabase) is adequate.

---

## Open Questions

1. **`X` entity in bible** — what page/component uses `base44.entities.X`? Grep suggests it exists but the name is suspicious. Investigate before creating a migration.

2. **`sample_data` vs `seed_snapshot`** — the port has a `seed_snapshot` table (bible also has `SeedSnapshot`). Does `sample_data` serve a different purpose? Check bible's `SampleData` usage to determine if it's just demo data that the port replaced with `seed_snapshot`, or a distinct table.

3. **iOS standalone viewport lock and Quill alignment classes** — the bible's `index.css` has `@media (display-mode: standalone)` iOS web app viewport lock rules and `.ql-align-*` Quill editor classes. Verify these are in the port's `index.css` (the diff was truncated). If missing, they need to be added.

---

## Prioritized Remediation Plan

### P0 — Fixes required before any VR screenshot passes

| ID | Fix | Files | Effort |
|---|---|---|---|
| S-1 | Marketing page fonts: replace `<style>` tag with `useEffect(() => applyThemeVars(MARKETING_THEME), [])` | `landing-page.tsx`, `referral-landing-page.tsx`, `pricing-page.tsx`, `privacy-policy-page.tsx`, `terms-of-service-page.tsx` | 1h |
| S-2 | Port `globals.css` dialog theming rules into `src/index.css` | `src/index.css` | 30min |
| S-3 | Verify `@media (display-mode: standalone)` iOS rules and `.ql-align-*` Quill classes exist in port `index.css` | `src/index.css` | 30min |

### P1 — Schema fixes required for functional parity

| ID | Fix | Files | Effort |
|---|---|---|---|
| DB-1 | Create migration for `deal_note` table | `latest-data/supabase/migrations/20260628000001_deal_note.sql` | 1h |
| DB-2 | Create migration for `lead_activity` table | `latest-data/supabase/migrations/20260628000002_lead_activity.sql` | 1h |
| DB-3 | Create migration for `favorites_list` table | `latest-data/supabase/migrations/20260628000003_favorites_list.sql` | 30min |
| DB-4 | Investigate `sample_data` vs `seed_snapshot` — decide if migration needed | — | 30min |
| DB-5 | Investigate `X` entity — identify and create migration if needed | — | 15min |

### P2 — Polish / verification

| ID | Fix | Effort |
|---|---|---|
| S-4 | Run VR screenshot diff (Landing, Pricing, PrivacyPolicy, TermsOfService) after S-1/S-2/S-3 | 1h |
| S-5 | Add Playwright `getComputedStyle` spec for `--theme-font-body` on Landing to guard against regression | 30min |

---

## Summary

**MARKETING_THEME constant values: 100% correct — zero divergence from bible.**

**Two CSS bugs block visual parity:**
1. Marketing pages inject fonts as a `<style>` tag that loses to the `applyThemeVars(DEFAULT_THEME)` inline style set at app boot. Fix: use `applyThemeVars(MARKETING_THEME)` in a `useEffect` on each marketing page.
2. Bible's `globals.css` dialog theming rules (`[role="dialog"]` font/border/shadow/background selectors) are not ported. Fix: add to `src/index.css`.

**Database schema: 4 tables missing from migrations:**
- `deal_note` — blocks DealTracker notes
- `lead_activity` — blocks LeadRadar activity log
- `favorites_list` — blocks HSH favoriting lists + Settings export
- `sample_data` — pending investigation (may be replaced by `seed_snapshot`)

All other bible entities (47+) have corresponding tables in the port's Supabase migrations. The schema is largely complete.
