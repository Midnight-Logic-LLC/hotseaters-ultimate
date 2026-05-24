/**
 * step-billing.tsx — invoice + retainer defaults.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepBilling.jsx
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { BillingSettings } from '@/features/onboarding/stores/onboarding-store';

export function StepBilling() {
  const wiz = useOnboardingWizard();
  const b = wiz.billingForm;
  const r = wiz.retainerForm;
  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Billing</h3>
      <p className="text-sm text-stone-500 mb-6">Invoice cadence, due days, numbering, and retainer math.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Daily minimum hours</Label>
          <Input
            type="number"
            value={b.default_daily_minimum_hours}
            onChange={(e) => wiz.patchBilling({ default_daily_minimum_hours: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Default tax rate (%)</Label>
          <Input
            value={b.default_tax_rate}
            onChange={(e) => wiz.patchBilling({ default_tax_rate: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <Label>Invoice due days</Label>
          <Input
            type="number"
            value={b.invoice_due_days}
            onChange={(e) => wiz.patchBilling({ invoice_due_days: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div>
          <Label>Invoice period</Label>
          <select
            value={b.invoice_period}
            onChange={(e) => wiz.patchBilling({ invoice_period: e.target.value as BillingSettings['invoice_period'] })}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 bg-white"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <Label>Invoice number format</Label>
          <Input value={b.invoice_number_format} onChange={(e) => wiz.patchBilling({ invoice_number_format: e.target.value })} />
        </div>
        <div>
          <Label>Invoice number start</Label>
          <Input
            type="number"
            value={b.invoice_number_start}
            onChange={(e) => wiz.patchBilling({ invoice_number_start: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
        <div>
          <Label>Job number format</Label>
          <Input value={b.job_number_format} onChange={(e) => wiz.patchBilling({ job_number_format: e.target.value })} />
        </div>
        <div>
          <Label>Job number start</Label>
          <Input
            type="number"
            value={b.job_number_start}
            onChange={(e) => wiz.patchBilling({ job_number_start: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Sender email (for invoices)</Label>
          <Input type="email" value={b.sender_email} onChange={(e) => wiz.patchBilling({ sender_email: e.target.value })} />
        </div>
      </div>
      <h4 className="font-semibold text-stone-900 mt-8 mb-3">Retainer formula</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Minimum</Label>
          <Input type="number" value={r.retainer_minimum} onChange={(e) => wiz.patchRetainer({ retainer_minimum: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Divisor</Label>
          <Input type="number" value={r.retainer_divisor} onChange={(e) => wiz.patchRetainer({ retainer_divisor: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Multiplier</Label>
          <Input type="number" value={r.retainer_multiplier} onChange={(e) => wiz.patchRetainer({ retainer_multiplier: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
