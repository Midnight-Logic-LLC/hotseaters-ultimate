/**
 * time-and-expenses-page.tsx — port of HotSeatersMVP/src/pages/TimeAndExpenses.jsx
 *
 * RULE B: imports only hooks — no stores, no PGlite, no Supabase.
 * RULE F: lives in src/features/trials/pages/.
 * RULE A: kebab-case filename.
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTimeTrackingData } from '@/features/trials/hooks/use-time-tracking-data';
import { useTimeTrackingMutations } from '@/features/trials/hooks/use-time-tracking-mutations';
import { TimeClockInterface } from '@/features/trials/components/time-clock-interface';
import { TimeKpiCards } from '@/features/trials/components/time-kpi-cards';
import { TimeTableTab } from '@/features/trials/components/time-table-tab';
import { ExpensesTab } from '@/features/trials/components/expenses-tab';
import { ExpenseReportsTab } from '@/features/trials/components/expense-reports-tab';
import { TimeOffTab } from '@/features/trials/components/time-off-tab';

// ─── Tab ids ──────────────────────────────────────────────────────────────────

type TimeTab = 'clock' | 'combined' | 'expenses' | 'reports' | 'timeoff';

// ─── Inline page loader ───────────────────────────────────────────────────────

function PageLoader({ message }: { message: string }) {
  return (
    <div
      style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }}
      className="lg:px-8"
    >
      <p style={{ color: 'var(--theme-stone-500)' }}>{message}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TimeAndExpensesPage() {
  const data = useTimeTrackingData();
  const {
    userInfo,
    company,
    isOwnerOrAdmin,
    pipelineStages,
    trials,
    clients,
    services,
    trialServices,
    trialSegments,
    consultants,
    timeEntries,
    allTimeEntries,
    activeEntry,
    userExpenses,
    allCompanyExpenses,
    expenseReports,
    timeOffRequests,
    isLoading,
    refetch,
  } = data;

  const mutations = useTimeTrackingMutations(refetch);

  const [activeTab, setActiveTab] = useState<TimeTab>('combined');
  const [showMyTime, setShowMyTime] = useState(true);
  const [showMyExpenses, setShowMyExpenses] = useState(true);
  const [timeStatusFilter, setTimeStatusFilter] = useState('All');
  const [personFilter, setPersonFilter] = useState('');

  const companyId = (userInfo?.['company_id'] as string) ?? '';
  const consultantId = (userInfo?.['id'] as string) ?? '';

  if (isLoading) {
    return <PageLoader message="Loading time & expenses..." />;
  }

  // Cast to typed arrays for sub-components
  type TERow = Record<string, unknown> & {
    id: string; start_time: string; end_time?: string; duration_hours?: number;
    status?: string; description?: string; trial_id?: string; service_id?: string;
    trial_service_id?: string; entry_type?: string; consultant_id?: string;
  };
  const timeEntriesTyped = timeEntries as TERow[];
  const allTimeEntriesTyped = allTimeEntries as TERow[];

  type TrialRow = Record<string, unknown> & { id: string; name: string; client_id: string; pipeline_stage_id?: string; status?: string };
  type ClientRow = Record<string, unknown> & { id: string; name: string };
  type ServiceRow = Record<string, unknown> & { id: string; name: string };
  type TSRow = Record<string, unknown> & { id: string; trial_id: string; service_id: string; is_active?: boolean; travel_eligible?: boolean; rate?: number };
  type PSRow = Record<string, unknown> & { id: string; name: string; order_num?: number };
  type ConsultantRow = Record<string, unknown> & { id: string; first_name?: string; last_name?: string };
  type ExpRow = Record<string, unknown> & { id: string; trial_id?: string; amount: number; description?: string; category?: string; expense_date?: string; status?: string; consultant_id?: string; is_billable?: boolean; is_reimbursable?: boolean };
  type ExpReportRow = Record<string, unknown> & { id: string; report_number?: string; period_start?: string; period_end?: string; status?: string; pdf_url?: string; total_amount?: number };
  type TimeOffRow = Record<string, unknown> & { id: string; consultant_id?: string; type?: string; start_date?: string; end_date?: string; notes?: string; status?: string };
  type SegRow = Record<string, unknown> & { id: string; trial_id: string };

  return (
    <div
      style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Desktop page header */}
        <div className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1
              className="font-bold mb-2"
              style={{
                fontFamily: 'var(--theme-font-page-title)',
                fontSize: 'var(--theme-text-page-title)',
                color: 'var(--theme-stone-900)',
              }}
            >
              Time &amp; Expenses
            </h1>
            <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
              Track your time and expenses
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TimeTab)} className="mb-8">
          <TabsList>
            <TabsTrigger value="clock">Clock</TabsTrigger>
            <TabsTrigger value="combined">Time</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          </TabsList>

          {/* KPI cards on combined tab */}
          {activeTab === 'combined' && (
            <TimeKpiCards timeEntries={timeEntriesTyped} company={company} />
          )}

          {/* Clock tab */}
          <TabsContent value="clock" className="m-0">
            <TimeClockInterface
              trials={trials as TrialRow[]}
              clients={clients as ClientRow[]}
              services={services as ServiceRow[]}
              trialServices={trialServices as TSRow[]}
              pipelineStages={pipelineStages as PSRow[]}
              onCreateEntry={mutations.handleCreateEntry}
              onStartTracking={mutations.handleStartTracking}
              onCancelTracking={mutations.handleCancelTracking}
              onUpdateDescription={mutations.handleUpdateDescription}
              activeEntry={activeEntry as (Record<string, unknown> & { id: string; start_time: string; status?: string; description?: string; end_time?: string }) | null}
              isLoading={false}
              companyId={companyId}
              consultantId={consultantId}
              timeEntries={timeEntriesTyped}
              expenses={userExpenses as (Record<string, unknown> & { id: string; trial_id?: string; amount: number })[]}
              trialSegments={trialSegments as SegRow[]}
            />

            {/* Debug card */}
            {Boolean((company as Record<string, unknown> | null)?.['show_debug_info']) && (
              <Card
                className="mt-6"
                style={{ backgroundColor: '#fef9c3', borderColor: '#fde047', borderWidth: '2px' }}
              >
                <CardHeader>
                  <CardTitle className="text-sm">Debug: Time Entry State</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto bg-white p-3 rounded max-h-96">
                    {JSON.stringify({ activeEntry, isMutating: mutations.isMutating }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Time (combined) tab */}
          <TabsContent value="combined" className="m-0">
            <TimeTableTab
              timeEntries={timeEntriesTyped}
              allTimeEntries={allTimeEntriesTyped}
              isOwnerOrAdmin={isOwnerOrAdmin}
              showMyTime={showMyTime}
              onToggleMyTime={() => setShowMyTime((v) => !v)}
              timeStatusFilter={timeStatusFilter}
              onStatusFilterChange={setTimeStatusFilter}
              personFilter={personFilter}
              onPersonFilterChange={(id) => setPersonFilter(id ?? '')}
              consultants={consultants as ConsultantRow[]}
              trials={trials as TrialRow[]}
              clients={clients as ClientRow[]}
              services={services as ServiceRow[]}
              onApprove={mutations.handleApproveEntry}
              onReject={mutations.handleRejectEntry}
              onDelete={mutations.handleDeleteEntry}
              isMutating={mutations.isMutating}
            />
          </TabsContent>

          {/* Expenses tab */}
          <TabsContent value="expenses" className="m-0">
            <ExpensesTab
              userExpenses={userExpenses as ExpRow[]}
              allCompanyExpenses={allCompanyExpenses as ExpRow[]}
              isOwnerOrAdmin={isOwnerOrAdmin}
              showMyExpenses={showMyExpenses}
              onToggleMyExpenses={() => setShowMyExpenses((v) => !v)}
              trials={trials as TrialRow[]}
              consultants={consultants as ConsultantRow[]}
              onCreateExpense={mutations.handleCreateExpense}
              onApproveExpense={mutations.handleApproveExpense}
              onDeleteExpense={mutations.handleDeleteExpense}
              isMutating={mutations.isMutating}
              companyId={companyId}
              consultantId={consultantId}
            />
          </TabsContent>

          {/* Reports tab */}
          <TabsContent value="reports" className="m-0">
            <ExpenseReportsTab
              expenseReports={expenseReports as ExpReportRow[]}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Time Off tab */}
          <TabsContent value="timeoff" className="m-0">
            <TimeOffTab
              timeOffRequests={timeOffRequests as TimeOffRow[]}
              isOwnerOrAdmin={isOwnerOrAdmin}
              consultants={consultants as ConsultantRow[]}
              userInfoId={consultantId}
              onCreateTimeOff={mutations.handleCreateTimeOff}
              onApproveTimeOff={mutations.handleApproveTimeOff}
              onDenyTimeOff={mutations.handleDenyTimeOff}
              isMutating={mutations.isMutating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default TimeAndExpensesPage;
