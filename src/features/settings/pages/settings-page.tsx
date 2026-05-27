/**
 * SettingsPage — generic shell for the plugin-ready settings tab registry.
 *
 * Reads `?tab=<id>` from the URL to set the initial active tab.
 * Calls `useTier1()` to build the SettingsAuthContext for tab visibility gating.
 * Renders all registered tabs via the Tabs primitive.
 *
 * Bible reference: HotSeatersMVP/src/pages/Settings.jsx
 * - Header copy: "Settings" / "Configure services, rates, and preferences"
 * - Tab list pattern: lines 268–349
 *
 * RULE B: page only consumes hooks — no direct store/DB imports.
 * RULE G: uses shadcn Tabs primitives.
 */

import { Suspense, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useTier1 } from '@/app/tier1-provider';
import {
  getRegisteredSettingsTabs,
  type SettingsAuthContext,
} from '@/features/settings/registry/settings-tab-registry';
import { PublishSeedDefaultsButton } from '@/features/company/components/publish-seed-defaults-button';

/** Simple skeleton shown while a tab component lazily loads. */
function SettingsTabSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/** Resolve the initial tab from the URL search param. */
function getInitialTab(fallback: string): string {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('tab');
    if (param) return param;
  }
  return fallback;
}

export function SettingsPage() {
  const { userInfo, company, role } = useTier1();

  const ctx: SettingsAuthContext = {
    userRole: role ?? null,
    companyRole: userInfo?.company_role ?? null,
    hasHshAddon: !!(company as { has_hsh_addon?: boolean } | null)
      ?.has_hsh_addon,
  };

  const tabs = getRegisteredSettingsTabs(ctx);
  const fallbackTab = tabs[0]?.id ?? 'company';
  const [activeTab, setActiveTab] = useState<string>(() =>
    getInitialTab(fallbackTab),
  );

  return (
    <div
      className="lg:px-8"
      style={{
        padding: 'var(--theme-page-padding)',
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 'var(--theme-max-content-width)' }}
      >
        {/* Header — exact bible copy (Settings.jsx lines 166–191) */}
        <div
          className="flex items-start justify-between gap-3"
          style={{ marginBottom: 'var(--theme-section-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Configure services, rates, and preferences
            </p>
          </div>
          {/* Phase 2f: Publish Seed Defaults — superadmin only; hidden on mobile. */}
          <div className="hidden sm:block flex-shrink-0">
            <PublishSeedDefaultsButton />
          </div>
        </div>

        {/* Mobile-only banner: equivalent of the header button. */}
        <div className="sm:hidden mb-4">
          <PublishSeedDefaultsButton className="w-full" />
        </div>

        {tabs.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            No settings tabs registered.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className="mb-6 h-auto w-full flex-wrap justify-start whitespace-nowrap"
              variant="line"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 px-2 sm:gap-2 sm:px-3"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabs.map((tab) => {
              const TabComponent = tab.component;
              return (
                <TabsContent key={tab.id} value={tab.id}>
                  <Suspense fallback={<SettingsTabSkeleton />}>
                    <TabComponent />
                  </Suspense>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}

