/**
 * step-time-tracking.tsx — time-clock rounding rules.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepTimeTracking.jsx
 */
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { TimeSettings } from '@/features/onboarding/stores/onboarding-store';

export function StepTimeTracking() {
  const wiz = useOnboardingWizard();
  const t = wiz.timeForm;

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Time tracking</h3>
      <p className="text-sm text-stone-500 mb-6">How your team's logged hours are rounded.</p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="rounding">Round time to nearest</Label>
          <select
            id="rounding"
            value={t.time_rounding_minutes}
            onChange={(e) => wiz.patchTime({ time_rounding_minutes: parseInt(e.target.value, 10) })}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 bg-white"
          >
            <option value={1}>1 minute</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes (default)</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clockIn">Clock-in rounding</Label>
            <select
              id="clockIn"
              value={t.clock_in_rounding}
              onChange={(e) => wiz.patchTime({ clock_in_rounding: e.target.value as TimeSettings['clock_in_rounding'] })}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 bg-white"
            >
              <option value="nearest">Nearest</option>
              <option value="up">Up (favours employee)</option>
              <option value="down">Down (favours firm)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="clockOut">Clock-out rounding</Label>
            <select
              id="clockOut"
              value={t.clock_out_rounding}
              onChange={(e) => wiz.patchTime({ clock_out_rounding: e.target.value as TimeSettings['clock_out_rounding'] })}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 bg-white"
            >
              <option value="nearest">Nearest</option>
              <option value="up">Up (favours employee)</option>
              <option value="down">Down (favours firm)</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={t.hide_deals_from_time_clock}
            onChange={(e) => wiz.patchTime({ hide_deals_from_time_clock: e.target.checked })}
          />
          <span className="text-sm text-stone-700">Hide deals from time clock (only show signed trials)</span>
        </label>
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
