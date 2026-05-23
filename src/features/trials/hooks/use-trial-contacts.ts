/**
 * useTrialContacts — subscribe to the trial_contact rows for a trial.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrialContacts } from '@/features/trials/stores/trials-store';
import type { TrialContact } from '@/features/trials/entities';

export function useTrialContacts(trialId: string | null | undefined) {
  return useEntityList<TrialContact, TrialContact>({
    type: 'TrialContact',
    queryKey: ['trialContacts', { trialId }],
    enabled: !!trialId,
    fetch: async () => {
      if (!trialId) return { items: [], total: 0 };
      const items = await fetchTrialContacts(trialId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}
