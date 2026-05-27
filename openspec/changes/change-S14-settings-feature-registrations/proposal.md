# change-S14 — Feature registrations: wire all tabs into registry + app-providers boot

## Why

Changes S01–S13 deliver the shell and all tab components. S14 is the wiring
step: each feature calls `registerSettingsTab()` with its component and metadata,
and `app-providers.tsx` calls the registration functions at boot.

This is deliberately last (after all tab components exist) so each registration
can import the real component, not a placeholder.

## What changes

1. NEW `src/features/company/settings-registration.ts`
   - Calls `registerSettingsTab(...)` for all 12 tabs:
     - company (order 10, Building2 icon)
     - time_tracking (order 20, Clock icon)
     - billing (order 30, DollarSign icon)
     - services (order 40, DollarSign icon)
     - pipeline (order 50, GitBranch icon)
     - tiers (order 60, Layers icon)
     - templates (order 70, FileText icon)
     - theme (order 80, Palette icon, canView: ctx => ctx.userRole === 'admin')
     - subscription (order 90, CreditCard icon, canView: ctx => ctx.companyRole === 'owner')
     - marketplace (order 100, Orbit icon, canView: ctx => (ctx.companyRole === 'owner' || ctx.companyRole === 'admin') && ctx.hasHshAddon)
     - database (order 110, Database icon, canView: ctx => ctx.userRole === 'admin')
     - admin (order 120, AlertTriangle icon, canView: ctx => ctx.userRole === 'admin')
   - All components are lazy-imported with `React.lazy(() => import(...))`

2. MODIFY `src/app/app-providers.tsx`
   - Import and call `registerCompanySettingsTabs()` from the registration module
   - Call happens once at module evaluation (before any component renders)

## Acceptance

- Navigate to `/Settings` → all 12 tabs visible (role-appropriate)
- `?tab=billing` → Billing tab active on mount
- Theme, Database, Admin tabs hidden for non-admin users
- Subscription tab hidden for non-owner users
- HotSeatHub tab hidden when `!company.has_hsh_addon`
