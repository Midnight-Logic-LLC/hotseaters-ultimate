/**
 * useTrialCRUD — create / update / delete trials through the graph.
 *
 * Wraps `useEntityMutation` so writes flow through PGlite (via the store) and
 * the entity graph stays authoritative.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityMutation } from '@prometheus-ags/prometheus-entity-management';
import {
  createTrial,
  updateTrial,
  deleteTrial,
} from '@/features/trials/stores/trials-store';
import type { Trial } from '@/features/trials/entities';

export function useTrialCRUD() {
  const createM = useEntityMutation<Partial<Trial>, Trial, Trial>({
    type: 'Trial',
    mutate: createTrial,
    normalize: (raw) => ({ id: raw.id, data: raw }),
    invalidateLists: ['trials'],
  });

  const updateM = useEntityMutation<
    { id: string; patch: Partial<Trial> },
    Trial,
    Trial
  >({
    type: 'Trial',
    mutate: (input) => updateTrial(input.id, input.patch),
    normalize: (raw) => ({ id: raw.id, data: raw }),
    optimistic: (input) => ({ id: input.id, patch: input.patch }),
    invalidateLists: ['trials'],
  });

  const deleteM = useEntityMutation<{ id: string }, void, Trial>({
    type: 'Trial',
    mutate: async ({ id }) => {
      await deleteTrial(id);
    },
    invalidateLists: ['trials'],
  });

  return { create: createM, update: updateM, remove: deleteM };
}
