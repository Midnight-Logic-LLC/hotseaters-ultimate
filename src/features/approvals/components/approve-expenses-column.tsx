/**
 * approve-expenses-column.tsx — Kanban column for approving pending expenses.
 *
 * BIBLE: HotSeatersMVP/src/components/invoices/ApproveExpensesColumn.jsx
 *
 * Features:
 * - Trial / Person view tabs
 * - Group collapsing with indeterminate checkbox
 * - Per-entry checkbox selection
 * - Approve (selected) bulk action
 * - Receipt icon (no-op — ReceiptPreviewDialog not yet ported)
 * - HSH badge, straggler, in-progress indicators
 *
 * RULE B: no store imports.
 */
import { useState, useMemo } from 'react';
import { CheckCircle, Receipt, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/shared/ui/kanban-column';
import { getCurrentBillingPeriod } from '@/shared/lib/billing-period';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Company {
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  time_rounding_minutes?: number | null;
}

interface ExpenseRow {
  id: string;
  status?: string | null;
  date?: string | null;
  consultant_id?: string | null;
  trial_id?: string | null;
  amount?: number | null;
  category?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  subcontract_assignment_id?: string | null;
}

interface Consultant {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface Trial {
  id: string;
  case_name?: string | null;
  job_number?: string | null;
}

interface SubcontractAssignment {
  id: string;
  consultant_id?: string | null;
  consultant_first_name?: string | null;
  consultant_last_name?: string | null;
  subcontractor_company_id?: string | null;
}

interface HshCompany {
  id: string;
  name?: string | null;
}

interface ApproveExpensesColumnProps {
  expenses: ExpenseRow[];
  selectedExpenses: string[];
  setSelectedExpenses: (fn: (prev: string[]) => string[]) => void;
  consultants?: Consultant[];
  companyId?: string | null;
  company?: Company | null;
  subcontractAssignments?: SubcontractAssignment[];
  hshCompanies?: HshCompany[];
  trials?: Trial[];
  isLoading?: boolean;
  includeInProgress?: boolean;
  onApprove: (ids: string[]) => void;
  isApproving?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ApproveExpensesColumn({
  expenses,
  selectedExpenses,
  setSelectedExpenses,
  consultants = [],
  company,
  subcontractAssignments = [],
  hshCompanies = [],
  trials = [],
  isLoading = false,
  includeInProgress = false,
  onApprove,
  isApproving = false,
}: ApproveExpensesColumnProps) {
  const [view, setView] = useState<'trial' | 'person'>('trial');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const billingPeriod = useMemo(() => getCurrentBillingPeriod(company), [company]);

  const subcontractorConsultants = useMemo(
    () =>
      [
        ...new Map(
          subcontractAssignments
            .filter((sa) => sa.consultant_id && sa.consultant_first_name)
            .map((sa) => [
              sa.consultant_id,
              {
                id: sa.consultant_id!,
                first_name: sa.consultant_first_name,
                last_name: sa.consultant_last_name,
              },
            ]),
        ).values(),
      ] as Consultant[],
    [subcontractAssignments],
  );

  const allConsultants = useMemo(
    () => [...consultants, ...subcontractorConsultants],
    [consultants, subcontractorConsultants],
  );

  const jobNumberMap = useMemo(() => {
    const map: Record<string, { jobNumber: string; caseName: string }> = {};
    trials.forEach((t) => {
      map[t.id] = { jobNumber: t.job_number ?? '', caseName: t.case_name ?? '' };
    });
    return map;
  }, [trials]);

  const allPending = expenses.filter((exp) => exp.status === 'pending');

  const pendingExpenses = useMemo(() => {
    if (!includeInProgress) {
      return allPending.filter((exp) => exp.date !== null && exp.date !== undefined && exp.date <= billingPeriod.period_end);
    }
    return allPending;
  }, [allPending, billingPeriod, includeInProgress]);

  const selectedAmount = pendingExpenses
    .filter((exp) => selectedExpenses.includes(exp.id))
    .reduce((sum, exp) => sum + (exp.amount ?? 0), 0);

  const getExpenseParentLabel = (expense: ExpenseRow): string => {
    const info = jobNumberMap[expense.trial_id ?? ''];
    const jobNum = info?.jobNumber ?? '';
    const caseName = info?.caseName ?? expense.trial_id ?? 'No Trial';
    return jobNum ? `(${jobNum}) ${caseName}` : caseName;
  };

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, ExpenseRow[]> = {};
    pendingExpenses.forEach((expense) => {
      let key: string;
      if (view === 'trial') {
        key = getExpenseParentLabel(expense);
      } else {
        const consultant = allConsultants.find((c) => c.id === expense.consultant_id);
        key = consultant
          ? `${consultant.first_name ?? ''} ${consultant.last_name ?? ''}`.trim()
          : 'Unknown';
        if (expense.subcontract_assignment_id) {
          const sa = subcontractAssignments.find((s) => s.id === expense.subcontract_assignment_id);
          if (sa) {
            const co = hshCompanies.find((c) => c.id === sa.subcontractor_company_id);
            if (co) key += ` (${co.name})`;
          }
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(expense);
    });
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingExpenses, view, allConsultants, subcontractAssignments, hshCompanies, jobNumberMap]);

  const sortedGroups = useMemo(
    () =>
      Object.entries(groupedExpenses)
        .map(([key, exps]): [string, ExpenseRow[]] => [
          key,
          [...exps].sort((a, b) => new Date(a.date ?? '').getTime() - new Date(b.date ?? '').getTime()),
        ])
        .sort(([a], [b]) => {
          if (view === 'person') {
            const lastA = a.replace(/\s*\(.*\)$/, '').split(' ').slice(-1)[0] ?? '';
            const lastB = b.replace(/\s*\(.*\)$/, '').split(' ').slice(-1)[0] ?? '';
            return lastA.localeCompare(lastB) || a.localeCompare(b);
          }
          return a.localeCompare(b, undefined, { numeric: true });
        }),
    [groupedExpenses, view],
  );

  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const toggleExpense = (id: string) =>
    setSelectedExpenses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const getConsultantName = (expense: ExpenseRow): string => {
    if (expense.subcontract_assignment_id) {
      const sa = subcontractAssignments.find((s) => s.id === expense.subcontract_assignment_id);
      if (sa?.consultant_first_name && sa.consultant_last_name) {
        return `${sa.consultant_first_name} ${sa.consultant_last_name}`;
      }
    }
    const c = allConsultants.find((c) => c.id === expense.consultant_id);
    return c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : 'Unknown';
  };

  const innerContent = (
    <>
      {/* Tab + Approve button */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          {(['trial', 'person'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                view === v
                  ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                  : { color: 'var(--theme-stone-600)' }
              }
            >
              {v === 'trial' ? 'Trial' : 'Person'}
            </button>
          ))}
        </div>
        <Button
          onClick={() => selectedExpenses.length > 0 && onApprove(selectedExpenses)}
          disabled={selectedExpenses.length === 0 || isApproving}
          size="sm"
          style={{
            backgroundColor: selectedExpenses.length > 0 ? 'var(--theme-brand-primary)' : 'var(--theme-stone-200)',
            color: selectedExpenses.length > 0 ? 'white' : 'var(--theme-stone-600)',
            borderRadius: 'var(--theme-button-radius)',
          }}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isApproving ? 'Approving…' : `Approve (${selectedExpenses.length})`}
        </Button>
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {sortedGroups.map(([groupKey, exps]) => {
          const groupIds = exps.map((e) => e.id);
          const allSelected = groupIds.every((id) => selectedExpenses.includes(id));
          const someSelected = groupIds.some((id) => selectedExpenses.includes(id));
          const isCollapsed = collapsedGroups.has(groupKey);

          const handleGroupToggle = () => {
            if (allSelected) {
              setSelectedExpenses((prev) => prev.filter((id) => !groupIds.includes(id)));
            } else {
              setSelectedExpenses((prev) => [...new Set([...prev, ...groupIds])]);
            }
          };

          return (
            <div key={groupKey} className="bg-stone-50 rounded-lg border border-stone-200 overflow-hidden">
              {/* Group header */}
              <div
                className="flex items-center gap-2 font-medium text-sm text-stone-900 p-3 cursor-pointer hover:bg-stone-100 transition-colors"
                onClick={() => toggleGroup(groupKey)}
              >
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  style={{ color: 'var(--theme-stone-400)' }}
                />
                <span className="flex-1 truncate">{groupKey}</span>
                <span className="text-xs text-stone-500 flex-shrink-0">{exps.length}</span>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={handleGroupToggle}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0"
                />
              </div>

              {/* Entries */}
              {!isCollapsed && (
                <div className="px-3 pb-3">
                  {exps.map((expense) => {
                    const consultantName = getConsultantName(expense);
                    const isHsh = !!expense.subcontract_assignment_id;
                    const expDate = expense.date;
                    const isStraggler = expDate !== null && expDate !== undefined && expDate < billingPeriod.period_start;
                    const isInProgress = expDate !== null && expDate !== undefined && expDate > billingPeriod.period_end;

                    return (
                      <div
                        key={expense.id}
                        className="p-2 rounded border hover:opacity-90 mt-1"
                        style={{
                          backgroundColor: isHsh
                            ? 'var(--theme-hsh-background)'
                            : isStraggler
                            ? '#fef2f2'
                            : isInProgress
                            ? '#e7e5e4'
                            : '#FFFFFF',
                          borderColor: isStraggler ? '#f87171' : isInProgress ? '#a8a29e' : undefined,
                          borderWidth: isStraggler ? '1.5px' : undefined,
                        }}
                      >
                        {/* Top Row */}
                        <div className="flex items-center gap-3 mb-2">
                          {isInProgress && !includeInProgress ? (
                            <div className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedExpenses.includes(expense.id)}
                              onChange={() => toggleExpense(expense.id)}
                              className="w-4 h-4 flex-shrink-0"
                            />
                          )}
                          <p className="text-xs font-medium text-stone-900 whitespace-nowrap">
                            {expense.date
                              ? new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).split(',')[0]
                              : ''}{' '}
                            {expense.date
                              ? new Date(expense.date + 'T00:00:00').toLocaleDateString()
                              : ''}
                          </p>
                          {view === 'trial' ? (
                            <p className="text-xs font-medium text-stone-900 flex-1">{consultantName}</p>
                          ) : (
                            <p className="text-xs font-medium text-stone-900 flex-1 truncate">
                              {getExpenseParentLabel(expense)}
                            </p>
                          )}
                          {expense.receipt_url ? (
                            <button className="hover:opacity-70">
                              <Receipt className="w-3.5 h-3.5" style={{ color: 'var(--theme-stone-500)' }} />
                            </button>
                          ) : (
                            <div className="w-3.5 h-3.5" />
                          )}
                          <p className="text-xs font-medium text-stone-900 whitespace-nowrap text-right">
                            ${expense.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        {/* Bottom Row */}
                        <div className="ml-7">
                          <p className="text-xs">
                            <span className="text-stone-900 font-medium">{expense.category}:</span>{' '}
                            <span className="text-stone-500">{expense.description ?? '—'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {pendingExpenses.length === 0 && !isLoading && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--theme-stone-500)' }}>
            No pending expenses
          </p>
        )}
      </div>
    </>
  );

  return (
    <KanbanColumn
      title="Approve Expenses"
      count={pendingExpenses.length}
      total={`$${selectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      colorBorder="var(--theme-info)"
      icon={<Receipt className="w-10 h-10" />}
      isLoading={isLoading}
    >
      {innerContent}
    </KanbanColumn>
  );
}
