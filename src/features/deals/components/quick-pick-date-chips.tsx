/**
 * quick-pick-date-chips.tsx — port of
 * HotSeatersMVP/src/components/sales/QuickPickDateChips.jsx.
 *
 * Three one-click date chips (Tomorrow · Next Week · In 2 Weeks) used inside
 * the inline activity form's "What's next?" section. Each writes a yyyy-MM-dd
 * string onto the parent date state via `onPick`. HotSeatersMVP is the bible.
 */

import { format, addDays, addWeeks } from 'date-fns';

interface QuickPickDateChipsProps {
  value: string;
  onPick: (value: string) => void;
}

export function QuickPickDateChips({ value, onPick }: QuickPickDateChipsProps) {
  const today = new Date();
  const presets = [
    { label: 'Tomorrow', value: format(addDays(today, 1), 'yyyy-MM-dd') },
    { label: 'Next Week', value: format(addWeeks(today, 1), 'yyyy-MM-dd') },
    { label: 'In 2 Weeks', value: format(addWeeks(today, 2), 'yyyy-MM-dd') },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {presets.map((p) => {
        const isActive = value === p.value;
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onPick(p.value)}
            className="px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors"
            style={{
              backgroundColor: isActive
                ? 'color-mix(in srgb, var(--theme-brand-primary) 12%, white)'
                : 'white',
              borderColor: isActive
                ? 'color-mix(in srgb, var(--theme-brand-primary) 40%, white)'
                : 'var(--theme-stone-200)',
              color: isActive ? 'var(--theme-brand-primary)' : 'var(--theme-stone-600)',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
