/**
 * wizard-step4-footer.tsx — the step-4 (In-Trial Services) footer panel
 * extracted from deal-wizard.tsx to keep that component under the RULE A
 * 800-line limit. Renders the daily-minimum-hours override, bill-weekends
 * toggle, estimated-total, and retainer controls. Behaviour is identical to
 * the inline block it replaced. HotSeatersMVP is the bible.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DealFormData } from './deal-wizard-types';

interface WizardStep4FooterProps {
  dealData: DealFormData;
  setDealData: React.Dispatch<React.SetStateAction<DealFormData>>;
  defaultDailyMinimumHours: number;
  billForWeekends: boolean;
  setBillForWeekends: (next: boolean) => void;
  trialDays: number;
  estimatedValue: number;
  retainerEnabled: boolean;
  setRetainerEnabled: (next: boolean) => void;
  recalcRetainer: () => void;
}

export function WizardStep4Footer({
  dealData,
  setDealData,
  defaultDailyMinimumHours,
  billForWeekends,
  setBillForWeekends,
  trialDays,
  estimatedValue,
  retainerEnabled,
  setRetainerEnabled,
  recalcRetainer,
}: WizardStep4FooterProps) {
  return (
    <>
      <div className="space-y-3 pt-3 border-t border-stone-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="override_daily_minimum_hours"
              className="text-xs text-stone-600 whitespace-nowrap"
            >
              Daily Min Hours:
            </Label>
            <Input
              id="override_daily_minimum_hours"
              type="number"
              step="0.5"
              min="0"
              value={dealData.override_daily_minimum_hours}
              onChange={(e) =>
                setDealData((prev) => ({
                  ...prev,
                  override_daily_minimum_hours: e.target.value,
                }))
              }
              placeholder={`${defaultDailyMinimumHours}`}
              className="h-7 text-xs w-16"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billForWeekends"
              checked={billForWeekends}
              onChange={(e) => setBillForWeekends(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <Label htmlFor="billForWeekends" className="cursor-pointer text-xs text-stone-700">
              Bill weekends ({trialDays} {billForWeekends ? 'total' : 'weekday'} days)
            </Label>
          </div>
        </div>
      </div>
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
        <div className="flex items-center justify-between font-semibold pt-2 border-t border-indigo-200">
          <span className="text-stone-900">Estimated Total:</span>
          <span className="text-green-600 text-lg">${estimatedValue.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="retainerEnabled"
              checked={retainerEnabled}
              onChange={(e) => {
                setRetainerEnabled(e.target.checked);
                if (!e.target.checked) setDealData((p) => ({ ...p, retainer_value: 0 }));
                else recalcRetainer();
              }}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <Label htmlFor="retainerEnabled" className="text-sm text-stone-600 cursor-pointer">
              Retainer:
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={recalcRetainer}
              className="h-7 w-7 p-0"
              disabled={!retainerEnabled}
            >
              ↻
            </Button>
            <div className="relative w-32">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-stone-500">
                $
              </span>
              <Input
                id="retainer_value"
                type="number"
                step="100"
                min="0"
                value={dealData.retainer_value}
                onChange={(e) =>
                  setDealData((prev) => ({ ...prev, retainer_value: e.target.value }))
                }
                className="h-7 text-xs pl-5 text-right bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={!retainerEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
