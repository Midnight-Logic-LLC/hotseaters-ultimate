# Assessment — hotseaters-page-parity-port
_Generated: 2026-05-26_

---

## Executive Summary

The `hotseaters-page-parity-port` phase ports every page from the bible
(`HotSeatersMVP`) to `hotseaters-ultimate`. The user has directed that
**Settings must be the first wave (Wave S)**, because settings values are
shared application-wide and many other pages depend on them to render
correctly (pipeline stages, billing rules, service rates, tier limits,
theme tokens, etc.).

This assessment documents the current gap, the settings infrastructure
design, and the ordered wave plan.

---

## 1. Current State

### 1.1 What exists in `hotseaters-ultimate`

| Area | Status | Notes |
|------|--------|-------|
| `src/features/company/pages/company-settings-page.tsx` | v0.1 scaffold | 5 tabs: Firm Info, Branding, Team (link), Billing (placeholder), Pipeline (placeholder) |
| `src/features/company/hooks/use-company-settings.ts` | Working | Reads company via `useEntity`; `save()` calls company-store `updateCompany` |
| `src/features/lookups/hooks/use-settings-types.ts` | Stub | Returns `[]`; `SettingsType` not registered in entity graph |
| Routes | Partial | `/Settings` → `CompanySettingsPage`; `/settings/billing` → `RoutePlaceholder` |
| `settings_type` DB table | Seeded (7 rows) | Keys: company.billing, company.branding, company.numbering, company.time_clock, document.page_settings, user.google_calendar, user.preferences |
| `entity_setting` DB table | Has data | company.billing row for Prometheus AGS company |

### 1.2 What the bible has

The bible's `Settings.jsx` (776 LOC) has **11 tabs** in a single page, no sub-routes.
Tabs are registered inline in JSX; role gates are inline conditionals.

| # | Tab value | Icon | Bible component | Role gate | Data source |
|---|-----------|------|-----------------|-----------|-------------|
| 1 | `company` | Building2 | `CompanySettingsTab` (190 LOC) | none | `company.*` |
| 2 | `time_tracking` | Clock | inline in Settings.jsx | none | `company.time_rounding_minutes/clock_in_rounding/clock_out_rounding/default_daily_minimum_hours/hide_deals_from_time_clock` |
| 3 | `billing` | DollarSign | `BillingSettingsTab` (191 LOC) | none | `company.*` billing fields |
| 4 | `services` | DollarSign | `ServicesTab` (983 LOC) | none | `Service`, `ServiceCategory`, `TrialService` entities |
| 5 | `pipeline` | GitBranch | `PipelineStageManagement` (764 LOC) | none | `MetadataType` scope=pipeline_stage |
| 6 | `tiers` | Layers | `TierManagement` (564 LOC) | none | `MetadataType` scope=tier |
| 7 | `templates` | FileText | `DocumentTemplateManagement` | none | `DocumentTemplate` entity |
| 8 | `theme` | Palette | `ThemeManagement` (2120 LOC) | `user.role === 'admin'` | `company.theme` JSONB |
| 9 | `subscription` | CreditCard | `SubscriptionManagement` (140 LOC) + policy links | `userInfo.company_role === 'owner'` | external subscription SaaS |
| 10 | `marketplace` | Orbit | inline HotSeatHub section | `(owner\|admin) && company.has_hsh_addon` | `company.*` + `userInfo.preferences` |
| 11 | `database` | Database | `DatabaseDebug` | `user.role === 'admin'` | diagnostic |
| 12 | `admin` | AlertTriangle | `AdminPanel` | `user.role === 'admin'` | admin functions |

> Note: Tab list in bible has 12 trigger entries but bible comments say "11 tabs" — both database and admin are admin-gated so most users see 7–10 tabs.

### 1.3 Gap summary

