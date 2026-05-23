/**
 * useTrialServiceAssignmentCRUD — mutations for trial_service_assignment rows.
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */
import { useEntityMutation } from '@prometheus-ags/prometheus-entity-management';
import {
  createTrialServiceAssignment,
  updateTrialServiceAssignment,
  deleteTrialServiceAssignment,
} from '@/features/trials/stores/trials-store';
import type { TrialServiceAssignment } from '@/features/trials/entities';

export function useTrialServiceAssignmentCRUD() {
  const create = useEntityMutation<
    Partial<TrialServiceAssignment>,
    TrialServiceAssignment,
    TrialServiceAssignment
  >({
    type: 'TrialServiceAssignment',
    mutate: createTrialServiceAssignment,
    normalize: (raw) => ({ id: raw.id, data: raw }),
    invalidateLists: ['trialServiceAssignments'],
  });
  const update = useEntityMutation<
    { id: string; patch: Partial<TrialServiceAssignment> },
    TrialServiceAssignment,
    TrialServiceAssignment
  >({
    type: 'TrialServiceAssignment',
    mutate: (input) => updateTrialServiceAssignment(input.id, input.patch),
    normalize: (raw) => ({ id: raw.id, data: raw }),
    optimistic: (input) => ({ id: input.id, patch: input.patch }),
    invalidateLists: ['trialServiceAssignments'],
  });
  const remove = useEntityMutation<
    { id: string },
    void,
    TrialServiceAssignment
  >({
    type: 'TrialServiceAssignment',
    mutate: async ({ id }) => {
      await deleteTrialServiceAssignment(id);
    },
    invalidateLists: ['trialServiceAssignments'],
  });
  return { create, update, remove };
}
