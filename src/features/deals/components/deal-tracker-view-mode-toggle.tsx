/**
 * deal-tracker-view-mode-toggle.tsx — port of
 * HotSeatersMVP/src/components/sales/DealTrackerViewModeToggle.jsx.
 *
 * Segmented 3-button control for the Deal Tracker's view mode. Persisted to
 * UserInfo.preferences.dealTrackerViewMode by the parent.
 *
 * HotSeatersMVP is the bible.
 */

import { CalendarClock, CalendarDays, KanbanSquare } from 'lucide-react';
import type { DealViewMode } from '@/features/deals/business-rules/deal-kanban-buckets';

const MODES = [
  { key: 'next_step', label: 'Next Step', icon: CalendarClock },
  { key: 'trial_date', label: 'Trial Date', icon: CalendarDays },
  { key: 'sales_stage', label: 'Sales Stage', icon: KanbanSquare },
] as const;

interface DealTrackerViewModeToggleProps {
  value: DealViewMode;
  onChange: (mode: DealViewMode) => void;
}

export function DealTrackerViewModeToggle({ value, onChange }: DealTrackerViewModeToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg border overflow-hidden flex-shrink-0"
      style={{ borderColor: 'var(--theme-stone-200)' }}
    >
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = value === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              active
                ? { backgroundColor: 'var(--theme-brand-primary)', color: 'white' }
                : { color: 'var(--theme-stone-600)' }
            }
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
