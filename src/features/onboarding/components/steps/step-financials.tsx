/**
 * step-financials.tsx — fiscal year + targets.
 *
 * change-205 adds:
 *  - Intl.NumberFormat USD display + parse-back on input
 *  - Live monthly-average preview ($/year ÷ 12)
 *
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepFinancials.jsx
 */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function parseMoney(input: string): number {
  return Number(input.replace(/[$,]/g, '')) || 0;
}

function formatMoney(input: string): string {
  const n = parseMoney(input);
  if (!n) return '';
  return USD.format(n);
}

interface MoneyFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (raw: string) => void;
  hint?: string | undefined;
}

function MoneyField({ id, label, value, onChange, hint }: MoneyFieldProps) {
  const [focused, setFocused] = useState(false);
  // While focused: show raw editable value. On blur: format.
  const display = focused ? value : formatMoney(value) || value;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={display}
        onChange={(e) => {
          const stripped = e.target.value.replace(/[$,\s]/g, '');
          onChange(stripped);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="$0"
        inputMode="numeric"
      />
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function StepFinancials() {
  const wiz = useOnboardingWizard();
  const f = wiz.financialsForm;

  const annualNum = parseMoney(f.annual_revenue_target ?? '');
  const monthlyAvg = annualNum > 0 ? USD.format(Math.round(annualNum / 12)) : null;

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
          <MoneyField
            id="annual_revenue_target"
            label="Annual revenue target"
            value={f.annual_revenue_target ?? ''}
            onChange={(raw) => wiz.patchFinancials({ annual_revenue_target: raw })}
            hint={monthlyAvg ? `Monthly avg: ${monthlyAvg}` : undefined}
          />
          <MoneyField
            id="monthly_breakeven"
            label="Monthly breakeven"
            value={f.monthly_breakeven ?? ''}
            onChange={(raw) => wiz.patchFinancials({ monthly_breakeven: raw })}
            hint="Minimum monthly revenue to cover expenses"
          />
        </div>
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
