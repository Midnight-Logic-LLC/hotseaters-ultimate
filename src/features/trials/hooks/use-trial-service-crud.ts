/**
 * useTrialServiceCRUD — mutations for trial_service rows.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityMutation } from '@prometheus-ags/prometheus-entity-management';
import {
  createTrialService,
  updateTrialService,
  deleteTrialService,
} from '@/features/trials/stores/trials-store';
import type { TrialService } from '@/features/trials/entities';

export function useTrialServiceCRUD() {
  const create = useEntityMutation<Partial<TrialService>, TrialService, TrialService>({
    type: 'TrialService',
    mutate: createTrialService,
    normalize: (raw) => ({ id: raw.id, data: raw }),
    invalidateLists: ['trialServices'],
  });

  const update = useEntityMutation<
    { id: string; patch: Partial<TrialService> },
    TrialService,
    TrialService
  >({
    type: 'TrialService',
    mutate: (input) => updateTrialService(input.id, input.patch),
    normalize: (raw) => ({ id: raw.id, data: raw }),
    optimistic: (input) => ({ id: input.id, patch: input.patch }),
    invalidateLists: ['trialServices'],
  });

  const remove = useEntityMutation<{ id: string }, void, TrialService>({
    type: 'TrialService',
    mutate: async ({ id }) => {
      await deleteTrialService(id);
    },
    invalidateLists: ['trialServices'],
  });

  return { create, update, remove };
}