| Gap | Severity | Impact |
|-----|----------|--------|
| 7 of 12 tabs completely missing | BLOCKER | Users cannot configure time tracking, services, pipeline, tiers, templates, theme, subscription, marketplace, database, admin |
| 5-tab v0.1 uses wrong tab labels ("Firm Info" vs "Company") | BLOCKER | Visual parity failure |
| No settings registry pattern | ARCH | Cannot support plugin/feature tab registration |
| `SettingsType` entity not in graph | ARCH | `use-settings-types.ts` always returns `[]` |
| No route for time_tracking / services / pipeline / tiers / templates / theme / subscription / marketplace tabs | BLOCKER | All navigation fails |
| `generalSettings` state object (27 company fields) not implemented | BLOCKER | Company + Billing tabs save no data |
| Retainer formula calculator missing | BLOCKER | Billing tab business rule not ported |
| Logo upload/remove missing | BLOCKER | CompanySettingsTab visual + functional gap |
| Time rounding UI missing | BLOCKER | Time Tracking tab not started |
| `ServicesTab` DnD category management not ported | BLOCKER | Services & Rates tab not started |
| `PipelineStageManagement` color/order/delete not ported | BLOCKER | Pipeline tab partial at best |
| `TierManagement` full CRUD not ported | BLOCKER | Tiers tab not started |
| `ThemeManagement` full token editor not ported | BLOCKER | Theme tab not started |
| `SubscriptionManagement` + policy links not ported | BLOCKER | Subscription tab not started |
| HotSeatHub marketplace settings not ported | BLOCKER | Marketplace tab not started |
| `PublishSeedDefaultsButton` (superadmin, mobile-hidden) missing | HIGH | Superadmin UX parity |

---

## 2. Settings Infrastructure Design

The user requires a **generic, extensible settings registry** that:
1. Works for all current settings tabs (company-owned features)
2. Allows each feature to register its own tab
3. Is forward-compatible with a plugin architecture (third-party tabs)

### 2.1 Settings Tab Registry

A settings tab registry is a static lookup. Each registered entry describes
one tab that should appear in the Settings page.

```typescript
// src/features/settings/registry/settings-tab-registry.ts

export interface SettingsTabDefinition {
  /** URL param value, e.g. 'company', 'billing', 'time_tracking' */
  id: string
  /** Display label in the TabsList */
  label: string
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>
  /** The React component rendered in TabsContent */
  component: React.LazyExoticComponent<React.ComponentType> | React.ComponentType
  /** Optional role gate. Returning false hides the tab. */
  canView?: (ctx: SettingsAuthContext) => boolean
  /** Sort order in the tab list. Lower = earlier. */
  order: number
  /** Feature slug for analytics / plugin attribution */
  featureSlug: string
}

export interface SettingsAuthContext {
  userRole: string | null          // 'admin' | null (system role)
  companyRole: string | null       // 'owner' | 'admin' | 'member'
  hasHshAddon: boolean
}
```

Registration is done per feature at boot:

```typescript
// src/features/settings/registry/settings-tab-registry.ts
const registry: Map<string, SettingsTabDefinition> = new Map()

export function registerSettingsTab(def: SettingsTabDefinition): void {
  registry.set(def.id, def)
}

export function getRegisteredSettingsTabs(
  ctx: SettingsAuthContext
): SettingsTabDefinition[] {
  return [...registry.values()]
    .filter(tab => !tab.canView || tab.canView(ctx))
    .sort((a, b) => a.order - b.order)
}
```

Each feature registers in its own `entities.ts` or a dedicated
`settings-registration.ts` file (called from `app-providers.tsx`):

```typescript
// src/features/company/settings-registration.ts
registerSettingsTab({
  id: 'company',
  label: 'Company',
  icon: Building2,
  component: lazy(() => import('./components/company-settings-tab')),
  order: 10,
  featureSlug: 'company',
})

registerSettingsTab({
  id: 'time_tracking',
  label: 'Time Tracking',
  icon: Clock,
  component: lazy(() => import('./components/time-tracking-settings-tab')),
  order: 20,
  featureSlug: 'company',
})
// ... billing, marketplace, subscription
```

The Settings page shell (`settings-page.tsx`) is then purely generic:

```typescript
// src/features/settings/pages/settings-page.tsx
export function SettingsPage() {
  const { userRole, companyRole, hasHshAddon } = useTier1()
  const tabs = getRegisteredSettingsTabs({ userRole, companyRole, hasHshAddon })
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(window.location.search).get('tab') ?? tabs[0]?.id ?? 'company'
  )
  // render Tabs with tabs.map() for TabsList triggers and TabsContent panels
}
```

**Plugin architecture forward-compatibility:** Third-party code (future) will
call `registerSettingsTab()` from their own initialization bundle. The
registry pattern is already plugin-ready — no changes needed at the shell
level.

### 2.2 `SettingsType` Entity Registration

