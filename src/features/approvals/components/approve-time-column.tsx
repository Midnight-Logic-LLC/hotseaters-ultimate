/**
 * approve-time-column.tsx — Kanban column for approving pending time entries.
 *
 * BIBLE: HotSeatersMVP/src/components/invoices/ApproveTimeColumn.jsx
 *
 * Features:
 * - Trial / Person view tabs
 * - Group collapsing with indeterminate checkbox
 * - Per-entry checkbox selection
 * - Approve (selected) bulk action
 * - HSH badge, straggler (red bg), in-progress (gray bg) indicators
 * - Pencil edit button (no-op stub — TimeEntryEditDialog not yet ported)
 *
 * RULE B: no store imports — receives data as props from the page hook.
 */
import { useState, useMemo } from 'react';
import { CheckCircle, Clock, ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/shared/ui/kanban-column';
import { getCurrentBillingPeriod, formatHours } from '@/shared/lib/billing-period';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Company {
  invoice_period?: string | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  time_rounding_minutes?: number | null;
}

interface TimeEntryRow {
  id: string;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_timezone?: string | null;
  end_timezone?: string | null;
  consultant_id?: string | null;
  trial_id?: string | null;
  trial_name?: string | null;
  duration_hours?: number | null;
  rate?: number | null;
  amount?: number | null;
  service_name?: string | null;
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
  consultant_id?: string | null;
  consultant_first_name?: string | null;
  consultant_last_name?: string | null;
  subcontractor_company_id?: string | null;
}

interface HshCompany {
  id: string;
  name?: string | null;
}

interface ApproveTimeColumnProps {
  timeEntries: TimeEntryRow[];
  selectedTimeEntries: string[];
  setSelectedTimeEntries: (fn: (prev: string[]) => string[]) => void;
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatInTimezone(
  isoString: string | null | undefined,
  _timezone: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleString('en-US', options);
  } catch {
    return '';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ApproveTimeColumn({
  timeEntries,
  selectedTimeEntries,
  setSelectedTimeEntries,
  consultants = [],
  company,
  subcontractAssignments = [],
  hshCompanies = [],
  trials = [],
  isLoading = false,
  includeInProgress = false,
  onApprove,
  isApproving = false,
}: ApproveTimeColumnProps) {
  const [view, setView] = useState<'trial' | 'person'>('trial');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const billingPeriod = useMemo(() => getCurrentBillingPeriod(company), [company]);

  // Build subcontractor consultants from assignment data
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
    const map: Record<string, string> = {};
    trials.forEach((t) => { map[t.id] = t.job_number ?? ''; });
    return map;
  }, [trials]);

  const allPending = timeEntries.filter((te) => te.status === 'pending');

  const pendingEntries = useMemo(() => {
    if (!includeInProgress) {
      return allPending.filter((te) => {
        const d = te.start_time?.substring(0, 10);
        return d !== undefined && d <= billingPeriod.period_end;
      });
    }
    return allPending;
  }, [allPending, billingPeriod, includeInProgress]);

  const selectedAmount = pendingEntries
    .filter((te) => selectedTimeEntries.includes(te.id))
    .reduce((sum, te) => sum + (te.amount ?? 0), 0);

  const getEntryParentLabel = (entry: TimeEntryRow): string => {
    const jobNum = jobNumberMap[entry.trial_id ?? ''] ?? '';
    const caseName = entry.trial_name ?? 'Unknown';
    return jobNum ? `(${jobNum}) ${caseName}` : caseName;
  };

  // Group
  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimeEntryRow[]> = {};
    pendingEntries.forEach((entry) => {
      let key: string;
      if (view === 'trial') {
        key = getEntryParentLabel(entry);
      } else {
        const consultant = allConsultants.find((c) => c.id === entry.consultant_id);
        key = consultant
          ? `${consultant.first_name ?? ''} ${consultant.last_name ?? ''}`.trim()
          : 'Unknown';
        if (entry.subcontract_assignment_id) {
          const assignment = subcontractAssignments.find((sa) => sa.id === entry.subcontract_assignment_id);
          if (assignment) {
            const company = hshCompanies.find((c) => c.id === assignment.subcontractor_company_id);
            if (company) key += ` (${company.name})`;
          }
        }
      }
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(entry);
    });
    return groups;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEntries, view, allConsultants, subcontractAssignments, hshCompanies, jobNumberMap]);

  const sortedGroups = useMemo(
    () =>
      Object.entries(groupedEntries)
        .map(([key, entries]): [string, TimeEntryRow[]] => [
          key,
          [...entries].sort((a, b) => new Date(a.start_time ?? '').getTime() - new Date(b.start_time ?? '').getTime()),
        ])
        .sort(([a], [b]) => {
          if (view === 'person') {
            const lastA = a.replace(/\s*\(.*\)$/, '').split(' ').slice(-1)[0] ?? '';
            const lastB = b.replace(/\s*\(.*\)$/, '').split(' ').slice(-1)[0] ?? '';
            return lastA.localeCompare(lastB) || a.localeCompare(b);
          }
          return a.localeCompare(b, undefined, { numeric: true });
        }),
    [groupedEntries, view],
  );

  const toggleGroup = (key: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const toggleEntry = (id: string) =>
    setSelectedTimeEntries((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const getConsultantName = (entry: TimeEntryRow): string => {
    if (entry.subcontract_assignment_id) {
      const sa = subcontractAssignments.find((s) => s.id === entry.subcontract_assignment_id);
      if (sa?.consultant_first_name && sa.consultant_last_name) {
        return `${sa.consultant_first_name} ${sa.consultant_last_name}`;
      }
    }
    const c = allConsultants.find((c) => c.id === entry.consultant_id);
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors capitalize"
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
          onClick={() => selectedTimeEntries.length > 0 && onApprove(selectedTimeEntries)}
          disabled={selectedTimeEntries.length === 0 || isApproving}
          size="sm"
          style={{
            backgroundColor: selectedTimeEntries.length > 0 ? 'var(--theme-brand-primary)' : 'var(--theme-stone-200)',
            color: selectedTimeEntries.length > 0 ? 'white' : 'var(--theme-stone-600)',
            borderRadius: 'var(--theme-button-radius)',
          }}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isApproving ? 'Approving…' : `Approve (${selectedTimeEntries.length})`}
        </Button>
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {sortedGroups.map(([groupKey, entries]) => {
          const groupIds = entries.map((e) => e.id);
          const allSelected = groupIds.every((id) => selectedTimeEntries.includes(id));
          const someSelected = groupIds.some((id) => selectedTimeEntries.includes(id));
          const isCollapsed = collapsedGroups.has(groupKey);

          const handleGroupToggle = () => {
            if (allSelected) {
              setSelectedTimeEntries((prev) => prev.filter((id) => !groupIds.includes(id)));
            } else {
              setSelectedTimeEntries((prev) => [...new Set([...prev, ...groupIds])]);
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
                <span className="text-xs text-stone-500 flex-shrink-0">{entries.length}</span>
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
                  {entries.map((entry) => {
                    const consultantName = getConsultantName(entry);
                    const isHsh = !!entry.subcontract_assignment_id;
                    const entryDate = entry.start_time?.substring(0, 10);
                    const isStraggler = entryDate !== undefined && entryDate < billingPeriod.period_start;
                    const isInProgress = entryDate !== undefined && entryDate > billingPeriod.period_end;
                    const secondaryLabel = view === 'trial' ? consultantName : getEntryParentLabel(entry);

                    return (
                      <div
                        key={entry.id}
                        className="p-2 rounded border hover:opacity-90 mt-1"
                        style={{
                          backgroundColor: isHsh
                            ? 'var(--theme-hsh-background)'
                            : isStraggler
                            ? '#fef2f2'
                            : isInProgress
                            ? '#e7e5e4'
                            : '#FFFFFF',
                          borderColor: isStraggler ? '#fecaca' : isInProgress ? '#a8a29e' : undefined,
                        }}
                      >
                        {/* Row 1 */}
                        <div className="flex items-center gap-3 mb-1">
                          {isInProgress && !includeInProgress ? (
                            <div className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedTimeEntries.includes(entry.id)}
                              onChange={() => toggleEntry(entry.id)}
                              className="w-4 h-4 flex-shrink-0"
                            />
                          )}
                          <p className="text-xs font-medium text-stone-900 whitespace-nowrap flex-1">
                            {formatInTimezone(entry.start_time, entry.start_timezone, { weekday: 'short' })}{' '}
                            {formatInTimezone(entry.start_time, entry.start_timezone, {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {entry.start_time && entry.end_time && (
                              <span className="text-stone-400 font-normal ml-1">
                                {formatInTimezone(entry.start_time, entry.start_timezone, {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                                &ndash;
                                {formatInTimezone(entry.end_time, entry.end_timezone ?? entry.start_timezone, {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-600 whitespace-nowrap">
                            {formatHours(entry.duration_hours, company)}
                          </p>
                          <p className="text-xs font-bold text-stone-900 whitespace-nowrap text-right">
                            ${((entry.duration_hours ?? 0) * (entry.rate ?? 0)).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-stone-100 transition-colors flex-shrink-0"
                            title="Edit time entry"
                          >
                            <Pencil className="w-3 h-3" style={{ color: 'var(--theme-stone-400)' }} />
                          </button>
                        </div>
                        {/* Row 2 */}
                        <div className="ml-7 mb-1">
                          <p className="text-xs font-bold text-stone-700 truncate">{secondaryLabel}</p>
                        </div>
                        {/* Row 3 */}
                        <div className="ml-7">
                          <p className="text-xs">
                            <span className="text-stone-900 font-medium">{entry.service_name}:</span>{' '}
                            <span className="text-stone-500">{entry.description ?? '—'}</span>
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

        {pendingEntries.length === 0 && !isLoading && (
          <p className="text-xs text-center py-8" style={{ color: 'var(--theme-stone-500)' }}>
            No pending time entries
          </p>
        )}
      </div>
    </>
  );

  return (
    <KanbanColumn
      title="Approve Time"
      count={pendingEntries.length}
      total={`$${selectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      colorBorder="var(--theme-warning)"
      icon={<Clock className="w-10 h-10" />}
      isLoading={isLoading}
    >
      {innerContent}
    </KanbanColumn>
  );
}
