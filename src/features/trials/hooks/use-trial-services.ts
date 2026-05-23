/**
 * useTrialServices — subscribe to the trial_service rows for a trial.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrialServices } from '@/features/trials/stores/trials-store';
import type { TrialService } from '@/features/trials/entities';

export function useTrialServices(trialId: string | null | undefined) {
  return useEntityList<TrialService, TrialService>({
    type: 'TrialService',
    queryKey: ['trialServices', { trialId }],
    enabled: !!trialId,
    fetch: async () => {
      if (!trialId) return { items: [], total: 0 };
      const items = await fetchTrialServices(trialId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}