`settings_type` rows define the schema for `entity_setting.data`. They must
be registered in the entity graph so hooks can query them.

```typescript
// src/features/settings/entities.ts
import { registerEntityJsonSchema } from '@prometheus-ags/prometheus-entity-management'

export interface SettingsTypeEntity {
  id: string
  key: string                         // 'company.billing', 'user.preferences', etc.
  label: string
  entity_scope: 'company' | 'user_info' | 'document_template'
  json_schema: Record<string, unknown> | null
  created_at: string
}

registerEntityJsonSchema('SettingsType', {
  tableName: 'settings_type',
  // ... schema
})
```

The existing `use-settings-types.ts` stub must be wired to read from the
entity graph once registration is done.

### 2.3 Data Flow Architecture (RULES B/C/D compliant)

```
SettingsPage (component)
  ↓ via hook
useSettingsTab('billing') → useEntitySetting('company.billing', companyId)
  ↓ via store
settings-store.ts
  → reads entity graph (prometheus-entity-management)
  → mutates via Supabase `entity_setting` upsert
```

For settings backed directly by `company.*` columns (not `entity_setting`):

```
CompanySettingsTab (component)
  ↓ via hook
useCompanySettings(companyId)          ← already exists
  ↓ via store
company-store.ts → Supabase company table
```

**Dual backing**: The bible uses `generalSettings` (a local React state
object with 27 fields) hydrated from `company.*` and saved via
`Company.update()`. The port replicates this exactly using the entity-graph
backed `useCompanySettings` hook — no `entity_setting` rows needed for
company-column data.

For `entity_setting`-backed data (e.g. `user.preferences` JSONB):

```typescript
// src/features/settings/hooks/use-entity-setting.ts
export function useEntitySetting(
  settingsKey: string,
  entityId: string,
  entityScope: 'company' | 'user_info' | 'document_template'
): { data: unknown; isLoading: boolean; save: (patch: unknown) => Promise<void> }
```

---

## 3. Bible Tab Inventory (full functional + visual spec)

### Tab 1: Company (`company`)
**Bible file:** `CompanySettingsTab.jsx` (190 LOC)

**Visual sections:**
1. Card "Company Identity" — 2/3 col: name + website/email/phone (3-col grid) + street/city/state/zip (3-col grid). 1/3 col: logo 240×240 box (upload/remove/preview). Admin-only: Show Debug Info toggle.
2. Card "Financial" — 3-col grid: Fiscal Year Start Month (select), Annual Revenue Target ($, comma-formatted input), Monthly Breakeven ($, comma-formatted input).
3. Footer: "Save Company Settings" button (brand-primary, right-aligned).

**Business rules:**
- Phone masking: strips non-digits, formats as `(XXX) XXX-XXXX`
- Annual Revenue Target: comma display, `.replace(/,/g,'')` on change
- Logo upload: file→Supabase Storage→`company.logo` URL; remove sets `company.logo = null`
- Show Debug Info toggle: immediate save via `updateCompanyMutation` (separate from batch save)
- `handleSaveSettings` saves 22 fields to `Company.update()`

**Port notes:** Logo upload must call Supabase Storage, not base44. Use RULE 1 (self-hosted).

---

### Tab 2: Time Tracking (`time_tracking`)
**Bible file:** Inlined in `Settings.jsx` (lines ~540–680)

**Visual sections:**
1. Card "Time Clock Settings" — 2-col grid: Time Rounding (select: 5/10/15/30/60 min), Rounding Method Clock-In (select: nearest/up/down), Rounding Method Clock-Out (select: nearest/up/down). Toggle: "Hide Deals from Time Clock" (immediate save).
2. Card "Default Billing" — Default Daily Minimum Hours (number input, step 0.5).
3. Footer: "Save Time Tracking Settings" button.

**Business rules:**
- "Hide Deals from Time Clock" → immediate `updateCompanyMutation` (not batched)
- All other fields → batched `handleSaveSettings`
- `time_rounding_minutes` defaults to 15
- `clock_in_rounding`/`clock_out_rounding` default to "nearest"
- `default_daily_minimum_hours` default 8

---

### Tab 3: Billing (`billing`)
**Bible file:** `BillingSettingsTab.jsx` (191 LOC)

