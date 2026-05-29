/**
 * year-selector.tsx — fiscal-year stepper.
 *
 * Port of HotSeatersMVP/src/components/shared/YearSelector.jsx. Prev/year/next
 * pill matching the bible's brand-tinted segmented control. Kept in
 * sales/components because the Projections tab is its only consumer; promote to
 * shared/ui if another surface adopts it.
 *
 * HotSeatersMVP is the bible.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
}

const tintBg = 'color-mix(in srgb, var(--theme-brand-primary) 10%, white)';

export function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const year = selectedYear ?? new Date().getFullYear();
  return (
    <div
      className="flex items-center rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--theme-stone-200)' }}
    >
      <button
        type="button"
        onClick={() => onYearChange(year - 1)}
        aria-label="Previous fiscal year"
        className="flex items-center justify-center px-1 py-1.5 text-xs transition-colors"
        style={{ color: 'var(--theme-stone-600)', backgroundColor: tintBg }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span
        className="font-semibold text-center px-1 py-1.5 text-xs"
        style={{ color: 'var(--theme-stone-700)', backgroundColor: tintBg }}
      >
        {year}
      </span>
      <button
        type="button"
        onClick={() => onYearChange(year + 1)}
        aria-label="Next fiscal year"
        className="flex items-center justify-center px-1 py-1.5 text-xs transition-colors"
        style={{ color: 'var(--theme-stone-600)', backgroundColor: tintBg }}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
