# Tasks — change-S01

- [ ] T1. NEW `src/features/settings/registry/settings-tab-registry.ts`:
  - `export interface SettingsTabDefinition { id, label, icon, component, canView?, order, featureSlug }`
  - `export interface SettingsAuthContext { userRole: string|null, companyRole: string|null, hasHshAddon: boolean }`
  - Module-level `registry: Map<string, SettingsTabDefinition>`
  - `export function registerSettingsTab(def: SettingsTabDefinition): void`
  - `export function getRegisteredSettingsTabs(ctx: SettingsAuthContext): SettingsTabDefinition[]` — filters canView, sorts by order
  - `export function clearSettingsTabRegistry(): void` — test helper only

- [ ] T2. NEW `src/features/settings/pages/settings-page.tsx`:
  - Read `?tab=` from `window.location.search` (same pattern as bible line 30)
  - Call `useTier1()` for `userRole` (from `currentUser.role`), `companyRole` (from `currentUserInfo.company_role`), `hasHshAddon` (from `currentCompany.has_hsh_addon`)
  - `tabs = getRegisteredSettingsTabs(ctx)` — derived on render (no useMemo needed; registry is static after boot)
  - `useState(urlParams.get('tab') ?? tabs[0]?.id ?? 'company')` for activeTab
  - Page wrapper: `style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }} className="lg:px-8"`
  - Content wrapper: `style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto"`
  - Header section: h1 "Settings" + p "Configure services, rates, and preferences" — exact bible copy
  - `<PublishSeedDefaultsButton />` in header (import placeholder; real impl in S13)
  - Render `<Tabs value={activeTab} onValueChange={setActiveTab}>` containing the tab list + content panels
  - `TabsList className="w-full justify-start flex-wrap h-auto whitespace-nowrap"`
  - Each tab: `<TabsTrigger value={tab.id} className="flex items-center gap-1.5 px-2 sm:px-3 sm:gap-2"><tab.icon className="w-4 h-4" />{tab.label}</TabsTrigger>`
  - Each content: `<TabsContent value={tab.id}><Suspense fallback={<SettingsTabSkeleton />}><tab.component /></Suspense></TabsContent>`
  - `SettingsTabSkeleton`: a simple loading card skeleton matching the card visual style

- [ ] T3. MODIFY `src/app/app-router.tsx`:
  - Import `SettingsPage` from `@/features/settings/pages/settings-page`
  - Remove `CompanySettingsPage` import (if no longer used elsewhere)
  - Replace route `/Settings` element with `<SettingsPage />`
  - Replace route `/settings/company` element with `<SettingsPage />`
  - Remove `/settings/billing` `RoutePlaceholder` route entirely

- [ ] T4. NEW `src/features/settings/registry/__tests__/settings-tab-registry.spec.ts`:
  - `beforeEach(clearSettingsTabRegistry)`
  - Test: register two tabs with order 20 + 10 → getRegisteredSettingsTabs returns [order-10, order-20]
  - Test: canView returning false → tab excluded from result
  - Test: canView returning true → tab included
  - Test: no canView → always included

- [ ] T5. NEW `src/features/settings/pages/__tests__/settings-page.spec.tsx`:
  - Mock `useTier1` to return fixed user/company/role data
  - Register two fake tabs via `registerSettingsTab` in beforeEach; clear in afterEach
  - Render `<SettingsPage />` with MemoryRouter providing `?tab=billing`
  - Assert both tab triggers visible; billing tab content rendered
  - Assert canView-gated tab absent when gate returns false

- [ ] T6. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- Shell renders without crashing when no tabs are registered (empty state)
- `?tab=<value>` URL param controls initial active tab
- Role-gated tabs absent when user lacks the gate condition
- No file outside `src/features/settings/`, `src/app/app-router.tsx` modified
