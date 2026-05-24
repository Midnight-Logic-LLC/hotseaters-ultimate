/**
 * step-financials.tsx — fiscal year + targets.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepFinancials.jsx
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function StepFinancials() {
  const wiz = useOnboardingWizard();
  const f = wiz.financialsForm;
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Financial targets</h3>
      <p className="text-sm text-stone-500 mb-6">Drives the Dashboard revenue + utilization widgets.</p>
      <div className="space-y-4">
        <div>
          <Label>Fiscal year starts in</Label>
          <select
            value={f.fiscal_year_start_month}
            onChange={(e) => wiz.patchFinancials({ fiscal_year_start_month: parseInt(e.target.value, 10) })}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 bg-white"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Annual revenue target ($)</Label>
            <Input value={f.annual_revenue_target} onChange={(e) => wiz.patchFinancials({ annual_revenue_target: e.target.value })} />
          </div>
          <div>
            <Label>Monthly breakeven ($)</Label>
            <Input value={f.monthly_breakeven} onChange={(e) => wiz.patchFinancials({ monthly_breakeven: e.target.value })} />
          </div>
        </div>
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
