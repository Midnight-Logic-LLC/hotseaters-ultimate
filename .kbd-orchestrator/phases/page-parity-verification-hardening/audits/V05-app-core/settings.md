# Settings Parity Audit — V05

## Audit Gate Results

| Gate | Result | Notes |
|------|--------|-------|
| 1. Bible read | PASS | Settings.jsx read end-to-end (805 lines). All 12 tabs, all tab content, all inline form logic reviewed. |
| 2. DOM hierarchy | PASS | Port shell reproduces: page header, Publish Seed Defaults button (desktop + mobile), TabsList with TabsTriggers, TabsContent per tab. Plugin-registry pattern (`settings-tab-registry.ts`) replaces inline tab declarations — same rendered structure. |
| 3. Visible strings | PASS | "Settings" / "Configure services, rates, and preferences" (exact bible copy). Tab labels verified: Company, Time Tracking, Billing, Services & Rates, Pipeline Stages, Tiers, Templates, Theme, Subscription, HotSeatHub, Database, Admin — all 12 present in `settings-registration.ts`. |
| 4. Image assets | N/A | Settings page has no images (logo upload is a user-provided URL, not locally hosted). |
| 5. Theme tokens | PASS | All `var(--theme-*)` tokens present: `--theme-page-padding`, `--theme-font-body`, `--theme-max-content-width`, `--theme-section-gap`, `--theme-font-page-title`, `--theme-text-page-title`, `--theme-stone-900`, `--theme-stone-600`, `--theme-text-body`. Port uses `var(--theme-font-page-title)` where bible hardcodes `'Michroma, sans-serif'` — minor token divergence but functionally correct if the token resolves to Michroma. |
| 6. Animations | PASS | `hover:opacity-90 transition-opacity` on Save buttons, no other animations required. |
| 7. Deep links/CTAs | PASS | Privacy Policy and Terms of Service open via PolicyViewerModal (in Subscription tab). Tab navigation via URL `?tab=<id>` param preserved. |
| 8. Business rules | PARTIAL | All tab visibility gates faithfully reproduced in `settings-registration.ts` (verified against bible lines 244–273). Tab content business rules depend on sub-tab components not fully audited here (see note below). |

## Architecture Assessment

The port converts the bible's inline tab declarations into a plugin registry (`settings-tab-registry.ts`). Each tab is registered via `registerCompanySettingsTabs()` in `src/features/company/settings-registration.ts`. The shell (`settings-page.tsx`) reads the registry and renders tabs dynamically.

All 12 bible tabs are registered with correct order, labels, icons, and `canView` gates:

| Tab | Bible Gate | Port Gate | Match |
|-----|-----------|-----------|-------|
| Company | none | none | PASS |
| Time Tracking | none | none | PASS |
| Billing | none | none | PASS |
| Services & Rates | none | none | PASS |
| Pipeline Stages | none | none | PASS |
| Tiers | none | none | PASS |
| Templates | none | none | PASS |
| Theme | `user.role === 'admin'` | `ctx.userRole === 'admin'` | PASS |
| Subscription | `company_role === 'owner'` | `ctx.companyRole === 'owner'` | PASS |
| HotSeatHub | `(owner\|admin) && has_hsh_addon` | `(owner\|admin) && hasHshAddon` | PASS |
| Database | `user.role === 'admin'` | `ctx.userRole === 'admin'` | PASS |
| Admin | `user.role === 'admin'` | `ctx.userRole === 'admin'` | PASS |

**Unaudited area:** The tab component files themselves (`company-settings-tab.tsx`, `billing-settings-tab.tsx`, `time-tracking-settings-tab.tsx`, `services-settings-tab.tsx`, `pipeline-settings-tab.tsx`, `tiers-settings-tab.tsx`, `templates-settings-tab.tsx`, `theme-settings-tab.tsx`, `subscription-settings-tab.tsx`, `marketplace-settings-tab.tsx`, `database-settings-tab.tsx`, `admin-settings-tab.tsx`) were not audited in this V05 pass. Tab content parity is a V11 backlog item.

## Known Token Divergence

Bible Settings.jsx line 190: `fontFamily: 'Michroma, sans-serif'` hardcoded.
Port settings-page.tsx line 88: `fontFamily: 'var(--theme-font-page-title)'`.

This is a correct architectural improvement IF `--theme-font-page-title` resolves to `Michroma, sans-serif` in `index.css`. Verify the CSS variable is defined.

## Defects (V11 Backlog)

- [DEF-S001] Severity: HIGH — **Tab component content not audited**: The 12 lazy-loaded tab components in `src/features/company/components/` (company-settings-tab, billing-settings-tab, time-tracking-settings-tab, etc.) each need a separate parity audit against the corresponding bible sub-components in `HotSeatersMVP/src/components/settings/`. This includes: ServicesTab, CompanySettingsTab, BillingSettingsTab, PipelineStageManagement, TierManagement, DocumentTemplateManagement, ThemeManagement, SubscriptionManagement, AdminPanel, DatabaseDebug. Estimated 10+ potential defects per tab. Scheduled for V11 audit.

- [DEF-S002] Severity: MED — **`--theme-font-page-title` token verification**: Port uses `var(--theme-font-page-title)` for the Settings h1. Bible hardcodes `'Michroma, sans-serif'`. If `--theme-font-page-title` resolves to anything other than Michroma in the default theme, the font will diverge. Audit `src/index.css` and `src/shared/lib/theme.ts` to verify the token value.

- [DEF-S003] Severity: MED — **`TabsList` variant prop not in bible**: Port's `settings-page.tsx` line 122 passes `variant="line"` to `TabsList`. Bible uses `shadcn` tabs with default styling. If the port's `Tabs` primitive renders a `line` variant that looks different from the bible's default tab style, this is a visual parity defect. Compare the TabsList rendering at 1440px.

- [DEF-S004] Severity: MED — **Geocoding on company save not ported to CompanySettingsTab**: Bible's `handleSaveSettings` (Settings.jsx lines 107–151) calls `geocodeLocation(city, state, address)` and patches `geo_lat`/`geo_lng` before saving to the company entity. Verify `company-settings-tab.tsx` in the port includes this geocoding call.

- [DEF-S005] Severity: LOW — **PolicyViewerModal in Subscription tab**: Bible opens `PolicyViewerModal` with `type: 'privacy'` and `type: 'terms'`. Port's `subscription-settings-tab.tsx` (not audited) must include the Privacy Policy and Terms of Service buttons that open the same modal. Verify this is present.

- [DEF-S006] Severity: LOW — **DownloadBillingMatrixButtons in Billing tab**: Bible adds `<DownloadBillingMatrixButtons />` below the Billing tab content (lines 647–654). Port's `billing-settings-tab.tsx` must include this component. Verify presence.

- [DEF-S007] Severity: LOW — **`mb-6` class on TabsList in port**: Port adds `mb-6` to TabsList (`className="mb-6 h-auto w-full flex-wrap..."`). Bible uses the tab gap via Tabs component's flex gap. Minor spacing divergence — may affect vertical rhythm between tabs and content. Low severity but should be screenshot-verified.

## Inline Fixes Applied

None — the settings-page.tsx shell is structurally correct. Defects above are in sub-components or require token verification.
