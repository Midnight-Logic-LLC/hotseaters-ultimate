/**
 * use-company-trial-services.ts — hook returning the company-wide list of
 * trial_service rows. Used by the Services & Rates settings tab to detect
 * whether a service is "in use" so we can decide deactivate-vs-delete.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrialServicesForCompany } from '@/features/trials/stores/trials-store';
import type { TrialService } from '@/features/trials/entities';

export interface UseCompanyTrialServicesResult {
  trialServices: TrialService[];
  isLoading: boolean;
}

export function useCompanyTrialServices(
  companyId: string | null,
): UseCompanyTrialServicesResult {
  const list = useEntityList<TrialService, TrialService>({
    type: 'TrialService',
    queryKey: ['trialServices', { companyId: companyId ?? 'none' }],
    enabled: !!companyId,
    fetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchTrialServicesForCompany(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
  return {
    trialServices: list.items,
    isLoading: list.isLoading,
  };
}
