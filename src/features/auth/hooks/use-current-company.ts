/**
 * use-current-company.ts — live `company` row for the signed-in tenant.
 *
 * Pattern 4 migration: reads directly from the PGlite `company` unified
 * view via `useCompanyRow` instead of firing a REST fetch. On browser refresh,
 * the IDB row is returned immediately with zero network round-trips.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useAuthSession } from '@/features/auth/stores/auth-store';
import { useCompanyRow } from '@/shared/hooks/use-tier-a-query';

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
  approval_required: boolean;
  theme: Record<string, unknown> | null;
  invoice_period?: 'weekly' | 'monthly' | 'per_trial' | null;
  weekly_billing_day?: string | null;
  monthly_billing_date?: number | null;
  per_trial_billing_days_after_end?: number | null;
  fiscal_year_start_month?: number | null;
  annual_revenue_target?: number | null;
  created_date?: string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
}

export interface UseCurrentCompanyResult {
  company: CompanyRecord | null;
  isLoading: boolean;
}

export function useCurrentCompany(): UseCurrentCompanyResult {
  const companyId = useAuthSession((s) => s.companyId);
  const authLoading = useAuthSession((s) => s.isLoading);

  // Pattern 4: read directly from PGlite company unified view.
  // On refresh this returns the IDB row immediately — no REST fetch.
  const { rows, loading } = useCompanyRow<CompanyRecord>(companyId);
  const company = rows[0] ?? null;

  return {
    company: companyId ? company : null,
    isLoading: authLoading || (!!companyId && loading),
  };
}
