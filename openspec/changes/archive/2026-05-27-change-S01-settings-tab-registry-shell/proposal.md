# change-S01 — Settings tab registry + SettingsPage shell + route wiring

## Why

The current `CompanySettingsPage` (v0.1) is a 5-tab scaffold with wrong labels
("Firm Info" instead of "Company") and only placeholder content for billing and
pipeline tabs. The bible's `Settings.jsx` has 12 tabs (7 visible to all users,
plus role-gated tabs).

The user requires a **plugin-ready settings registry** so that each feature can
register its own settings tab independently. Future third-party plugins call the
same `registerSettingsTab()` at init time — no changes to the shell needed.

This change establishes the architectural skeleton:
1. The registry module (static Map + register/get functions)
2. The generic `SettingsPage` shell (reads registry, renders tabs from URL param)
3. Route wiring in `app-router.tsx` pointing `/Settings` and `/settings/*` to the new shell

Individual tab content components land in S02–S14.

## What changes

1. NEW `src/features/settings/registry/settings-tab-registry.ts`
   - `SettingsTabDefinition` interface
   - `SettingsAuthContext` interface
   - `registerSettingsTab(def)` — adds to module-level Map
   - `getRegisteredSettingsTabs(ctx)` — returns sorted, gate-filtered list
   - `clearSettingsTabRegistry()` — test-only helper

2. NEW `src/features/settings/pages/settings-page.tsx`
   - Reads `activeTab` from `?tab=` URL param (defaults to first registered tab)
   - Reads auth context from `useTier1()` (`userRole`, `companyRole`, `hasHshAddon`)
   - Calls `getRegisteredSettingsTabs(ctx)` and renders:
     - `Tabs` → `TabsList` (w-full, justify-start, flex-wrap, h-auto) → one `TabsTrigger` per registered tab
     - `TabsContent` per registered tab (lazy-loaded component)
   - Page header: "Settings" h1 + "Configure services, rates, and preferences" subtitle
   - `PublishSeedDefaultsButton` in header (desktop: `hidden sm:block flex-shrink-0`; mobile: `sm:hidden mb-4` full-width)
   - All theme tokens match bible exactly (`--theme-page-padding`, `--theme-text-page-title`, etc.)

3. MODIFY `src/app/app-router.tsx`
   - Replace `CompanySettingsPage` imports with `SettingsPage`
   - Route `/Settings` → `<SettingsPage />`
   - Route `/settings/company` → `<SettingsPage />` (same component; URL param handled internally)
   - Remove `/settings/billing` `RoutePlaceholder`

4. NEW `src/features/settings/registry/__tests__/settings-tab-registry.spec.ts`
   - Test register + get (sorted by order)
   - Test canView gate filters correctly per auth context
   - Test clearSettingsTabRegistry resets state

5. NEW `src/features/settings/pages/__tests__/settings-page.spec.tsx`
   - Render with mocked registry (2 tabs)
   - Assert correct tab labels render
   - Assert `?tab=billing` selects billing tab
   - Assert role-gated tab hidden when canView returns false

## Acceptance

- `pnpm typecheck && pnpm lint && pnpm test` green
- Navigate to `/Settings` → page renders with tab bar (initially empty content
  until tabs are registered in S14, but shell structure is correct)
- `?tab=billing` URL param → billing tab selected on mount
- No role-gated tab visible when user lacks the required role
