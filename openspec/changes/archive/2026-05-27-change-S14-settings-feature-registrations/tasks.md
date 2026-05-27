# Tasks — change-S14

- [ ] T1. NEW `src/features/company/settings-registration.ts`:
  - Import `registerSettingsTab` from `@/features/settings/registry/settings-tab-registry`
  - Import all 12 icons from `lucide-react`
  - `export function registerCompanySettingsTabs(): void` — calls `registerSettingsTab` 12 times
  - All components: `component: React.lazy(() => import('./components/<tab-component-name>'))`
  - Exact tab order, labels, icons, and canView gates as specified in the proposal

- [ ] T2. MODIFY `src/app/app-providers.tsx`:
  - Import `registerCompanySettingsTabs` from `@/features/company/settings-registration`
  - Call `registerCompanySettingsTabs()` at the module's top level (outside the React component) so it runs once when the module is first imported

- [ ] T3. NEW integration test `src/features/settings/__tests__/settings-integration.spec.tsx`:
  - Call `registerCompanySettingsTabs()` in beforeAll; clear in afterAll
  - Mock `useTier1()` with role combinations:
    - Regular user: assert 7 tabs visible (no theme/subscription/marketplace/database/admin)
    - Admin user (role=admin): assert theme/database/admin tabs present
    - Owner user (companyRole=owner): assert subscription tab present
    - Owner with hsh_addon: assert marketplace tab present

- [ ] T4. `pnpm typecheck && pnpm lint && pnpm test` green

## Acceptance

- All 12 tabs registered
- canView gates work correctly for all role combinations (matching bible exactly)
- No circular imports (settings-registration imports from features/company/components, not vice versa)
