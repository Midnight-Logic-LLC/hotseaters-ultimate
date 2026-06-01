/**
 * use-company-settings.ts — composite hook for the company settings page.
 *
 * Exposes the live company row, the bible-shaped `generalSettings` form
 * payload (Settings.jsx lines 32–58), and three actions:
 *   - `save(patch)` / `saveSettings(patch)` — bulk patch via the settings
 *     form's "Save Company Settings" button.
 *   - `updateCompanyImmediate(field, value)` — single-field patch for
 *     toggles that save instantly (admin debug switch, marketplace flags).
 *   - `uploadLogo(file)` — upload to the `company-logos` storage bucket
 *     and persist the public URL on the company row.
 *
 * Stores own the Supabase seam (RULE D); this hook only talks to the
 * company store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import { useCompanyRow } from '@/shared/hooks/use-tier-a-query';
import {
  updateCompany,
  updateCompanyImmediate as storeUpdateCompanyImmediate,
  uploadCompanyLogo,
  type UpdateCompanyInput,
} from '@/features/company/stores/company-store';

export interface CompanySettingsRecord extends Record<string, unknown> {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  marketplace_post_jobs: boolean;
  marketplace_fill_jobs: boolean;
  has_hsh_addon: boolean;
  approval_required: boolean;
  theme: Record<string, unknown> | null;
  logo?: string | null;
  show_debug_info?: boolean;
}

/**
 * Bible generalSettings shape — every field is a string for compatibility
 * with the bible's controlled inputs (currency / count inputs keep raw
 * digits as strings and parse on save).
 */
export interface GeneralSettings {
  company_name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  default_tax_rate: string;
  invoice_number_format: string;
  invoice_number_start: string;
  job_number_format: string;
  job_number_start: string;
  default_daily_minimum_hours: string;
  time_rounding_minutes: string;
  clock_in_rounding: string;
  clock_out_rounding: string;
  invoice_due_days: string;
  annual_revenue_target: string;
  monthly_breakeven: string;
  retainer_divisor: string;
  retainer_multiplier: string;
  retainer_minimum: string;
  default_invoice_email_message: string;
  sender_email: string;
}

const EMPTY_GENERAL_SETTINGS: GeneralSettings = {
  company_name: '',
  website: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  default_tax_rate: '',
  invoice_number_format: 'INV-0000',
  invoice_number_start: '1',
  job_number_format: 'JOB-0000',
  job_number_start: '1',
  default_daily_minimum_hours: '8',
  time_rounding_minutes: '15',
  clock_in_rounding: 'nearest',
  clock_out_rounding: 'nearest',
  invoice_due_days: '30',
  annual_revenue_target: '0',
  monthly_breakeven: '0',
  retainer_divisor: '15000',
  retainer_multiplier: '5000',
  retainer_minimum: '1000',
  default_invoice_email_message: '',
  sender_email: '',
};

function str(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function projectGeneralSettings(
  company: CompanySettingsRecord | null,
): GeneralSettings {
  if (!company) return { ...EMPTY_GENERAL_SETTINGS };
  return {
    company_name: str(company.name),
    website: str(company.website),
    email: str(company.email),
    phone: str(company.phone),
    address: str(company.address),
    city: str(company.city),
    state: str(company.state),
    zip: str(company.zip),
    default_tax_rate: str(company.default_tax_rate),
    invoice_number_format: str(company.invoice_number_format, 'INV-0000'),
    invoice_number_start: str(company.invoice_number_start, '1'),
    job_number_format: str(company.job_number_format, 'JOB-0000'),
    job_number_start: str(company.job_number_start, '1'),
    default_daily_minimum_hours: str(company.default_daily_minimum_hours, '8'),
    time_rounding_minutes: str(company.time_rounding_minutes, '15'),
    clock_in_rounding: str(company.clock_in_rounding, 'nearest'),
    clock_out_rounding: str(company.clock_out_rounding, 'nearest'),
    invoice_due_days: str(company.invoice_due_days, '30'),
    annual_revenue_target: str(company.annual_revenue_target, '0'),
    monthly_breakeven: str(company.monthly_breakeven, '0'),
    retainer_divisor: str(company.retainer_divisor, '15000'),
    retainer_multiplier: str(company.retainer_multiplier, '5000'),
    retainer_minimum: str(company.retainer_minimum, '1000'),
    default_invoice_email_message: str(company.default_invoice_email_message),
    sender_email: str(company.sender_email),
  };
}

export interface UseCompanySettingsResult {
  company: CompanySettingsRecord | null;
  generalSettings: GeneralSettings;
  isLoading: boolean;
  saving: boolean;
  error: string | null;
  save: (patch: UpdateCompanyInput) => Promise<void>;
  saveSettings: (patch: Partial<GeneralSettings>) => Promise<void>;
  updateCompanyImmediate: (field: string, value: unknown) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
}

export function useCompanySettings(companyId: string | null): UseCompanySettingsResult {
  // S05: read the company row directly from the synced PGlite `company` view
  // (Pattern 4) instead of the entity-graph `useEntity({ fetch })` bridge,
  // which round-tripped to Supabase REST on every mount. `company` is a Tier-A
  // synced table, so this is a local read with zero network.
  const { rows, loading: isLoading } = useCompanyRow<CompanySettingsRecord>(companyId);
  const data = rows[0] ?? null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generalSettings = useMemo(() => projectGeneralSettings(data), [data]);

  const save = async (patch: UpdateCompanyInput) => {
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCompany(companyId, patch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save changes';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Map the bible's generalSettings field names back onto the company-row
   * column names where they differ (`company_name` → `name`). All other
   * keys pass through verbatim.
   */
  const saveSettings = async (patch: Partial<GeneralSettings>) => {
    const { company_name, ...rest } = patch;
    const mapped: UpdateCompanyInput = {
      ...(rest as UpdateCompanyInput),
    };
    if (company_name !== undefined) {
      mapped.name = company_name;
    }
    await save(mapped);
  };

  const updateCompanyImmediate = async (field: string, value: unknown) => {
    if (!companyId) return;
    setError(null);
    try {
      await storeUpdateCompanyImmediate(companyId, field, value);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save changes';
      setError(msg);
      throw err;
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    if (!companyId) throw new Error('No company in context');
    const url = await uploadCompanyLogo(companyId, file);
    await storeUpdateCompanyImmediate(companyId, 'logo', url);
    return url;
  };

  return {
    company: data,
    generalSettings,
    isLoading,
    saving,
    error,
    save,
    saveSettings,
    updateCompanyImmediate,
    uploadLogo,
  };
}
