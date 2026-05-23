/**
 * useTrial — subscribe to a single trial by id.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrialById } from '@/features/trials/stores/trials-store';
import type { Trial } from '@/features/trials/entities';

export function useTrial(trialId: string | null | undefined) {
  return useEntity<Trial, Trial>({
    type: 'Trial',
    id: trialId ?? null,
    enabled: !!trialId,
    fetch: async (id) => {
      const row = await fetchTrialById(String(id));
      if (!row) throw new Error(`Trial ${id} not found`);
      return row;
    },
    normalize: (raw) => raw,
  });
}
