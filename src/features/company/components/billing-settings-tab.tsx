/**
 * billing-settings-tab.tsx — full-parity port of
 * `HotSeatersMVP/src/components/settings/BillingSettingsTab.jsx`.
 *
 * Three cards:
 *   1. Billing Settings — invoice period (immediate-save), number formats,
 *      tax rate, due days, and the conditional weekly/monthly/per-trial
 *      sub-fields that follow `company.invoice_period`.
 *   2. Email Settings — sender email + default invoice email body.
 *   3. Retainer Formula — three persisted inputs plus a live calculator
 *      driven by `calculateRetainer` business rule.
 *
 * `invoice_period`, `weekly_billing_day`, `monthly_billing_date`,
 * `per_trial_billing_days_after_end`, and the two yearly-reset switches
 * persist IMMEDIATELY via `updateCompanyImmediate(...)`. All other
 * fields batch-save through the "Save Billing Settings" button.
 *
 * Components → hooks only (RULE B). All I/O lives in
 * `useCompanySettings()` and the company store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState, type ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { useTier1 } from '@/app/tier1-provider';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import type { GeneralSettings } from '@/features/company/hooks/use-company-settings';
import { calculateRetainer } from '@/features/company/business-rules/retainer-formula';

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const CAPTION_STYLE = {
  fontSize: 'var(--theme-text-caption)',
  color: 'var(--theme-stone-500)',
  marginTop: 'var(--theme-element-gap)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

const SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

const WEEKDAYS: ReadonlyArray<string> = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function parseNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BillingSettingsTab() {
  const { company: tier1Company } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const {
    company,
    generalSettings: serverGeneral,
    saving,
    saveSettings,
    updateCompanyImmediate,
  } = useCompanySettings(companyId);

  const [draft, setDraft] = useState<GeneralSettings>(serverGeneral);
  const [hydratedFromCompanyId, setHydratedFromCompanyId] = useState<
    string | null
  >(null);
  const [testBudget, setTestBudget] = useState<string>('');

  // Re-seed the draft once the live company row arrives (or changes id).
  if (company && hydratedFromCompanyId !== company.id) {
    setDraft(serverGeneral);
    setHydratedFromCompanyId(company.id);
  }

  const update = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await saveSettings(draft);
  };

  const invoicePeriod =
    (company?.invoice_period as string | undefined) ?? 'monthly';
  const weeklyBillingDay =
    (company?.weekly_billing_day as string | undefined) ?? 'Friday';
  const monthlyBillingDate =
    (company?.monthly_billing_date as number | undefined) ?? 1;
  const perTrialDaysAfter =
    (company?.per_trial_billing_days_after_end as number | undefined) ?? 7;
  const invoiceResetYearly = Boolean(company?.invoice_number_reset_yearly);
  const jobResetYearly = Boolean(company?.job_number_reset_yearly);

  const calculatedRetainer = useMemo(() => {
    return calculateRetainer({
      budget: parseNumber(testBudget),
      divisor: parseNumber(draft.retainer_divisor),
      multiplier: parseNumber(draft.retainer_multiplier),
      minimum: parseNumber(draft.retainer_minimum),
    });
  }, [
    testBudget,
    draft.retainer_divisor,
    draft.retainer_multiplier,
    draft.retainer_minimum,
  ]);

  const handleInvoicePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void updateCompanyImmediate('invoice_period', event.target.value);
  };

  const handleWeeklyBillingDayChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    void updateCompanyImmediate('weekly_billing_day', event.target.value);
  };

  const handleMonthlyBillingDateChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseInt(event.target.value, 10);
    void updateCompanyImmediate(
      'monthly_billing_date',
      Number.isFinite(parsed) ? parsed : 1,
    );
  };

  const handlePerTrialDaysChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(event.target.value, 10);
    void updateCompanyImmediate(
      'per_trial_billing_days_after_end',
      Number.isFinite(parsed) ? parsed : 0,
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-section-gap)',
      }}
    >
      {/* ── Billing Settings ───────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Billing Settings
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <div
            className="grid md:grid-cols-3"
            style={{ gap: 'var(--theme-card-gap)' }}
          >
            <div>
              <Label htmlFor="default_daily_minimum_hours" style={LABEL_STYLE}>
                Default Daily Minimum Hours
              </Label>
              <Input
                id="default_daily_minimum_hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="8"
                value={draft.default_daily_minimum_hours}
                onChange={(e) =>
                  update('default_daily_minimum_hours', e.target.value)
                }
                style={INPUT_STYLE}
              />
              <p style={CAPTION_STYLE}>
                Minimum hours to bill per day during trials
              </p>
            </div>

            <div>
              <Label htmlFor="default_tax_rate" style={LABEL_STYLE}>
                Default Tax Rate (%)
              </Label>
              <Input
                id="default_tax_rate"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={draft.default_tax_rate}
                onChange={(e) => update('default_tax_rate', e.target.value)}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="invoice_due_days" style={LABEL_STYLE}>
                Invoice Due Date
              </Label>
              <select
                id="invoice_due_days"
                value={draft.invoice_due_days}
                onChange={(e) => update('invoice_due_days', e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="7">Net 7 (1 week)</option>
                <option value="14">Net 14 (2 weeks)</option>
                <option value="30">Net 30 (30 days)</option>
                <option value="45">Net 45 (45 days)</option>
                <option value="60">Net 60 (60 days)</option>
                <option value="90">Net 90 (90 days)</option>
              </select>
              <p style={CAPTION_STYLE}>
                Default number of days until invoices are due
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 'var(--theme-card-gap)',
              paddingTop: 'var(--theme-card-gap)',
              borderTop:
                'var(--theme-card-border) solid var(--theme-stone-200)',
            }}
          >
            <h3
              className="font-semibold"
              style={{
                color: 'var(--theme-stone-900)',
                marginBottom: 'var(--theme-card-gap)',
              }}
            >
              Number Formatting
            </h3>
            <div
              className="grid md:grid-cols-3"
              style={{ gap: 'var(--theme-card-gap)' }}
            >
              <div>
                <Label htmlFor="invoice_number_format" style={LABEL_STYLE}>
                  Invoice Number Format
                </Label>
                <Input
                  id="invoice_number_format"
                  placeholder="INV-0000"
                  value={draft.invoice_number_format}
                  onChange={(e) =>
                    update('invoice_number_format', e.target.value)
                  }
                  style={INPUT_STYLE}
                />
                <p style={CAPTION_STYLE}>
                  Use YY/YYYY for year, MM for month, 0000 for auto-increment
                </p>
              </div>
              <div>
                <Label htmlFor="invoice_number_start" style={LABEL_STYLE}>
                  Invoice Starting Number
                </Label>
                <Input
                  id="invoice_number_start"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={draft.invoice_number_start}
                  onChange={(e) =>
                    update('invoice_number_start', e.target.value)
                  }
                  style={INPUT_STYLE}
                />
                <p style={CAPTION_STYLE}>
                  First number for auto-increment counter
                </p>
              </div>
              <div>
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="invoice_reset_yearly"
                    checked={invoiceResetYearly}
                    onCheckedChange={(checked) =>
                      void updateCompanyImmediate(
                        'invoice_number_reset_yearly',
                        checked,
                      )
                    }
                  />
                  <Label
                    htmlFor="invoice_reset_yearly"
                    className="cursor-pointer"
                    style={{ fontSize: 'var(--theme-text-body)' }}
                  >
                    Reset at fiscal year
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="job_number_format" style={LABEL_STYLE}>
                  Job Number Format
                </Label>
                <Input
                  id="job_number_format"
                  placeholder="JOB-0000"
                  value={draft.job_number_format}
                  onChange={(e) => update('job_number_format', e.target.value)}
                  style={INPUT_STYLE}
                />
                <p style={CAPTION_STYLE}>
                  Use YY/YYYY for year, MM for month, 0000 for auto-increment
                </p>
              </div>
              <div>
                <Label htmlFor="job_number_start" style={LABEL_STYLE}>
                  Job Starting Number
                </Label>
                <Input
                  id="job_number_start"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={draft.job_number_start}
                  onChange={(e) => update('job_number_start', e.target.value)}
                  style={INPUT_STYLE}
                />
                <p style={CAPTION_STYLE}>
                  First number for auto-increment counter
                </p>
              </div>
              <div>
                <Label>&nbsp;</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    id="job_reset_yearly"
                    checked={jobResetYearly}
                    onCheckedChange={(checked) =>
                      void updateCompanyImmediate(
                        'job_number_reset_yearly',
                        checked,
                      )
                    }
                  />
                  <Label
                    htmlFor="job_reset_yearly"
                    className="cursor-pointer"
                    style={{ fontSize: 'var(--theme-text-body)' }}
                  >
                    Reset at fiscal year
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'var(--theme-card-gap)',
              paddingTop: 'var(--theme-card-gap)',
              borderTop:
                'var(--theme-card-border) solid var(--theme-stone-200)',
            }}
          >
            <h3
              className="font-semibold"
              style={{
                color: 'var(--theme-stone-900)',
                marginBottom: 'var(--theme-card-gap)',
              }}
            >
              Invoice Period
            </h3>
            <div
              className="grid md:grid-cols-2"
              style={{ gap: 'var(--theme-card-gap)' }}
            >
              <div>
                <Label htmlFor="invoice_period" style={LABEL_STYLE}>
                  Billing Frequency
                </Label>
                <select
                  id="invoice_period"
                  value={invoicePeriod}
                  onChange={handleInvoicePeriodChange}
                  className={SELECT_CLASS}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="per_trial">Per Trial</option>
                </select>
                <p style={CAPTION_STYLE}>
                  How often you generate invoices for clients
                </p>
              </div>

              {invoicePeriod === 'weekly' && (
                <div>
                  <Label htmlFor="weekly_billing_day" style={LABEL_STYLE}>
                    Weekly Billing Day
                  </Label>
                  <select
                    id="weekly_billing_day"
                    value={weeklyBillingDay}
                    onChange={handleWeeklyBillingDayChange}
                    className={SELECT_CLASS}
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <p style={CAPTION_STYLE}>
                    Day of the week to generate invoices
                  </p>
                </div>
              )}

              {invoicePeriod === 'monthly' && (
                <div>
                  <Label htmlFor="monthly_billing_date" style={LABEL_STYLE}>
                    Monthly Billing Date
                  </Label>
                  <Input
                    id="monthly_billing_date"
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyBillingDate}
                    onChange={handleMonthlyBillingDateChange}
                    style={INPUT_STYLE}
                  />
                  <p style={CAPTION_STYLE}>
                    Day of the month to generate invoices (1-31)
                  </p>
                </div>
              )}

              {invoicePeriod === 'per_trial' && (
                <div>
                  <Label htmlFor="per_trial_billing_days" style={LABEL_STYLE}>
                    Days After Trial End
                  </Label>
                  <Input
                    id="per_trial_billing_days"
                    type="number"
                    min="0"
                    value={perTrialDaysAfter}
                    onChange={handlePerTrialDaysChange}
                    style={INPUT_STYLE}
                  />
                  <p style={CAPTION_STYLE}>
                    Days after trial ends to generate invoice
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Email Settings ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
              marginBottom: 'var(--theme-card-gap)',
            }}
          >
            Configure the sender email for document delivery
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--theme-card-gap)',
            }}
          >
            <div>
              <Label htmlFor="sender_email" style={LABEL_STYLE}>
                Sender Email Address
              </Label>
              <Input
                id="sender_email"
                type="email"
                value={draft.sender_email}
                onChange={(e) => update('sender_email', e.target.value)}
                placeholder="noreply@yourcompany.com"
                style={INPUT_STYLE}
              />
              <p style={CAPTION_STYLE}>
                This email will appear as the "From" address when sending
                documents. Make sure your domain is verified with your email
                provider.
              </p>
            </div>
            <div>
              <Label
                htmlFor="default_invoice_email_message"
                style={LABEL_STYLE}
              >
                Default Invoice Email Message
              </Label>
              <Textarea
                id="default_invoice_email_message"
                value={draft.default_invoice_email_message}
                onChange={(e) =>
                  update('default_invoice_email_message', e.target.value)
                }
                placeholder="Thank you for your business."
                rows={4}
                style={INPUT_STYLE}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Retainer Formula ───────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader
          style={{
            backgroundColor: 'var(--theme-card-header-bg)',
            padding: 'var(--theme-card-header-padding)',
          }}
        >
          <CardTitle
            style={{
              fontSize: 'var(--theme-text-card-title)',
              color: 'var(--theme-stone-900)',
            }}
          >
            Retainer Formula
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <p
            style={{
              fontSize: 'var(--theme-text-body)',
              color: 'var(--theme-stone-600)',
              marginBottom: 'var(--theme-card-gap)',
            }}
          >
            HotSeaters can automatically calculate a retainer value for your
            job estimates. These calculated retainer values can also be
            manually overridden on each job.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--theme-element-gap)',
            }}
          >
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: 'var(--theme-element-gap)',
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-700)',
              }}
            >
              <span>Every retainer will have a minimum value of $</span>
              <Input
                id="retainer_minimum"
                type="number"
                step="100"
                min="0"
                placeholder="1000"
                value={draft.retainer_minimum}
                onChange={(e) => update('retainer_minimum', e.target.value)}
                className="w-28 h-9"
                style={INPUT_STYLE}
              />
            </div>
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: 'var(--theme-element-gap)',
                fontSize: 'var(--theme-text-body)',
                color: 'var(--theme-stone-700)',
              }}
            >
              <span>For every $</span>
              <Input
                id="retainer_divisor"
                type="number"
                step="1000"
                min="1000"
                placeholder="15000"
                value={draft.retainer_divisor}
                onChange={(e) => update('retainer_divisor', e.target.value)}
                className="w-28 h-9"
                style={INPUT_STYLE}
              />
              <span>of estimated budget, add $</span>
              <Input
                id="retainer_multiplier"
                type="number"
                step="1000"
                min="1000"
                placeholder="5000"
                value={draft.retainer_multiplier}
                onChange={(e) => update('retainer_multiplier', e.target.value)}
                className="w-28 h-9"
                style={INPUT_STYLE}
              />
              <span>to the retainer.</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 'var(--theme-card-gap)',
              paddingTop: 'var(--theme-card-gap)',
              borderTop:
                'var(--theme-card-border) solid var(--theme-stone-200)',
            }}
          >
            <h3
              className="font-semibold"
              style={{
                color: 'var(--theme-stone-900)',
                marginBottom: 'var(--theme-element-gap)',
              }}
            >
              Test Your Formula
            </h3>
            <div
              className="flex items-center"
              style={{ gap: 'var(--theme-card-gap)' }}
            >
              <div className="flex-1">
                <Label htmlFor="test_budget" style={LABEL_STYLE}>
                  Hypothetical Budget
                </Label>
                <Input
                  id="test_budget"
                  type="number"
                  step="1000"
                  min="0"
                  placeholder="Enter a budget amount"
                  value={testBudget}
                  onChange={(e) => setTestBudget(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="calculated_retainer" style={LABEL_STYLE}>
                  Calculated Retainer
                </Label>
                <Input
                  id="calculated_retainer"
                  type="text"
                  readOnly
                  value={`$${calculatedRetainer.toLocaleString()}`}
                  className="bg-stone-50 font-semibold"
                  style={{
                    borderRadius: 'var(--theme-input-radius)',
                    borderWidth: 'var(--theme-input-border)',
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className="flex justify-end"
        style={{ marginTop: 'var(--theme-section-gap)' }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: 'var(--theme-brand-primary)',
            color: 'white',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving...' : 'Save Billing Settings'}
        </Button>
      </div>
    </div>
  );
}

export default BillingSettingsTab;
