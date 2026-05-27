/**
 * settings-registration.ts — registers all company settings tabs with
 * the plugin-ready SettingsTab registry.
 *
 * Call registerCompanySettingsTabs() once at app boot (in app-providers.tsx).
 * Additional features may call registerSettingsTab() independently to inject
 * their own tabs without modifying this file.
 *
 * Self-hosted Supabase only (RULE 1). HotSeatersMVP is the bible (RULE 2).
 * Tab order, labels, icons, and canView gates are derived directly from
 * /Users/gqadonis/Projects/courtroom/HotSeatersMVP/src/pages/Settings.jsx.
 *
 * RULE B: no store imports here.
 * RULE E: no TanStack Query imports here.
 */
import { lazy } from 'react';
import {
  Building2,
  Clock,
  DollarSign,
  GitBranch,
  Layers,
  FileText,
  Palette,
  CreditCard,
  Orbit,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { registerSettingsTab } from '@/features/settings/registry/settings-tab-registry';

export function registerCompanySettingsTabs(): void {
  // 1. Company — all users (order 10)
  registerSettingsTab({
    id: 'company',
    label: 'Company',
    icon: Building2,
    component: lazy(() =>
      import('@/features/company/components/company-settings-tab').then((m) => ({
        default: m.CompanySettingsTab,
      })),
    ),
    order: 10,
    featureSlug: 'company',
  });

  // 2. Time Tracking — all users (order 20)
  registerSettingsTab({
    id: 'time_tracking',
    label: 'Time Tracking',
    icon: Clock,
    component: lazy(() =>
      import('@/features/company/components/time-tracking-settings-tab').then((m) => ({
        default: m.TimeTrackingSettingsTab,
      })),
    ),
    order: 20,
    featureSlug: 'company',
  });

  // 3. Billing — all users (order 30)
  registerSettingsTab({
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    component: lazy(() =>
      import('@/features/company/components/billing-settings-tab').then((m) => ({
        default: m.BillingSettingsTab,
      })),
    ),
    order: 30,
    featureSlug: 'company',
  });

  // 4. Services & Rates — all users (order 40)
  registerSettingsTab({
    id: 'services',
    label: 'Services & Rates',
    icon: DollarSign,
    component: lazy(() =>
      import('@/features/company/components/services-settings-tab').then((m) => ({
        default: m.ServicesSettingsTab,
      })),
    ),
    order: 40,
    featureSlug: 'company',
  });

  // 5. Pipeline Stages — all users (order 50)
  registerSettingsTab({
    id: 'pipeline',
    label: 'Pipeline Stages',
    icon: GitBranch,
    component: lazy(() =>
      import('@/features/company/components/pipeline-settings-tab').then((m) => ({
        default: m.PipelineSettingsTab,
      })),
    ),
    order: 50,
    featureSlug: 'company',
  });

  // 6. Tiers — all users (order 60)
  registerSettingsTab({
    id: 'tiers',
    label: 'Tiers',
    icon: Layers,
    component: lazy(() =>
      import('@/features/company/components/tiers-settings-tab').then((m) => ({
        default: m.TiersSettingsTab,
      })),
    ),
    order: 60,
    featureSlug: 'company',
  });

  // 7. Templates — all users (order 70)
  registerSettingsTab({
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    component: lazy(() =>
      import('@/features/company/components/templates-settings-tab').then((m) => ({
        default: m.TemplatesSettingsTab,
      })),
    ),
    order: 70,
    featureSlug: 'company',
  });

  // 8. Theme — platform admin only: user.role === 'admin' (order 80)
  registerSettingsTab({
    id: 'theme',
    label: 'Theme',
    icon: Palette,
    component: lazy(() =>
      import('@/features/company/components/theme-settings-tab').then((m) => ({
        default: m.ThemeSettingsTab,
      })),
    ),
    canView: (ctx) => ctx.userRole === 'admin',
    order: 80,
    featureSlug: 'company',
  });

  // 9. Subscription — company owners only: company_role === 'owner' (order 90)
  // Bible gate: userInfo?.company_role === 'owner'
  registerSettingsTab({
    id: 'subscription',
    label: 'Subscription',
    icon: CreditCard,
    component: lazy(() =>
      import('@/features/company/components/subscription-settings-tab').then((m) => ({
        default: m.SubscriptionSettingsTab,
      })),
    ),
    canView: (ctx) => ctx.companyRole === 'owner',
    order: 90,
    featureSlug: 'company',
  });

  // 10. HotSeatHub (marketplace) — (owner or admin) AND has_hsh_addon (order 100)
  // Bible gate: (company_role === 'owner' || company_role === 'admin') && company?.has_hsh_addon
  registerSettingsTab({
    id: 'marketplace',
    label: 'HotSeatHub',
    icon: Orbit,
    component: lazy(() =>
      import('@/features/company/components/marketplace-settings-tab').then((m) => ({
        default: m.MarketplaceSettingsTab,
      })),
    ),
    canView: (ctx) =>
      (ctx.companyRole === 'owner' || ctx.companyRole === 'admin') && ctx.hasHshAddon,
    order: 100,
    featureSlug: 'company',
  });

  // 11. Database — platform admin only: user.role === 'admin' (order 110)
  registerSettingsTab({
    id: 'database',
    label: 'Database',
    icon: Database,
    component: lazy(() =>
      import('@/features/company/components/database-settings-tab').then((m) => ({
        default: m.DatabaseSettingsTab,
      })),
    ),
    canView: (ctx) => ctx.userRole === 'admin',
    order: 110,
    featureSlug: 'company',
  });

  // 12. Admin — platform admin only: user.role === 'admin' (order 120)
  registerSettingsTab({
    id: 'admin',
    label: 'Admin',
    icon: AlertTriangle,
    component: lazy(() =>
      import('@/features/company/components/admin-settings-tab').then((m) => ({
        default: m.AdminSettingsTab,
      })),
    ),
    canView: (ctx) => ctx.userRole === 'admin',
    order: 120,
    featureSlug: 'company',
  });
}
