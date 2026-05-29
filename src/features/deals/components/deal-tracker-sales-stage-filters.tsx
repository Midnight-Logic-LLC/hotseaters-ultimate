/**
 * deal-tracker-sales-stage-filters.tsx — port of
 * HotSeatersMVP/src/components/sales/DealTrackerSalesStageFilters.jsx.
 *
 * Date-range preset + Active/Lost status toggle. Only rendered when the Deal
 * Tracker is in the "sales_stage" view mode.
 *
 * Adaptation (RULE 0): the bible uses a bespoke `DateRangePresetPicker`
 * Popover that has not been ported. The load-bearing behaviour is the preset
 * VALUE that the page's date-range filter consumes (lines ~276–301 of the
 * bible page). We reproduce that with a native `<select>` of the same preset
 * values so the Lost-view date filter still works; the Active/Lost toggle is
 * reproduced verbatim.
 *
 * HotSeatersMVP is the bible.
 */

import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type DealDateFilter =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_week'
  | 'last_month'
  | 'this_year'
  | 'last_year';

export type DealStatusFilter = 'active' | 'lost';

const DATE_FILTER_OPTIONS: { value: DealDateFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
];

interface DealTrackerSalesStageFiltersProps {
  dateFilter: DealDateFilter;
  onDateFilterChange: (v: DealDateFilter) => void;
  statusFilter: DealStatusFilter;
  onStatusFilterChange: (v: DealStatusFilter) => void;
  inline?: boolean;
}

export function DealTrackerSalesStageFilters({
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  inline = false,
}: DealTrackerSalesStageFiltersProps) {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: 'var(--theme-element-gap)', marginBottom: inline ? 0 : 'var(--theme-section-gap)' }}
    >
      {/* Date filter — Lost view only. Active view always shows all active deals. */}
      {statusFilter === 'lost' && (
        <NativeSelect
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value as DealDateFilter)}
          className="h-8 text-xs"
          style={{ minWidth: '160px' }}
          aria-label="Date range"
        >
          {DATE_FILTER_OPTIONS.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      {/* Status toggle */}
      <div className="flex items-center" style={{ gap: 'var(--theme-element-gap)' }}>
        <span className="text-xs" style={{ color: 'var(--theme-stone-500)' }}>
          Status:
        </span>
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--theme-stone-200)' }}
        >
          <button
            type="button"
            onClick={() => onStatusFilterChange('active')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              statusFilter === 'active'
                ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                : { color: 'var(--theme-stone-600)' }
            }
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('lost')}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              statusFilter === 'lost'
                ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                : { color: 'var(--theme-stone-600)' }
            }
          >
            Lost
          </button>
        </div>
      </div>
    </div>
  );
}
