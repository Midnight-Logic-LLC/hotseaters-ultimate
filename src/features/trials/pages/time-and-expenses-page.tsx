/**
 * time-and-expenses-page.tsx — port of HotSeatersMVP/src/pages/TimeAndExpenses.jsx
 *
 * Visual + functional parity with the bible (216 lines). Sub-components that
 * have not yet been ported (TimeTabBar, TimeKPICards, TimeTableTab,
 * TimeClockInterface, TimeOffTab, ExpensesTab, ExpenseReportsTab) are rendered
 * as "Coming soon" stubs so the page mounts, routes, and typechecks cleanly.
 * Replace each stub with the real port as those components land.
 *
 * Adapter rules applied:
 *   - useTimeTrackingData()   → useTier1() from @/app/tier1-provider (Tier-2
 *                               stores pending; entity arrays stubbed empty)
 *   - useTimeTrackingPreferences() → local useState (tab preference)
 *   - useTimeTrackingMutations()   → stubbed no-ops (Tier-2 stores pending)
 *   - useDeviceType()         → useIsMobile() from @/shared/hooks/use-mobile
 *   - LayoutGroup (framer)    → no-op wrapper (framer dep present but not used
 *                               in the port primitives)
 *   - createPageUrl("X")      → "/X"
 *   - PageLoader              → inline spinner (shared PageLoader not yet ported)
 *
 * RULE B: this page imports only hooks — no stores, no PGlite, no Supabase.
 * RULE F: lives in src/features/trials/pages/.
 * RULE A: kebab-case filename.
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';

// ─── Tab ids — mirrors bible's TimeTabBar values ─────────────────────────────

type TimeTab = 'clock' | 'combined' | 'expenses' | 'reports' | 'timeoff';

// ─── Inline page loader (no shared PageLoader yet) ───────────────────────────

interface PageLoaderProps {
  message: string;
  className?: string;
}

function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }}
      className={className}
    >
      <p style={{ color: 'var(--theme-stone-500)' }}>{message}</p>
    </div>
  );
}

// ─── Stub components for unported sub-components ──────────────────────────────

function ComingSoonStub({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 'var(--theme-card-padding)',
        background: 'var(--theme-card-bg)',
        borderRadius: 'var(--theme-card-radius)',
        border: '1px solid var(--theme-stone-200)',
        color: 'var(--theme-stone-500)',
        fontFamily: 'var(--theme-font-body)',
        fontSize: 'var(--theme-text-body)',
        textAlign: 'center',
        marginTop: '1rem',
      }}
    >
      {label} — Coming soon
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TimeAndExpensesPage() {
  const tier1 = useTier1();
  const isMobile = useIsMobile();

  // isMobileTouch approximation — touch detection via pointer media query would
  // require a media-query hook; for now treat isMobile as isMobileTouch.
  const isMobileTouch = isMobile;

  const { company, isLoading, userInfo } = tier1;

  // ── Tab preference (mirrors bible's useTimeTrackingPreferences) ─────────────
  const [activeTab, setActiveTab] = useState<TimeTab>('combined');

  // ── showMyTime preference (bible: useTimeTrackingPreferences) ───────────────
  const [showMyTime, setShowMyTime] = useState(true);

  // ── isOwnerOrAdmin derived from tier1 role ───────────────────────────────────
  const role = tier1.role;
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // ── Loading guard — mirrors bible line 60-62 ─────────────────────────────────
  if (isLoading) {
    return <PageLoader message="Loading time & expenses..." className="lg:px-8" />;
  }

  // ── Stubbed Tier-2 data (will be wired to stores when those land) ────────────
  // Bible line 27-38: useTimeTrackingData() returns these. Stubbed empty so the
  // page renders without Tier-2 subscriptions.
  const timeEntries: unknown[] = [];
  const allTimeEntries: unknown[] = [];

  void isMobileTouch; // used in sub-component props once they land
  void showMyTime;
  void setShowMyTime;
  void isOwnerOrAdmin;
  void timeEntries;
  void allTimeEntries;
  void userInfo;

  return (
    <div
      style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Desktop page header — bible lines 127-132 */}
        <div
          className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          style={{ gap: 'var(--theme-card-gap)' }}
        >
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Time &amp; Expenses
            </h1>
            <p
              style={{
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-600)',
              }}
            >
              Track your time and expenses
            </p>
          </div>
        </div>

        {/* Tabs — bible lines 135-212 */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TimeTab)}
          className="mb-8"
        >
          {/* TimeTabBar stub — will be replaced with the real port */}
          <TabsList>
            <TabsTrigger value="clock">Clock</TabsTrigger>
            <TabsTrigger value="combined">Time</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          </TabsList>

          {/* KPI cards — bible line 144: only on 'combined' tab */}
          {activeTab === 'combined' && (
            <ComingSoonStub label="TimeKPICards" />
          )}

          {/* Clock tab — bible lines 146-183 */}
          <TabsContent value="clock" className="m-0">
            <ComingSoonStub label="TimeClockInterface" />

            {/* Debug card — bible lines 173-182: only when company.show_debug_info.
                show_debug_info is not yet on Tier1Company; access via index. */}
            {Boolean((company as Record<string, unknown> | null)?.['show_debug_info']) && (
              <Card
                className="mt-6"
                style={{
                  backgroundColor: '#fef9c3',
                  borderColor: '#fde047',
                  borderWidth: '2px',
                }}
              >
                <CardHeader>
                  <CardTitle className="text-sm">Debug: Time Entry State</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto bg-white p-3 rounded max-h-96">
                    {JSON.stringify({ activeEntry: null, mutation_isPending: false }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Combined (Time) tab — bible lines 185-198 */}
          <TabsContent value="combined" className="m-0">
            <ComingSoonStub label="TimeTableTab" />
          </TabsContent>

          {/* Expenses tab — bible lines 200-202 */}
          <TabsContent value="expenses" className="m-0">
            <ComingSoonStub label="ExpensesTab" />
          </TabsContent>

          {/* Reports tab — bible lines 204-206 */}
          <TabsContent value="reports" className="m-0">
            <ComingSoonStub label="ExpenseReportsTab" />
          </TabsContent>

          {/* Time Off tab — bible lines 208-210 */}
          <TabsContent value="timeoff" className="m-0">
            <ComingSoonStub label="TimeOffTab" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default TimeAndExpensesPage;