**Visual sections:**
1. Card "Billing Settings":
   - 3-col: Default Daily Minimum Hours, Default Tax Rate (%), Invoice Due Date (select: Net 7/14/30/45/60/90)
   - "Number Formatting" section: Invoice Number Format + Invoice Starting Number + Reset at fiscal year switch; Job Number Format + Job Starting Number + Reset switch
   - "Invoice Period" section: Billing Frequency select (weekly/monthly/per_trial) + conditional: Weekly Billing Day OR Monthly Billing Date OR Days After Trial End
   - "Email Settings" section: Sender Email input
2. Card "Retainer Formula":
   - Prose + inline inputs: "Every retainer will have a minimum value of $[input]"
   - "For every $[divisor] of estimated budget, add $[multiplier] to the retainer."
   - "Test Your Formula": Hypothetical Budget input → Calculated Retainer (readonly). Formula: `max(minimum, floor(budget/divisor) * multiplier)`
3. Footer: "Save Billing Settings" button.

**Business rules:**
- `invoice_number_reset_yearly` → immediate `updateCompanyMutation`
- `job_number_reset_yearly` → immediate `updateCompanyMutation`
- `invoice_period` → immediate `updateCompanyMutation`
- `weekly_billing_day` / `monthly_billing_date` / `per_trial_billing_days_after_end` → immediate `updateCompanyMutation`
- Retainer formula: `calculated = Math.max(minimum, Math.floor(budget / divisor) * multiplier)`
- All other fields → batched `handleSaveSettings`

---

### Tab 4: Services & Rates (`services`)
**Bible file:** `ServicesTab.jsx` (983 LOC) + `ServiceForm.jsx`

**Key features:**
- Drag-and-drop category reorder (`@hello-pangea/dnd`)
- Service CRUD with inline edit (rate, description, unit)
- Category CRUD with inline edit
- Deactivate vs. delete: if service is referenced by a TrialService, deactivate instead
- Active/inactive toggle per service + show/hide inactive items
- Grouped display: by category (collapsible) + "Uncategorized" group
- Alert dialogs for destructive actions

**Entities used:** `Service`, `ServiceCategory` (via Tier1), `TrialService` (Tier2 query)

