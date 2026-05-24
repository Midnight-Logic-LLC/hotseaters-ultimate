/**
 * step-billing.tsx — invoice + retainer defaults.
 * BIBLE: HotSeatersMVP/src/components/onboarding/StepBilling.jsx
 *
 * Conditional render per billing frequency (change-202):
 *   weekly | biweekly  → DOW select (Mon..Sun)
 *   monthly            → DOM select (1..31; 31 = "Last day of month")
 *   quarterly | annual → no picker, info banner only
 *
 * Adds two toggles the server already accepts:
 *   - prorate_first_invoice              (default true)
 *   - auto_send_invoice_on_generation    (default false)
 */
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useOnboardingWizard } from '@/features/onboarding/hooks/use-onboarding-wizard';
import { WizardNav } from '../wizard-nav';
import type { BillingFrequency, BillingSettings } from '@/features/onboarding/stores/onboarding-store';

const DOW_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const FREQUENCY_HELP: Record<BillingFrequency, string> = {
  weekly:
    'Weekly invoices keep cash flowing in on a tight cadence. Best for high-volume consultant work or short engagements where waiting a month would strain operations.',
  biweekly:
    'Bi-weekly strikes a balance between cashflow predictability and the admin overhead of generating invoices. Most consulting practices land here.',
  monthly:
    'Monthly invoicing batches a full period of work into a single invoice. Lower admin cost, but delays cashflow — make sure your retainer covers your operating runway.',
  quarterly:
    'Quarterly billing front-loads cashflow risk. Retainers are essentially mandatory at this cadence so you are not floating 90 days of labor.',
  annual:
    'Annual invoicing is reserved for prepaid engagements or long-term partnerships. Require a sizeable retainer up front — you are extending a year of credit otherwise.',
};

const SELECT_CLS =
  'w-full h-9 px-3 py-1 text-sm border border-stone-200 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-indigo-500';

