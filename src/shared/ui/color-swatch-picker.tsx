/**
 * color-swatch-picker.tsx — reusable color picker primitive.
 *
 * Renders a 24×24 trigger button that opens a Base UI <Popover> containing
 * a 4×3 swatch grid plus a `<input type="color">` for custom hex selection.
 *
 * Reused by:
 *  - change-203 step-pipeline-tiers (pipeline stage color)
 *  - change-206 step-tiers (client / consultant tier color)  // Wave B.2b
 *  - change-208 new-member-pipeline (Kanban column tint)     // Wave B.2b
 *
 * Generic by design — no onboarding-specific imports.
 */
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/lib/cn';

/**
 * Default brand swatches — 12 colors aligned with the wizard step
 * `iconColor`s (StepProfile #7C3AED, StepCompanyInfo #0891B2, StepBilling
 * #F59E0B, StepTiers #D97706, StepTeamInvite #EC4899, …) plus extras.
 */
export const DEFAULT_BRAND_SWATCHES = [
  '#7c3aed', // profile violet
  '#0891b2', // company cyan
  '#f59e0b', // billing amber
  '#d97706', // tiers ember
  '#ec4899', // team pink
  '#6366f1', // indigo
  '#10b981', // emerald
  '#059669', // emerald-dark
  '#ef4444', // loss red
  '#94a3b8', // neutral slate
  '#2563eb', // deal blue
  '#9333ea', // royal purple
];

interface ColorSwatchPickerProps {
  value: string;
  onChange: (hex: string) => void;
  swatches?: readonly string[];
  /** Optional aria-label for the trigger button. */
  'aria-label'?: string;
  className?: string;
}

export function ColorSwatchPicker({
  value,
  onChange,
  swatches = DEFAULT_BRAND_SWATCHES,
  className,
  'aria-label': ariaLabel = 'Pick color',
}: ColorSwatchPickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          'h-6 w-6 rounded-md border border-stone-300 ring-offset-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          className,
        )}
        style={{ backgroundColor: value }}
      />
      <PopoverContent align="start" className="w-[200px] p-3">
        <p className="mb-2 text-xs font-medium text-stone-600">Brand colors</p>
        <div className="grid grid-cols-4 gap-1.5">
          {swatches.map((hex) => {
            const isActive = hex.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                aria-label={`Swatch ${hex}`}
                aria-pressed={isActive}
                onClick={() => onChange(hex)}
                className={cn(
                  'h-7 w-7 rounded-md border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  isActive
                    ? 'border-stone-800 scale-110 ring-1 ring-stone-800'
                    : 'border-stone-200 hover:scale-105',
                )}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
          <label className="text-xs text-stone-600" htmlFor="custom-hex">
            Custom
          </label>
          <input
            id="custom-hex"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-10 cursor-pointer rounded border border-stone-200"
          />
          <span className="font-mono text-[10px] uppercase text-stone-500">{value}</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
