/**
 * useTrialSegmentCRUD — mutations for trial_segment rows.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityMutation } from '@prometheus-ags/prometheus-entity-management';
import {
  createTrialSegment,
  updateTrialSegment,
  deleteTrialSegment,
} from '@/features/trials/stores/trials-store';
import type { TrialSegment } from '@/features/trials/entities';

export function useTrialSegmentCRUD() {
  const create = useEntityMutation<Partial<TrialSegment>, TrialSegment, TrialSegment>({
    type: 'TrialSegment',
    mutate: createTrialSegment,
    normalize: (raw) => ({ id: raw.id, data: raw }),
    invalidateLists: ['trialSegments'],
  });
  const update = useEntityMutation<
    { id: string; patch: Partial<TrialSegment> },
    TrialSegment,
    TrialSegment
  >({
    type: 'TrialSegment',
    mutate: (input) => updateTrialSegment(input.id, input.patch),
    normalize: (raw) => ({ id: raw.id, data: raw }),
    optimistic: (input) => ({ id: input.id, patch: input.patch }),
    invalidateLists: ['trialSegments'],
  });
  const remove = useEntityMutation<{ id: string }, void, TrialSegment>({
    type: 'TrialSegment',
    mutate: async ({ id }) => {
      await deleteTrialSegment(id);
    },
    invalidateLists: ['trialSegments'],
  });
  return { create, update, remove };
}