export function StepBilling() {
  const wiz = useOnboardingWizard();
  const b = wiz.billingForm;
  const r = wiz.retainerForm;

  const freq: BillingFrequency = b.invoice_period;

  // Retainer live preview — for an example $50,000 deal.
  const exampleBudget = 50_000;
  const previewRetainer = (() => {
    const min = Number(r.retainer_minimum) || 0;
    const div = Number(r.retainer_divisor) || 0;
    const mult = Number(r.retainer_multiplier) || 0;
    if (div <= 0) return min;
    return Math.max(min, Math.floor(exampleBudget / div) * mult);
  })();

  return (
    <div>
      <h3 className="text-xl font-bold text-stone-900 mb-1">Billing</h3>
      <p className="text-sm text-stone-500 mb-6">
        Invoice cadence, due days, numbering, and retainer math.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Daily minimum hours</Label>
          <Input
            type="number"
            min={0}
            step="0.5"
            value={b.default_daily_minimum_hours}
            onChange={(e) =>
              wiz.patchBilling({ default_daily_minimum_hours: parseFloat(e.target.value) || 0 })
            }
          />
        </div>

        <div>
          <Label>Default tax rate</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={b.default_tax_rate}
              onChange={(e) => wiz.patchBilling({ default_tax_rate: e.target.value })}
              placeholder="0.00"
              className="pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-400">
              %
            </span>
          </div>
        </div>

        <div>
          <Label>Payment terms</Label>
          <select
            value={b.invoice_due_days}
            onChange={(e) =>
              wiz.patchBilling({ invoice_due_days: parseInt(e.target.value, 10) || 0 })
            }
            className={SELECT_CLS}
          >
            <option value={7}>Net 7</option>
            <option value={14}>Net 14</option>
            <option value={30}>Net 30</option>
            <option value={45}>Net 45</option>
            <option value={60}>Net 60</option>
            <option value={90}>Net 90</option>
          </select>
        </div>

        <div>
          <Label>Billing frequency</Label>
          <select
            value={freq}
            onChange={(e) =>
              wiz.patchBilling({
                invoice_period: e.target.value as BillingSettings['invoice_period'],
              })
            }
            className={SELECT_CLS}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Info banner explaining cashflow impact of cadence. */}
      <Card className="mt-4 p-3 bg-muted/30 border-stone-200">
        <p className="text-xs text-stone-600 leading-relaxed">{FREQUENCY_HELP[freq]}</p>
      </Card>

      {/* Conditional picker based on frequency. */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(freq === 'weekly' || freq === 'biweekly') && (
          <div>
            <Label>Billing day of week</Label>
            <select
              value={b.weekly_billing_day || 'Monday'}
              onChange={(e) => wiz.patchBilling({ weekly_billing_day: e.target.value })}
              className={SELECT_CLS}
            >
              {DOW_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {freq === 'monthly' && (
          <div>
            <Label>Billing day of month</Label>
            <select
              value={b.monthly_billing_date || 1}
              onChange={(e) =>
                wiz.patchBilling({ monthly_billing_date: parseInt(e.target.value, 10) || 1 })
              }
              className={SELECT_CLS}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day === 31 ? 'Last day of month' : day}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={freq === 'quarterly' || freq === 'annual' ? 'sm:col-span-2' : ''}>
          <Label>Sender email (for invoices)</Label>
          <Input
            type="email"
            value={b.sender_email}
            onChange={(e) => wiz.patchBilling({ sender_email: e.target.value })}
            placeholder="noreply@yourcompany.com"
          />
        </div>
      </div>

      {/* Bible toggles — server already accepts both. */}
      <div className="mt-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <Switch
            checked={b.prorate_first_invoice}
            onCheckedChange={(v: boolean) => wiz.patchBilling({ prorate_first_invoice: v })}
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-stone-700">Prorate first invoice</span>
            <p className="text-xs text-stone-500 mt-0.5">
              Bill only for the partial billing period when an engagement starts mid-cycle.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Switch
            checked={b.auto_send_invoice_on_generation}
            onCheckedChange={(v: boolean) =>
              wiz.patchBilling({ auto_send_invoice_on_generation: v })
            }
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-stone-700">
              Auto-send invoices on generation
            </span>
            <p className="text-xs text-stone-500 mt-0.5">
              Email invoices to clients automatically when they are generated. Off by default — most
              firms prefer a manual review step.
            </p>
          </div>
        </label>
      </div>

      {/* Number formatting */}
      <div className="border-t border-stone-100 pt-4 mt-6">
        <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-3">
          Number formatting
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Invoice number format</Label>
            <Input
              value={b.invoice_number_format}
              onChange={(e) => wiz.patchBilling({ invoice_number_format: e.target.value })}
              placeholder="INV-0000"
            />
            <p className="text-xs text-stone-400 mt-1">0000 = auto-number, YY/YYYY = year</p>
          </div>
          <div>
            <Label>Invoice number start</Label>
            <Input
              type="number"
              min={1}
              value={b.invoice_number_start}
              onChange={(e) =>
                wiz.patchBilling({ invoice_number_start: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
          <div>
            <Label>Job number format</Label>
            <Input
              value={b.job_number_format}
              onChange={(e) => wiz.patchBilling({ job_number_format: e.target.value })}
              placeholder="JOB-0000"
            />
          </div>
          <div>
            <Label>Job number start</Label>
            <Input
              type="number"
              min={1}
              value={b.job_number_start}
              onChange={(e) =>
                wiz.patchBilling({ job_number_start: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
        </div>
      </div>

      {/* Retainer formula */}
      <div className="border-t border-stone-100 pt-4 mt-6">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
          Retainer formula
        </p>
        <p className="text-xs text-stone-500 mb-3">
          When you create a proposal, HotSeaters can auto-suggest a retainer amount based on the
          estimated budget. This formula controls that calculation.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Minimum ($)</Label>
            <Input
              type="number"
              min={0}
              value={r.retainer_minimum}
              onChange={(e) =>
                wiz.patchRetainer({ retainer_minimum: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Per $ of budget</Label>
            <Input
              type="number"
              min={0}
              value={r.retainer_divisor}
              onChange={(e) =>
                wiz.patchRetainer({ retainer_divisor: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Add $</Label>
            <Input
              type="number"
              min={0}
              value={r.retainer_multiplier}
              onChange={(e) =>
                wiz.patchRetainer({ retainer_multiplier: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>
        <Card className="mt-3 p-3 bg-muted/30 border-stone-200">
          <p className="text-xs text-stone-600">
            For a <span className="font-semibold">${exampleBudget.toLocaleString()}</span> deal, the
            suggested retainer would be{' '}
            <span className="font-semibold text-stone-900">
              ${previewRetainer.toLocaleString()}
            </span>
            .
          </p>
        </Card>
      </div>

      <WizardNav onSkip={() => wiz.goNext()} />
    </div>
  );
}
