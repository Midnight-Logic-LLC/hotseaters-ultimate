/**
 * company-settings-tab.tsx — full-parity port of
 * `HotSeatersMVP/src/components/settings/CompanySettingsTab.jsx`.
 *
 * Two cards:
 *   1. Company Identity — logo + name/website/email/phone/address grid
 *      plus the admin-only "Show Debug Info" toggle.
 *   2. Financial — fiscal-year, annual revenue target, monthly breakeven,
 *      plus the bible's broader financial / invoice / retainer settings.
 *
 * Components → hooks only (RULE B). All I/O lives in
 * `useCompanySettings()` and the company store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useRef, useState, type ChangeEvent } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { useTier1 } from '@/app/tier1-provider';
import { useCompanySettings } from '@/features/company/hooks/use-company-settings';
import { formatPhone } from '@/features/company/business-rules/format-phone';
import type { GeneralSettings } from '@/features/company/hooks/use-company-settings';

const US_STATES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const MONTHS: ReadonlyArray<string> = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const LABEL_STYLE = {
  fontSize: 'var(--theme-text-label)',
  color: 'var(--theme-stone-700)',
} as const;

const INPUT_STYLE = {
  borderRadius: 'var(--theme-input-radius)',
  borderWidth: 'var(--theme-input-border)',
  backgroundColor: 'var(--theme-input-bg)',
} as const;

const SELECT_CLASS =
  'w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

export function CompanySettingsTab() {
  const { userInfo, company: tier1Company, role } = useTier1();
  const companyId = tier1Company?.id ?? null;
  const {
    company,
    generalSettings: serverGeneral,
    saving,
    saveSettings,
    updateCompanyImmediate,
    uploadLogo,
  } = useCompanySettings(companyId);

  const [draft, setDraft] = useState<GeneralSettings>(serverGeneral);
  const [hydratedFromCompanyId, setHydratedFromCompanyId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-seed the draft once the live company row arrives (or changes id).
  if (company && hydratedFromCompanyId !== company.id) {
    setDraft(serverGeneral);
    setHydratedFromCompanyId(company.id);
  }

  const isAdmin =
    role === 'owner' ||
    role === 'admin' ||
    userInfo?.company_role === 'admin' ||
    userInfo?.company_role === 'owner';

  const update = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    update('phone', formatPhone(event.target.value));
  };

  const handleLogoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      await uploadLogo(file);
    } finally {
      setIsUploadingLogo(false);
      // Allow re-selecting the same file later.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    await updateCompanyImmediate('logo', null);
  };

  const handleDebugToggle = async (checked: boolean) => {
    await updateCompanyImmediate('show_debug_info', checked);
  };

  const handleSave = async () => {
    await saveSettings(draft);
  };

  const logoUrl = (company?.logo as string | null | undefined) ?? null;
  const showDebugInfo = Boolean(company?.show_debug_info);
  const fiscalMonth =
    (company?.fiscal_year_start_month as number | null | undefined) ?? 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--theme-section-gap)',
      }}
    >
      {/* ── Company Identity ───────────────────────────────────────────── */}
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
            Company Identity
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--theme-card-gap)',
            }}
          >
            <div
              className="grid grid-cols-3"
              style={{ gap: 'var(--theme-card-gap)' }}
            >
              <div className="col-span-2">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--theme-card-gap)',
                  }}
                >
                  <div>
                    <Label htmlFor="company_name" style={LABEL_STYLE}>
                      Company Name
                    </Label>
                    <Input
                      id="company_name"
                      placeholder="Your Company Name"
                      value={draft.company_name}
                      onChange={(e) => update('company_name', e.target.value)}
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div
                    className="grid md:grid-cols-3"
                    style={{ gap: 'var(--theme-card-gap)' }}
                  >
                    <div>
                      <Label htmlFor="company_website" style={LABEL_STYLE}>
                        Website
                      </Label>
                      <Input
                        id="company_website"
                        placeholder="https://yourcompany.com"
                        value={draft.website}
                        onChange={(e) => update('website', e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_email" style={LABEL_STYLE}>
                        Email
                      </Label>
                      <Input
                        id="company_email"
                        type="email"
                        placeholder="info@yourcompany.com"
                        value={draft.email}
                        onChange={(e) => update('email', e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_phone" style={LABEL_STYLE}>
                        Phone Number
                      </Label>
                      <Input
                        id="company_phone"
                        placeholder="(555) 123-4567"
                        value={draft.phone}
                        onChange={handlePhoneChange}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company_address" style={LABEL_STYLE}>
                      Street Address
                    </Label>
                    <Input
                      id="company_address"
                      placeholder="123 Main Street"
                      value={draft.address}
                      onChange={(e) => update('address', e.target.value)}
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div
                    className="grid md:grid-cols-3"
                    style={{ gap: 'var(--theme-card-gap)' }}
                  >
                    <div>
                      <Label htmlFor="company_city" style={LABEL_STYLE}>
                        City
                      </Label>
                      <Input
                        id="company_city"
                        placeholder="City"
                        value={draft.city}
                        onChange={(e) => update('city', e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_state" style={LABEL_STYLE}>
                        State
                      </Label>
                      <select
                        id="company_state"
                        value={draft.state}
                        onChange={(e) => update('state', e.target.value)}
                        className={SELECT_CLASS}
                      >
                        <option value="">Select State</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="company_zip" style={LABEL_STYLE}>
                        ZIP Code
                      </Label>
                      <Input
                        id="company_zip"
                        placeholder="12345"
                        value={draft.zip}
                        onChange={(e) => update('zip', e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label style={LABEL_STYLE}>Company Logo</Label>
                <div
                  className="mt-2 flex flex-col items-start"
                  style={{ gap: 'var(--theme-element-gap)' }}
                >
                  {logoUrl ? (
                    <div className="relative">
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="w-60 h-60 object-contain border border-stone-200 rounded-lg bg-white p-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 bg-red-100 hover:bg-red-200 rounded-full"
                        onClick={handleRemoveLogo}
                        aria-label="Remove logo"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-60 h-60 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center bg-stone-50">
                      <ImageIcon className="w-8 h-8 text-stone-400" />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLogoButtonClick}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploadingLogo
                        ? 'Uploading...'
                        : logoUrl
                          ? 'Change Logo'
                          : 'Upload Logo'}
                    </Button>
                    <p
                      style={{
                        fontSize: 'var(--theme-text-caption)',
                        color: 'var(--theme-stone-500)',
                        marginTop: 'var(--theme-element-gap)',
                      }}
                    >
                      Recommended: PNG or SVG, max 500KB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div
                style={{
                  paddingTop: 'var(--theme-card-gap)',
                  borderTop:
                    'var(--theme-card-border) solid var(--theme-stone-200)',
                }}
              >
                <div
                  className="flex items-center justify-between border rounded-lg"
                  style={{
                    padding: 'var(--theme-card-padding)',
                    borderColor: 'var(--theme-stone-200)',
                    backgroundColor: 'var(--theme-stone-50)',
                    borderRadius: 'var(--theme-card-radius)',
                  }}
                >
                  <div className="flex-1">
                    <div
                      className="font-medium"
                      style={{ color: 'var(--theme-stone-900)' }}
                    >
                      Show Debug Info
                    </div>
                    <p
                      style={{
                        fontSize: 'var(--theme-text-body)',
                        color: 'var(--theme-stone-600)',
                        marginTop: 'var(--theme-element-gap)',
                      }}
                    >
                      Display debug information cards across the app for
                      troubleshooting
                    </p>
                  </div>
                  <Switch
                    aria-label="Show Debug Info"
                    checked={showDebugInfo}
                    onCheckedChange={handleDebugToggle}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Financial ──────────────────────────────────────────────────── */}
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
            Financial
          </CardTitle>
        </CardHeader>
        <CardContent style={{ padding: 'var(--theme-card-padding)' }}>
          <div
            className="grid md:grid-cols-3"
            style={{ gap: 'var(--theme-card-gap)' }}
          >
            <div>
              <Label htmlFor="fiscal_year_start" style={LABEL_STYLE}>
                Fiscal Year Start Month
              </Label>
              <select
                id="fiscal_year_start"
                value={fiscalMonth}
                onChange={(e) =>
                  updateCompanyImmediate(
                    'fiscal_year_start_month',
                    parseInt(e.target.value, 10),
                  )
                }
                className={SELECT_CLASS}
              >
                {MONTHS.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <p
                style={{
                  fontSize: 'var(--theme-text-caption)',
                  color: 'var(--theme-stone-500)',
                  marginTop: 'var(--theme-element-gap)',
                }}
              >
                First month of your company's fiscal year
              </p>
            </div>

            <div>
              <Label htmlFor="annual_revenue_target" style={LABEL_STYLE}>
                Annual Revenue Target
              </Label>
              <Input
                id="annual_revenue_target"
                type="text"
                placeholder="0"
                value={draft.annual_revenue_target}
                onChange={(e) =>
                  update(
                    'annual_revenue_target',
                    e.target.value.replace(/,/g, ''),
                  )
                }
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="monthly_breakeven" style={LABEL_STYLE}>
                Monthly Breakeven
              </Label>
              <Input
                id="monthly_breakeven"
                type="text"
                placeholder="0"
                value={draft.monthly_breakeven}
                onChange={(e) =>
                  update(
                    'monthly_breakeven',
                    e.target.value.replace(/,/g, ''),
                  )
                }
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="default_tax_rate" style={LABEL_STYLE}>
                Default Tax Rate (%)
              </Label>
              <Input
                id="default_tax_rate"
                type="text"
                placeholder="0"
                value={draft.default_tax_rate}
                onChange={(e) => update('default_tax_rate', e.target.value)}
                style={INPUT_STYLE}
              />
            </div>

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
            </div>

            <div>
              <Label htmlFor="invoice_number_start" style={LABEL_STYLE}>
                Invoice Number Start
              </Label>
              <Input
                id="invoice_number_start"
                placeholder="1"
                value={draft.invoice_number_start}
                onChange={(e) =>
                  update('invoice_number_start', e.target.value)
                }
                style={INPUT_STYLE}
              />
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
            </div>

            <div>
              <Label htmlFor="job_number_start" style={LABEL_STYLE}>
                Job Number Start
              </Label>
              <Input
                id="job_number_start"
                placeholder="1"
                value={draft.job_number_start}
                onChange={(e) => update('job_number_start', e.target.value)}
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="invoice_due_days" style={LABEL_STYLE}>
                Invoice Due Days
              </Label>
              <Input
                id="invoice_due_days"
                placeholder="30"
                value={draft.invoice_due_days}
                onChange={(e) => update('invoice_due_days', e.target.value)}
                style={INPUT_STYLE}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="default_invoice_email_message" style={LABEL_STYLE}>
                Default Invoice Email Message
              </Label>
              <Input
                id="default_invoice_email_message"
                placeholder="Thank you for your business."
                value={draft.default_invoice_email_message}
                onChange={(e) =>
                  update('default_invoice_email_message', e.target.value)
                }
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="sender_email" style={LABEL_STYLE}>
                Sender Email
              </Label>
              <Input
                id="sender_email"
                type="email"
                placeholder="billing@yourcompany.com"
                value={draft.sender_email}
                onChange={(e) => update('sender_email', e.target.value)}
                style={INPUT_STYLE}
              />
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
          {saving ? 'Saving...' : 'Save Company Settings'}
        </Button>
      </div>
    </div>
  );
}

export default CompanySettingsTab;
