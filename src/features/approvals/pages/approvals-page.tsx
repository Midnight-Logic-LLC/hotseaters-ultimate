/**
 * approvals-page.tsx — Time-entry + expense approval Kanban.
 *
 * BIBLE: HotSeatersMVP/src/pages/Approvals.jsx
 *
 * Renders three columns:
 *   1. Approve HSH Invoices  (only when enrichedHSHInvoices.length > 0)
 *   2. Approve Time
 *   3. Approve Expenses
 *
 * RULE B: no store imports here — only hooks.
 * RULE F: src/features/approvals/pages/
 */
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useTeam } from '@/features/company/hooks/use-team';
import { useBillingApprovals } from '@/features/approvals/hooks/use-billing-approvals';
import { ApprovalsCompactSummary } from '@/features/approvals/components/approvals-compact-summary';
import { ApproveTimeColumn } from '@/features/approvals/components/approve-time-column';
import { ApproveExpensesColumn } from '@/features/approvals/components/approve-expenses-column';
import { ApproveHSHInvoicesColumn } from '@/features/approvals/components/approve-hsh-invoices-column';

export function ApprovalsPage() {
  const { companyId } = useAuth();
  const { userInfo, company, isLoading: tier1Loading } = useTier1();
  const { members } = useTeam(companyId);
  const isMobile = useIsMobile();

  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [includeInProgress, setIncludeInProgress] = useState(false);

  const isOwnerOrAdmin =
    userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin';
  const isPerTrial = company?.invoice_period === 'per_trial';
  const effectiveIncludeInProgress = isPerTrial ? true : includeInProgress;

  const {
    data,
    isLoading: billingLoading,
    isApprovingTime,
    isApprovingExpenses,
    isApprovingHsh,
    approveTime,
    approveExp,
    approveHsh,
  } = useBillingApprovals(isOwnerOrAdmin ? companyId : null);

  const consultants = members;

  // Enrich HSH invoices with trial names from local trial list
  const enrichedHSHInvoices = useMemo(() => {
    if (!data) return [];
    return data.hshInvoices.map((inv) => {
      const trial = data.trials.find((t) => t.id === inv.trial_id);
      return { ...inv, trial_name: inv.trial_name ?? trial?.case_name ?? '' };
    });
  }, [data]);

  const isApprovalDataLoading = billingLoading;

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (tier1Loading) {
    return (
      <div style={{ padding: 'var(--theme-page-padding)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--theme-stone-500)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading approvals…</span>
        </div>
      </div>
    );
  }

  if (!isOwnerOrAdmin) {
    return (
      <div style={{ padding: 'var(--theme-page-padding)' }}>
        <p className="text-sm" style={{ color: 'var(--theme-stone-500)' }}>
          You do not have permission to view approvals.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{ padding: 'var(--theme-page-padding)', fontFamily: 'var(--theme-font-body)' }}
      className="lg:px-8"
    >
      <div style={{ maxWidth: 'var(--theme-max-content-width)' }} className="mx-auto">
        {/* Page Header — desktop only */}
        <div className="hidden lg:block mb-8">
          <h1
            className="font-bold mb-2"
            style={{
              fontFamily: 'var(--theme-font-page-title)',
              fontSize: 'var(--theme-text-page-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Approvals
          </h1>
          <p style={{ fontSize: 'var(--theme-text-body)', color: 'var(--theme-stone-600)' }}>
            Review and approve pending time entries and expenses
          </p>
        </div>

        {/* Summary Bar */}
        {!isPerTrial && (
          <ApprovalsCompactSummary
            company={company ?? null}
            timeEntries={data?.timeEntries ?? []}
            expenses={data?.expenses ?? []}
            consultants={consultants}
            trials={data?.trials ?? []}
            subcontractAssignments={data?.subcontractAssignments ?? []}
            includeInProgress={includeInProgress}
            onIncludeInProgressChange={setIncludeInProgress}
          />
        )}

        {/* Approval Columns */}
        <div
          className={
            isMobile
              ? 'flex flex-col gap-4'
              : `grid grid-cols-1 ${enrichedHSHInvoices.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`
          }
        >
          {enrichedHSHInvoices.length > 0 && (
            <ApproveHSHInvoicesColumn
              hshInvoices={enrichedHSHInvoices}
              subcontractorCompanies={data?.hshSubcontractorCompanies ?? []}
              companyId={companyId}
              isLoading={isApprovalDataLoading}
              trials={data?.trials ?? []}
              subcontractAssignments={data?.subcontractAssignments ?? []}
              onApprove={(ids) => void approveHsh(ids)}
              isApproving={isApprovingHsh}
            />
          )}

          <ApproveTimeColumn
            timeEntries={data?.timeEntries ?? []}
            selectedTimeEntries={selectedTimeEntries}
            setSelectedTimeEntries={setSelectedTimeEntries}
            consultants={consultants}
            companyId={companyId}
            company={company ?? null}
            subcontractAssignments={data?.subcontractAssignments ?? []}
            hshCompanies={data?.hshCompanies ?? []}
            trials={data?.trials ?? []}
            isLoading={isApprovalDataLoading}
            includeInProgress={effectiveIncludeInProgress}
            onApprove={(ids) => {
              void approveTime(ids).then(() => setSelectedTimeEntries([]));
            }}
            isApproving={isApprovingTime}
          />

          <ApproveExpensesColumn
            expenses={data?.expenses ?? []}
            selectedExpenses={selectedExpenses}
            setSelectedExpenses={setSelectedExpenses}
            consultants={consultants}
            companyId={companyId}
            company={company ?? null}
            subcontractAssignments={data?.subcontractAssignments ?? []}
            hshCompanies={data?.hshCompanies ?? []}
            trials={data?.trials ?? []}
            isLoading={isApprovalDataLoading}
            includeInProgress={effectiveIncludeInProgress}
            onApprove={(ids) => {
              void approveExp(ids).then(() => setSelectedExpenses([]));
            }}
            isApproving={isApprovingExpenses}
          />
        </div>
      </div>
    </div>
  );
}
