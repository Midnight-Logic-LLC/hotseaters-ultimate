/**
 * approvals-compact-summary.tsx — Billing period summary bar + straggler badge.
 *
 * BIBLE: HotSeatersMVP/src/components/approvals/ApprovalsCompactSummary.jsx
 *
 * Renders:
 * - Billing period label ("Billing month: March 2025")
 * - Stragglers clickable badge (expands to show the out-of-period entries)
 * - Include in-progress toggle (when inProgressCount > 0)
 *
 * RULE B: no store imports.
 */
import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, Timer, Receipt } from 'lucide-react';
import {
  getCurrentBillingPeriod,
  getCurrentInProgressBillingPeriod,
  formatHours,
  formatCurrency,
} from '@/shared/lib/billing-period';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Company {
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  time_rounding_minutes?: number | null;
}

interface TimeEntry {
  id: string;
  status?: string | null;
  start_time?: string | null;
  consultant_id?: string | null;
  trial_id?: string | null;
  duration_hours?: number | null;
  amount?: number | null;
  service_name?: string | null;
  description?: string | null;
  subcontract_assignment_id?: string | null;
}

interface Expense {
  id: string;
  status?: string | null;
  date?: string | null;
  consultant_id?: string | null;
  trial_id?: string | null;
  amount?: number | null;
  category?: string | null;
  description?: string | null;
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
  consultant_first_name?: string | null;
  consultant_last_name?: string | null;
}

interface ApprovalsCompactSummaryProps {
  company: Company | null | undefined;
  timeEntries?: TimeEntry[];
  expenses?: Expense[];
  consultants?: Consultant[];
  trials?: Trial[];
  subcontractAssignments?: SubcontractAssignment[];
  includeInProgress?: boolean;
  onIncludeInProgressChange?: (value: boolean) => void;
}

// ── Straggler detail sub-component ────────────────────────────────────────────

interface StragglerDetailProps {
  stragglerTimeEntries: TimeEntry[];
  stragglerExpenses: Expense[];
  consultants: Consultant[];
  trials: Trial[];
  subcontractAssignments: SubcontractAssignment[];
  company: Company | null | undefined;
}

