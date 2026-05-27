# Plan — hotseaters-page-parity-port (Wave S: Settings Infrastructure)
_Generated: 2026-05-26_

---

## Overview

This phase ports every page from `HotSeatersMVP` (the bible) to `hotseaters-ultimate`.
Per the user's direction, **Wave S — Settings Infrastructure** ships first because
settings values are shared across the whole application and affect behavior on
every navigation route.

Wave S delivers: a plugin-ready settings tab registry, a generic Settings page
shell, all 12 bible settings tabs ported with full functional + visual parity,
and the `entity_setting` / `SettingsType` entity graph registration.

Waves W0–W8 (public surface, auth surface, app shell, sales, operations, billing,
HotSeatHub, and documents) follow in sequence after Wave S is fully verified.

---

## Change Backend

**OpenSpec** — `openspec/changes/change-S*/` directories created.

---

## Execution Order

Changes execute sequentially. Dependencies noted below.

### Foundation layer (must ship first)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 1 | change-S01 | Settings tab registry + SettingsPage shell + route wiring | — |
| 2 | change-S02 | Register SettingsType + EntitySetting entities in graph | — |
| 3 | change-S15 | useEntitySetting hook + settings-store | S02 |

### Tab content layer (parallel-safe after S01 + S02)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 4 | change-S03 | Company tab full parity (logo, 22 fields, financial card) | S01 |
| 5 | change-S04 | Time Tracking tab full parity | S03 (uses useCompanySettings extension) |
| 6 | change-S05 | Billing tab full parity (retainer formula, invoice period) | S03 |
| 7 | change-S06 | Services & Rates tab full parity (DnD, inline edit, deactivate) | S01 |
| 8 | change-S07 | Pipeline Stages tab full parity (DnD, color picker) | S01 |
| 9 | change-S08 | Tiers tab full parity | S01 |
| 10 | change-S09 | Templates tab — list view + create/delete (editor deferred) | S01 |
| 11 | change-S10 | Theme tab full parity (all ~80 tokens, live preview, export/import) | S01 |
| 12 | change-S11 | Subscription tab + PolicyViewerModal | S01 |
| 13 | change-S12 | HotSeatHub/Marketplace tab (profit margin + decline prefs) | S01, S15 |
| 14 | change-S13 | Database + Admin tabs + PublishSeedDefaultsButton | S01 |

### Wiring + verification layer (must be last)

| # | Change ID | Title | Depends on |
|---|-----------|-------|-----------|
| 15 | change-S14 | Feature registrations (all 12 tabs wired into registry + boot) | S01–S13 |
| 16 | change-S16 | Visual parity VR screenshots + Lighthouse a11y | S14 |

---

## Agent Recommendations

| Change | Recommended agent | Notes |
|--------|------------------|-------|
| S01 | `code-architect` → `build-error-resolver` | Registry pattern needs careful interface design |
| S02 | `code-architect` | Entity registration follows existing patterns in codebase |
| S15 | `code-architect` | Store + hook pair, RULE D must be observed |
| S03 | `gan-generator` | Complex form with 22 fields; use bible CompanySettingsTab.jsx as spec |
| S04 | `gan-generator` | Simpler; follow S03 patterns |
| S05 | `gan-generator` | Contains business rule (retainer formula) — extract to business-rules/ |
| S06 | `gan-generator` | Largest tab (983 LOC bible); may need multiple sub-agent dispatches |
| S07 | `gan-generator` | DnD + color picker |
| S08 | `gan-generator` | Read TierManagement.jsx first |
| S09 | `gan-generator` | Simpler (list view + stubs) |
| S10 | `gan-generator` | Large (2120 LOC bible); token catalog extraction first |
| S11 | `gan-generator` | Read SubscriptionManagement.jsx + PolicyViewerModal.jsx first |
| S12 | `gan-generator` | Depends on S15 for preferences JSONB |
| S13 | `gan-generator` | Adapt to port architecture (PGlite, not base44 DB) |
| S14 | `code-architect` | Wiring step; all components must exist before executing |
| S16 | `e2e-runner` | Playwright screenshots + Lighthouse |

---

## New Files Summary

