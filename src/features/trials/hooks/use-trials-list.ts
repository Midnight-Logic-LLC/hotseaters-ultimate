/**
 * useTrialsList — subscribe to the company-scoped trial list.
 *
 * Wraps `useEntityList` so components remain free of any store/PGlite/network
 * imports. The fetch callback delegates to the trials store (the only module
 * permitted to touch PGlite — RULE 3).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { fetchTrials } from '@/features/trials/stores/trials-store';
import type { Trial } from '@/features/trials/entities';

export interface UseTrialsListOptions {
  companyId: string | null | undefined;
}

export function useTrialsList(opts: UseTrialsListOptions) {
  const { companyId } = opts;
  return useEntityList<Trial, Trial>({
    type: 'Trial',
    queryKey: ['trials', { companyId }],
    enabled: !!companyId,
    fetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchTrials(companyId);
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });
}
