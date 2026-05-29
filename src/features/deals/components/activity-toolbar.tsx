/**
 * activity-toolbar.tsx — port of
 * HotSeatersMVP/src/components/sales/ActivityToolbar.jsx.
 *
 * Shared toolbar for the card activity zone: a "History" button (disabled when
 * there is no history) + an "Add Activity" button. HotSeatersMVP is the bible.
 */

import { Activity, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityToolbarProps {
  isOverdue?: boolean;
  isDueToday?: boolean;
  activityCount?: number;
  onAddActivity: () => void;
  onShowHistory: () => void;
  stopPropagation?: boolean;
}

export function ActivityToolbar({
  isOverdue = false,
  isDueToday = false,
  activityCount = 0,
  onAddActivity,
  onShowHistory,
  stopPropagation = false,
}: ActivityToolbarProps) {
  const wrap =
    (fn: () => void) =>
    (e: React.MouseEvent): void => {
      if (stopPropagation) e.stopPropagation();
      fn();
    };

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5"
      style={{
        borderTop: `1px solid ${
          isOverdue
            ? '#fecaca'
            : isDueToday
              ? '#fecaca'
              : 'color-mix(in srgb, var(--theme-brand-primary) 10%, var(--theme-stone-200))'
        }`,
        backgroundColor: isOverdue
          ? 'color-mix(in srgb, #dc2626 3%, white)'
          : isDueToday
            ? 'color-mix(in srgb, #ef4444 4%, white)'
            : 'color-mix(in srgb, var(--theme-brand-primary) 2%, white)',
      }}
    >
      <Button
        type="button"
        size="sm"
        className="h-6 text-xs px-2 hover:opacity-90 transition-opacity"
        onClick={wrap(onShowHistory)}
        disabled={!activityCount}
        style={{
          backgroundColor: activityCount
            ? 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)'
            : 'var(--theme-stone-100)',
          color: activityCount ? 'var(--theme-stone-600)' : 'var(--theme-stone-400)',
          borderRadius: 'var(--theme-button-radius)',
          cursor: activityCount ? 'pointer' : 'not-allowed',
        }}
      >
        <History className="w-3 h-3 mr-1" />
        History
      </Button>
      <div className="ml-auto">
        <Button
          type="button"
          size="sm"
          className="h-6 text-xs px-2 hover:opacity-90 transition-opacity"
          onClick={wrap(onAddActivity)}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
            borderRadius: 'var(--theme-button-radius)',
          }}
        >
          <Activity className="w-3 h-3 mr-1" />
          Add Activity
        </Button>
      </div>
    </div>
  );
}