function StragglerDetail({
  stragglerTimeEntries,
  stragglerExpenses,
  consultants,
  trials,
  subcontractAssignments,
  company,
}: StragglerDetailProps) {
  const getConsultantName = (id: string | null | undefined, subAssignId: string | null | undefined): string => {
    if (subAssignId) {
      const assignment = subcontractAssignments.find((sa) => sa.id === subAssignId);
      if (assignment?.consultant_first_name && assignment?.consultant_last_name) {
        return `${assignment.consultant_first_name} ${assignment.consultant_last_name}`;
      }
    }
    const c = id ? consultants.find((c) => c.id === id) : undefined;
    return c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : 'Unknown';
  };

  const getTrialInfo = (id: string | undefined): string => {
    const t = trials.find((t) => t.id === id);
    if (!t) return '';
    return t.job_number ? `(${t.job_number}) ${t.case_name}` : (t.case_name ?? '');
  };

  const formatDateWithDay = (d: string | null | undefined): string => {
    if (!d) return '';
    const dateStr = d.length > 10 ? d.substring(0, 10) : d;
    const date = new Date(dateStr + 'T00:00:00');
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    return `${weekday} ${formatted}`;
  };

  return (
    <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: '1px solid var(--theme-stone-200)' }}>
      {stragglerTimeEntries.map((te) => (
        <div key={te.id} className="rounded-md border-2 border-red-300 bg-red-50 p-2">
          <div className="flex items-center gap-2 text-xs">
            <Timer className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
            <span className="font-medium whitespace-nowrap" style={{ color: 'var(--theme-stone-700)' }}>
              {formatDateWithDay(te.start_time)}
            </span>
            <span style={{ color: 'var(--theme-stone-700)' }}>
              {getConsultantName(te.consultant_id, te.subcontract_assignment_id)}
            </span>
            <span className="ml-auto font-medium whitespace-nowrap" style={{ color: 'var(--theme-stone-800)' }}>
              {te.duration_hours != null ? formatHours(te.duration_hours, company) : ''}
              {te.amount != null ? ` · ${formatCurrency(te.amount)}` : ''}
            </span>
          </div>
          <div className="ml-6 mt-0.5 text-xs">
            {te.trial_id && (
              <span style={{ color: 'var(--theme-stone-500)' }}>{getTrialInfo(te.trial_id)}</span>
            )}
            {te.service_name && (
              <span style={{ color: 'var(--theme-stone-500)' }}>
                {te.trial_id ? ' · ' : ''}
                {te.service_name}
              </span>
            )}
            {te.description && (
              <span style={{ color: 'var(--theme-stone-400)' }}> — {te.description}</span>
            )}
          </div>
        </div>
      ))}
      {stragglerExpenses.map((exp) => (
        <div key={exp.id} className="rounded-md border-2 border-red-300 bg-red-50 p-2">
          <div className="flex items-center gap-2 text-xs">
            <Receipt className="w-3.5 h-3.5 flex-shrink-0 text-orange-500" />
            <span className="font-medium whitespace-nowrap" style={{ color: 'var(--theme-stone-700)' }}>
              {formatDateWithDay(exp.date)}
            </span>
            <span style={{ color: 'var(--theme-stone-700)' }}>
              {getConsultantName(exp.consultant_id, exp.subcontract_assignment_id)}
            </span>
            <span className="ml-auto font-medium whitespace-nowrap" style={{ color: 'var(--theme-stone-800)' }}>
              {formatCurrency(exp.amount)}
            </span>
          </div>
          <div className="ml-6 mt-0.5 text-xs">
            {exp.trial_id && (
              <span style={{ color: 'var(--theme-stone-500)' }}>{getTrialInfo(exp.trial_id)}</span>
            )}
            {exp.category && (
              <>
                {exp.trial_id && <span style={{ color: 'var(--theme-stone-400)' }}> · </span>}
                <span className="font-medium" style={{ color: 'var(--theme-stone-700)' }}>
                  {exp.category}:
                </span>
                <span style={{ color: 'var(--theme-stone-500)' }}> {exp.description ?? '—'}</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ApprovalsCompactSummary({
  company,
  timeEntries = [],
  expenses = [],
  consultants = [],
  trials = [],
  subcontractAssignments = [],
  includeInProgress = false,
  onIncludeInProgressChange,
}: ApprovalsCompactSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const period = useMemo(() => getCurrentBillingPeriod(company), [company]);
  const inProgressPeriod = useMemo(() => getCurrentInProgressBillingPeriod(company), [company]);
  const invoicePeriod = company?.invoice_period ?? 'monthly';
  const periodWord = invoicePeriod === 'weekly' ? 'week' : 'month';
  const currentPeriodLabel = invoicePeriod === 'weekly' ? 'Current week' : 'Current month';

  const { stragglerCount, inProgressCount, stragglerTimeEntries, stragglerExpenses } = useMemo(() => {
    const pendingTime = timeEntries.filter((te) => te.status === 'pending' || te.status === 'rejected');
    const pendingExp = expenses.filter((exp) => exp.status === 'pending' || exp.status === 'rejected');

    const stragTime = pendingTime.filter((te) => {
      const d = te.start_time?.substring(0, 10);
      return d !== undefined && d < period.period_start;
    });
    const stragExp = pendingExp.filter((exp) => exp.date !== undefined && exp.date !== null && exp.date < period.period_start);

    const inProgressCt =
      pendingTime.filter((te) => {
        const d = te.start_time?.substring(0, 10);
        return d === undefined || d > period.period_end;
      }).length +
      pendingExp.filter((exp) => exp.date === undefined || exp.date === null || exp.date > period.period_end).length;

    return {
      stragglerCount: stragTime.length + stragExp.length,
      inProgressCount: inProgressCt,
      stragglerTimeEntries: stragTime,
      stragglerExpenses: stragExp,
    };
  }, [timeEntries, expenses, period]);

  const hasStragglers = stragglerCount > 0;

  return (
    <div
      className="flex flex-col px-3 py-2 rounded-lg mb-4"
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        border: '1px solid var(--theme-stone-200)',
        boxShadow: 'var(--theme-card-shadow)',
        borderRadius: 'var(--theme-card-radius)',
      }}
    >
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-1.5 lg:gap-x-4 lg:gap-y-1.5">
        {/* Billing period label */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-stone-400)' }} />
          <span className="text-xs lg:text-sm whitespace-nowrap" style={{ color: 'var(--theme-stone-700)' }}>
            Billing {periodWord}: <strong>{period.period_label}</strong>
          </span>
        </div>

        {/* Stragglers badge */}
        {hasStragglers && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-700">
              {stragglerCount} {stragglerCount === 1 ? 'straggler' : 'stragglers'}
            </span>
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-red-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-red-400" />
            )}
          </button>
        )}

        {/* In-progress toggle */}
        {inProgressCount > 0 && (
          <label className="flex items-center gap-1.5 lg:ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={includeInProgress}
              onChange={(e) => onIncludeInProgressChange?.(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs" style={{ color: 'var(--theme-stone-600)' }}>
              <span className="hidden lg:inline">
                Include {inProgressCount} {currentPeriodLabel.toLowerCase()}{' '}
                {inProgressCount === 1 ? 'entry' : 'entries'} ({inProgressPeriod.period_label})
              </span>
              <span className="lg:hidden">
                +{inProgressCount} {currentPeriodLabel.toLowerCase()} ({inProgressPeriod.period_label})
              </span>
            </span>
          </label>
        )}
      </div>

      {/* Expanded straggler details */}
      {expanded && hasStragglers && (
        <StragglerDetail
          stragglerTimeEntries={stragglerTimeEntries}
          stragglerExpenses={stragglerExpenses}
          consultants={consultants}
          trials={trials}
          subcontractAssignments={subcontractAssignments}
          company={company}
        />
      )}
    </div>
  );
}
