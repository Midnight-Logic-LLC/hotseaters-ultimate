/**
 * use-company-settings.ts — composite hook for the company settings page.
 *
 * Exposes the live company row plus a submit() that calls the company-store
 * `updateCompany` action.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import {
  fetchCompanyById,
  updateCompany,
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
  theme: Record<string, unknown> | null;
}

export interface UseCompanySettingsResult {
  company: CompanySettingsRecord | null;
  isLoading: boolean;
  saving: boolean;
  error: string | null;
  save: (patch: UpdateCompanyInput) => Promise<void>;
}

export function useCompanySettings(companyId: string | null): UseCompanySettingsResult {
  const { data, isLoading } = useEntity<CompanySettingsRecord, CompanySettingsRecord>({
    type: 'Company',
    id: companyId ?? '',
    enabled: !!companyId,
    fetch: (id) => fetchCompanyById(String(id)) as Promise<CompanySettingsRecord>,
    normalize: (raw) => raw,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { company: data, isLoading, saving, error, save };
}
