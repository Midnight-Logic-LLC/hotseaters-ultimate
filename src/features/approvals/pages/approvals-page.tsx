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
 * Parity notes
 * ─────────────
 * - Visible header: "Approvals" + sub-copy "Review and approve pending time
 *   entries and expenses" (desktop only, hidden on mobile — matches bible).
 * - isPerTrial guard around ApprovalsCompactSummary.
 * - Grid: 2-col (lg) normally, 3-col when HSH invoices present.
 * - All var(--theme-*) tokens preserved verbatim.
 * - Sub-components (ApproveTimeColumn, ApproveExpensesColumn,
 *   ApproveHSHInvoicesColumn, ApprovalsCompactSummary) are Tier-2 stubs
 *   that render a loading-safe placeholder — they will be ported separately.
 * - Tier-2 data stubs (empty arrays) until the billing store lands.
 *
 * RULE B: no store imports here — only hooks.
 * RULE F: src/features/approvals/pages/
 */
import { useState } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

// ── Tier-2 data stubs (replace with real hooks when billing store lands) ──────
const EMPTY_ARR: never[] = [];

// ── Inline stub sub-columns ───────────────────────────────────────────────────
// These render a placeholder matching the bible's column chrome until the real
// components are ported (ApproveTimeColumn, ApproveExpensesColumn, etc.).

interface StubColumnProps {
  title: string;
  isLoading: boolean;
}

function StubColumn({ title, isLoading }: StubColumnProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderRadius: 'var(--theme-card-radius)',
        border: '1px solid var(--theme-stone-200)',
        padding: 'var(--theme-card-padding)',
        boxShadow: 'var(--theme-card-shadow)',
        minHeight: 200,
      }}
    >
      <p
        className="font-semibold text-sm mb-3"
        style={{ color: 'var(--theme-stone-900)' }}
      >
        {title}
      </p>
      {isLoading ? (
        <div className="flex items-center gap-2" style={{ color: 'var(--theme-stone-500)' }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : (
        <p className="text-xs text-center py-8" style={{ color: 'var(--theme-stone-500)' }}>
          No items pending
        </p>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ApprovalsPage() {
  const [selectedTimeEntries, setSelectedTimeEntries] = useState<string[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [includeInProgress, setIncludeInProgress] = useState(false);

  void setSelectedTimeEntries;
  void setSelectedExpenses;

  const { userInfo, company, isLoading: tier1Loading } = useTier1();
  const isMobile = useIsMobile();

  // ── Tier-2 stubs (real stores pending) ─────────────────────────────────────
  const timeEntries = EMPTY_ARR;
  const expenses = EMPTY_ARR;
  const consultants = EMPTY_ARR;
  const trials = EMPTY_ARR;
  const subcontractAssignments = EMPTY_ARR;
  const hshCompanies = EMPTY_ARR;
  const hshInvoices = EMPTY_ARR;
  const enrichedHSHInvoices = EMPTY_ARR;
  const hshSubcontractorCompanies = EMPTY_ARR;
  const isApprovalDataLoading = false;

  // ── Business rules ──────────────────────────────────────────────────────────
  const isOwnerOrAdmin =
    userInfo?.company_role === 'owner' || userInfo?.company_role === 'admin';

  const isPerTrial = company?.invoice_period === 'per_trial';
  const effectiveIncludeInProgress = isPerTrial ? true : includeInProgress;

  void selectedTimeEntries;
  void selectedExpenses;
  void effectiveIncludeInProgress;
  void timeEntries;
  void expenses;
  void consultants;
  void trials;
  void subcontractAssignments;
  void hshCompanies;
  void hshInvoices;
  void hshSubcontractorCompanies;

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
        {/* Page Header — desktop only (bible: hidden on mobile) */}
        <div className="hidden lg:block mb-8">
          <h1
            className="font-bold mb-2"
            style={{
              fontSize: 'var(--theme-text-page-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Approvals
          </h1>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
            }}
          >
            Review and approve pending time entries and expenses
          </p>
        </div>

        {/* Summary Bar — hidden when per_trial billing (bible line 221–232) */}
        {!isPerTrial && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              border: '1px solid var(--theme-stone-200)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--theme-stone-600)' }}>
                Include in-progress
              </span>
              <button
                onClick={() => setIncludeInProgress((v) => !v)}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: includeInProgress
                    ? 'var(--theme-brand-primary)'
                    : 'var(--theme-stone-300)',
                }}
                aria-checked={includeInProgress}
                role="switch"
              >
                <span
                  className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                  style={{ transform: `translateX(${includeInProgress ? '18px' : '2px'})` }}
                />
              </button>
            </div>
          </div>
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
            <StubColumn
              title="HSH Invoices"
              isLoading={isApprovalDataLoading}
            />
          )}
          <StubColumn
            title="Approve Time"
            isLoading={isApprovalDataLoading}
          />
          <StubColumn
            title="Approve Expenses"
            isLoading={isApprovalDataLoading}
          />
        </div>
      </div>
    </div>
  );
}