**Port notes:** Replace `@tanstack/react-query` with entity graph. Replace `base44.entities.*` with store actions. `@hello-pangea/dnd` can be kept (it's a real npm package, not base44).

---

### Tab 5: Pipeline Stages (`pipeline`)
**Bible file:** `PipelineStageManagement.jsx` (764 LOC)

**Key features:**
- Drag-and-drop stage reorder
- Stage CRUD: name, color (color picker), order
- Delete stage (with deal-count warning if deals are in that stage)
- Default stages shown for empty state

**Entity used:** `MetadataType` (scope = 'pipeline_stage')
**DB:** 6 rows already seeded (see previous session)

**Port notes:** Entity already registered. DnD for reorder. Color picker needed.

---

### Tab 6: Tiers (`tiers`)
**Bible file:** `TierManagement.jsx` (564 LOC)

**Key features:**
- Tier CRUD: name, description, color, max team members, features list
- Drag-and-drop tier reorder
- Assign tier to company (admin action)

**Entity used:** `MetadataType` (scope = 'tier')

---

### Tab 7: Templates (`templates`)
**Bible file:** `DocumentTemplateManagement` (complex — document editor)

**Key features:**
- Document template CRUD (name, type, status)
- Rich-text section editor (quill-based in bible; use port-equivalent)
- Template preview thumbnails
- Publish seed defaults button (superadmin only, in page header)

**Entity used:** `DocumentTemplate`

**Port notes:** This is the most complex tab. May ship as a stub UI in Wave S with full editor in Wave S+1.

---

### Tab 8: Theme (`theme`)
**Bible file:** `ThemeManagement.jsx` (2120 LOC)
**Role gate:** `user.role === 'admin'` (system admin)

**Key features:**
- Full CSS variable token editor (~80 tokens)
- Live preview
- Reset to defaults
- Export theme as JSON
- Import theme from JSON

**Port notes:** The theme token set is already defined in `src/index.css`. The ThemeManagement component reads/writes `company.theme` JSONB. Already partially in `BrandingForm` (single color).

---

### Tab 9: Subscription (`subscription`)
**Bible file:** `SubscriptionManagement.jsx` (140 LOC) + inline policy links
**Role gate:** `userInfo.company_role === 'owner'`

**Key features:**
- Current plan display
- Upgrade/downgrade buttons (external links)
- Privacy Policy + Terms of Service modal links (uses `PolicyViewerModal`)

---

### Tab 10: HotSeatHub / Marketplace (`marketplace`)
**Bible file:** Inlined in `Settings.jsx` (lines ~355–575)
**Role gate:** `(owner || admin) && company.has_hsh_addon`

**Key features:**
- "Enable Help Wanted" toggle → `company.marketplace_post_jobs`
- When enabled:
  - Profit Margin Target: type (percentage|dollar) + value
  - Decline Notifications: notification preference select (with_message_only/all/none) → `userInfo.preferences.hsh_decline_notifications`
  - When "all": notification frequency threshold → `userInfo.preferences.hsh_decline_notification_threshold`

**Data split:** profit margin → `company.*` (immediate save); decline prefs → `userInfo.preferences` JSONB

---

### Tab 11+12: Database + Admin
**Bible files:** `DatabaseDebug.jsx`, `AdminPanel.jsx`
**Role gate:** `user.role === 'admin'`

**Port notes:** These are diagnostic/admin tools. Port structure but content can be adapted to the port's architecture (PGlite debug, Electric sync status, etc.).

---

## 4. Wave Plan (revised — Settings First)

### Wave S — Settings Infrastructure + All Settings Tabs
_This wave ships before any W0–W8 page parity work._

**Goal:** Full functional + visual parity for `/Settings` (all 12 tabs) plus the settings registry architecture.

| Change | Scope | Files |
|--------|-------|-------|
| change-S01 | Settings tab registry + SettingsPage shell + route wiring | `src/features/settings/registry/`, `src/features/settings/pages/settings-page.tsx`, `src/app/app-router.tsx` |
| change-S02 | Register SettingsType entity in graph + fix use-settings-types hook | `src/features/settings/entities.ts`, `src/features/lookups/hooks/use-settings-types.ts` |
| change-S03 | Company tab full parity (logo upload, all 22 fields, financial card) | `src/features/company/components/company-settings-tab.tsx` |
| change-S04 | Time Tracking tab full parity | `src/features/company/components/time-tracking-settings-tab.tsx` |
| change-S05 | Billing tab full parity (retainer formula calculator, invoice period conditionals) | `src/features/company/components/billing-settings-tab.tsx` |
| change-S06 | Services & Rates tab full parity (DnD categories, inline edit, deactivate flow) | `src/features/company/components/services-settings-tab.tsx`, `src/features/company/components/service-form.tsx` |
| change-S07 | Pipeline Stages tab full parity (DnD, color picker, delete-with-warning) | `src/features/company/components/pipeline-settings-tab.tsx` |
| change-S08 | Tiers tab full parity | `src/features/company/components/tier-settings-tab.tsx` |
| change-S09 | Templates tab — structure + list view (full editor deferred) | `src/features/company/components/templates-settings-tab.tsx` |
| change-S10 | Theme tab full parity (all ~80 tokens, live preview, export/import) | `src/features/company/components/theme-settings-tab.tsx` |
| change-S11 | Subscription tab + PolicyViewerModal | `src/features/company/components/subscription-settings-tab.tsx`, `src/features/company/components/policy-viewer-modal.tsx` |
| change-S12 | HotSeatHub/Marketplace tab (profit margin + decline prefs) | `src/features/company/components/marketplace-settings-tab.tsx` |
| change-S13 | Database + Admin tabs (port structure, adapt to port architecture) | `src/features/company/components/database-settings-tab.tsx`, `src/features/company/components/admin-settings-tab.tsx` |
| change-S14 | Feature registrations: wire all tabs into registry + app-providers boot | `src/features/company/settings-registration.ts`, `src/app/app-providers.tsx` |
| change-S15 | useEntitySetting hook + settings-store | `src/features/settings/hooks/use-entity-setting.ts`, `src/features/settings/stores/settings-store.ts` |
| change-S16 | Visual parity screenshots + VR baseline at 1440×900 + 375×667 | `tests/visual-parity/specs/settings-*.spec.ts` |

### Wave W0 — Foundation (brand assets, auth routing, MarketingShell)
_After Wave S is shipped and verified._

### Waves W1–W8 — Page parity per CLAUDE.md wave table
_Unchanged from original plan — now with Settings infrastructure already in place._

---

## 5. Current File State (for plan agent)

### Reusable (extend, don't replace)
- `src/features/company/hooks/use-company-settings.ts` — already works, extend with full 27-field generalSettings
- `src/features/company/pages/company-settings-page.tsx` — replace with full settings-page.tsx
- `src/features/company/stores/company-store.ts` — extend with logo upload + `updateCompany` for new fields
- `src/features/lookups/hooks/use-settings-types.ts` — wire to entity graph once change-S02 lands

### New files needed
- `src/features/settings/` — new feature directory
- `src/features/settings/registry/settings-tab-registry.ts`
- `src/features/settings/pages/settings-page.tsx`
- `src/features/settings/hooks/use-entity-setting.ts`
- `src/features/settings/stores/settings-store.ts`
- `src/features/settings/entities.ts`
- `src/features/company/settings-registration.ts`
- `src/features/company/components/company-settings-tab.tsx`
- `src/features/company/components/time-tracking-settings-tab.tsx`
- `src/features/company/components/billing-settings-tab.tsx`
- `src/features/company/components/services-settings-tab.tsx`
- `src/features/company/components/service-form.tsx`
- `src/features/company/components/pipeline-settings-tab.tsx`
- `src/features/company/components/tier-settings-tab.tsx`
- `src/features/company/components/templates-settings-tab.tsx`
- `src/features/company/components/theme-settings-tab.tsx`
- `src/features/company/components/subscription-settings-tab.tsx`
- `src/features/company/components/policy-viewer-modal.tsx`
- `src/features/company/components/marketplace-settings-tab.tsx`
- `src/features/company/components/database-settings-tab.tsx`
- `src/features/company/components/admin-settings-tab.tsx`
- `src/features/company/components/publish-seed-defaults-button.tsx`

### Delete / replace
- `src/features/company/pages/company-settings-page.tsx` → replaced by `src/features/settings/pages/settings-page.tsx`
- Route `/Settings` + `/settings/company` → both route to new `SettingsPage`

---

## 6. DB Infrastructure (already in place — no migration needed for Wave S)

| Table | Status | Notes |
|-------|--------|-------|
| `settings_type` | 7 rows | Keys: company.billing, company.branding, company.numbering, company.time_clock, document.page_settings, user.google_calendar, user.preferences |
| `entity_setting` | Has data | company.billing row exists for Prometheus AGS |
| `metadata_type` (pipeline_stage) | 6 rows seeded | Active, Interviewing, Offer Extended, Hired, Not a Fit + legacy Active UUID |
| `metadata_type` (tier) | Needs check | Run: `SELECT * FROM metadata_type WHERE scope = 'tier'` |
| `service` | Needs check | May need seed data |
| `service_category` | Needs check | May need seed data |
| `company` table | Has all needed columns | invoice_number_format, retainer_*, time_rounding_*, etc. all present |

**No DB migrations needed for Wave S.** All required tables/columns already exist.

---

## 7. Verification Plan

### Per-change (each S01–S16)
- `pnpm typecheck && pnpm lint` green
- No `any` introduced

### Wave S completion gate
1. Navigate to `/Settings?tab=company` → tab bar shows all 12 tabs (role-appropriate)
2. Company tab: fill all fields, save → Supabase company row updated ✓
3. Company tab: upload logo → logo displays in 240×240 box ✓
4. Billing tab: enter budget in formula tester → calculated retainer updates ✓
5. Time Tracking tab: change rounding, save → DB updated ✓
6. Services tab: drag category, inline-edit service, deactivate used service ✓
7. Pipeline tab: reorder stages, change color ✓
8. Theme tab (admin only): change token → live preview updates ✓
9. Subscription tab (owner only): visible; policy modal opens ✓
10. HotSeatHub tab (owner/admin + addon): profit margin + decline prefs save ✓
11. URL: `?tab=billing` → opens directly on Billing tab ✓
12. `PublishSeedDefaultsButton` hidden on mobile (< sm breakpoint), visible on desktop ✓
13. VR screenshots at 1440×900 match bible screenshots within 5% drift ✓

---

## 8. Progress

- [x] Assessment complete (2026-05-26)
- [ ] Plan created
- [ ] change-S01 through change-S16 executed
- [ ] Wave S reflected
- [ ] Wave W0 started
