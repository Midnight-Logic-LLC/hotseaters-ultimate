/**
 * useTrialSegments — subscribe to the trial_segment rows for a trial.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrialSegments } from '@/features/trials/stores/trials-store';
import type { TrialSegment } from '@/features/trials/entities';

export function useTrialSegments(trialId: string | null | undefined) {
  return useEntityList<TrialSegment, TrialSegment>({
    type: 'TrialSegment',
    queryKey: ['trialSegments', { trialId }],
    enabled: !!trialId,
    fetch: async () => {
      if (!trialId) return { items: [], total: 0 };
      const items = await fetchTrialSegments(trialId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}