### New feature directory
```
src/features/settings/
  entities.ts
  registry/
    settings-tab-registry.ts
    __tests__/settings-tab-registry.spec.ts
  pages/
    settings-page.tsx
    __tests__/settings-page.spec.tsx
  hooks/
    use-entity-setting.ts
    use-settings-type-by-key.ts
  stores/
    settings-store.ts
    __tests__/settings-store.spec.ts
  __tests__/
    settings-integration.spec.tsx
```

### Modifications to existing files
```
src/features/company/
  hooks/use-company-settings.ts          — extend to 22 fields + updateCompanyImmediate
  settings-registration.ts               — NEW: registers all 12 tabs
  business-rules/
    format-phone.ts                       — NEW
    retainer-formula.ts                   — NEW
    __tests__/format-phone.spec.ts        — NEW
    __tests__/retainer-formula.spec.ts    — NEW
  components/
    company-settings-tab.tsx              — NEW
    time-tracking-settings-tab.tsx        — NEW
    billing-settings-tab.tsx              — NEW
    services-settings-tab.tsx             — NEW
    service-form.tsx                      — NEW
    pipeline-settings-tab.tsx             — NEW
    tiers-settings-tab.tsx                — NEW
    templates-settings-tab.tsx            — NEW
    theme-settings-tab.tsx                — NEW
    subscription-settings-tab.tsx         — NEW
    subscription-management.tsx           — NEW
    policy-viewer-modal.tsx               — NEW
    marketplace-settings-tab.tsx          — NEW
    database-settings-tab.tsx             — NEW
    admin-settings-tab.tsx                — NEW
    publish-seed-defaults-button.tsx      — NEW
    __tests__/[all above].spec.tsx        — NEW per component

src/shared/lib/
  theme-tokens.ts                         — NEW: token catalog

src/app/
  app-router.tsx                          — route /Settings to SettingsPage
  app-providers.tsx                       — call registerCompanySettingsTabs()

tests/visual-parity/specs/
  settings-company.spec.ts                — NEW
  settings-billing.spec.ts                — NEW
  settings-services.spec.ts              — NEW
  settings-pipeline.spec.ts              — NEW
  settings-tabs-smoke.spec.ts             — NEW
```

### Deleted files
```
src/features/company/pages/company-settings-page.tsx  — replaced by settings-page.tsx
```

---

## Reusable Existing Patterns

- `src/features/company/hooks/use-company-settings.ts` — extend, don't replace
- `src/features/company/stores/company-store.ts` — add `updateCompanyImmediate` action
- `src/app/tier1-provider.tsx` — `useTier1()` already provides company/user/roles
- `src/shared/lib/theme.ts` — `applyThemeVars()` already exists; use in theme tab
- `src/features/company/business-rules/seed-company.ts` — `isSeedSuperadmin()` for button gate
- `@hello-pangea/dnd` — already in package.json; use for all DnD tabs
- `src/components/ui/alert-dialog.tsx` — already exists; use for all destructive confirms

---

## Wave S Completion Gate

Wave S is complete and Wave W0 can start when ALL of the following are true:

1. `pnpm typecheck && pnpm lint && pnpm test` green
2. Navigate to `/Settings` as authenticated owner → all 12 tabs visible and functional
3. Company tab: save 22 fields → `company` row updated in self-hosted Supabase
4. Billing tab: retainer formula calculator computes correctly
5. Services tab: create / edit / reorder / deactivate service works
6. Pipeline tab: reorder + recolor stage works; delete-with-deals warns
7. Theme tab (admin): change token → live preview + save to `company.theme`
8. Subscription tab (owner only): visible; policy modal opens
9. HotSeatHub tab: marketplace toggle + decline prefs save to correct tables
10. VR screenshots at 1440×900 within ≤5% drift of bible
11. Mobile layout (375×667) no horizontal overflow
12. Lighthouse a11y ≥ 90

---

## Deferred (not in Wave S)

- Full document template rich-text editor (deferred to Wave W8)
- Full privacy/terms policy text content (deferred to Wave W1 public surface)
- Google Calendar OAuth integration (deferred; `user.google_calendar` settings_type exists but feature not built)
- npm publish `@prometheus-ags/prometheus-entity-management@1.3.2` (needs credentials)
