/**
 * use-current-company.ts — live `company` row for the signed-in tenant.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import {
  useAuthSession,
  fetchCompanyById,
} from '@/features/auth/stores/auth-store';

export interface CompanyRecord extends Record<string, unknown> {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  owner_id: string | null;
  subscription_tier: string | null;
  is_active: boolean;
  marketplace_post_jobs: boolean;
  marketplace_fill_jobs: boolean;
  has_hsh_addon: boolean;
  theme: Record<string, unknown> | null;
}

export interface UseCurrentCompanyResult {
  company: CompanyRecord | null;
  isLoading: boolean;
}

export function useCurrentCompany(): UseCurrentCompanyResult {
  const companyId = useAuthSession((s) => s.companyId);
  const authLoading = useAuthSession((s) => s.isLoading);

  const { data, isLoading } = useEntity<CompanyRecord, CompanyRecord>({
    type: 'Company',
    id: companyId ?? '',
    enabled: !!companyId,
    fetch: (id) => fetchCompanyById(String(id)) as Promise<CompanyRecord>,
    normalize: (raw) => raw,
  });

  return {
    company: companyId ? data : null,
    isLoading: authLoading || (!!companyId && isLoading),
  };
}
